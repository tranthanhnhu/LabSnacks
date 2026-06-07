"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";
import { HistoryEntry } from "@/components/history-entry";
import { QrScanner } from "@/components/qr-scanner";
import { QuantityStepper } from "@/components/quantity-stepper";
import { useAuth } from "@/context/auth-context";
import { useSearch } from "@/context/search-context";
import { apiFetch, ApiError } from "@/lib/api";
import { toast } from "@/lib/toast";
import { expiryStatus, formatProductUnit } from "@/lib/unit-label";

type InvRow = {
  id: string;
  quantity: number;
  lowStockThreshold: number;
  product: {
    id: string;
    name: string;
    sku: string;
    category: string;
    imageUrl?: string | null;
    unit?: string;
    unitLabel?: string | null;
    expiryDate?: string | null;
  };
};

type HistoryResponse = {
  items: {
    id: string;
    type: "TAKE" | "RESTOCK" | "ADJUST" | "CREATE";
    delta: number;
    createdAt: string;
    product: { id: string; name: string; sku: string };
    user: { id: string; name: string } | null;
  }[];
};

const FILTERS = [
  { key: "ALL", label: "All" },
  { key: "DRINKS", label: "Drinks" },
  { key: "CANDIES", label: "Candies & Snacks" },
  { key: "FRUITS", label: "Fruits" },
  { key: "NOODLES", label: "Noodles" },
] as const;

export default function InventoryPage() {
  const { token, user } = useAuth();
  const { query: searchQuery } = useSearch();
  const qc = useQueryClient();
  const canEdit = user?.role.slug === "ADMIN" || user?.role.slug === "MANAGER";

  const q = useQuery({
    queryKey: ["inventory"],
    queryFn: () => apiFetch<InvRow[]>("/api/inventory", { token }),
    enabled: !!token,
  });

  const history = useQuery({
    queryKey: ["history", "preview"],
    queryFn: () => apiFetch<HistoryResponse>("/api/history?limit=3", { token }),
    enabled: !!token,
    refetchInterval: 30_000,
  });

  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("ALL");
  const [takeQty, setTakeQty] = useState<Record<string, number>>({});
  const [scanOpen, setScanOpen] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);

  useEffect(() => {
    setHasCamera(typeof navigator !== "undefined" && !!navigator.mediaDevices);
  }, []);

  const quota = useQuery({
    queryKey: ["take-quota"],
    queryFn: () =>
      apiFetch<{ remainingToday: number; maxPerTake: number; role: string }>("/api/me/take-quota", { token }),
    enabled: !!token && user?.role.slug === "STAFF",
  });

  const filtered = useMemo(() => {
    let rows = q.data ?? [];
    if (filter !== "ALL") {
      if (filter === "DRINKS") rows = rows.filter((r) => /drink/i.test(r.product.category));
      else if (filter === "FRUITS") rows = rows.filter((r) => /fruit/i.test(r.product.category));
      else if (filter === "NOODLES") rows = rows.filter((r) => /noodle/i.test(r.product.category));
      else rows = rows.filter((r) => /snack|candy|bakery|chips|cookie/i.test(r.product.category));
    }
    const qLower = searchQuery.trim().toLowerCase();
    if (qLower) {
      rows = rows.filter(
        (r) =>
          r.product.name.toLowerCase().includes(qLower) ||
          r.product.sku.toLowerCase().includes(qLower) ||
          r.product.category.toLowerCase().includes(qLower),
      );
    }
    return rows;
  }, [q.data, filter, searchQuery]);

  const take = useMutation({
    mutationFn: async (input: { productId: string; quantity: number }) => {
      await apiFetch(`/api/inventory/${input.productId}/take`, {
        method: "POST",
        token,
        body: JSON.stringify({ quantity: input.quantity }),
      });
    },
    onSuccess: (_d, vars) => {
      toast.success(`Logged ${vars.quantity} item(s) taken.`);
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["history"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["take-quota"] });
    },
    onError: (e) => toast.fromError(e, "Could not log take."),
  });

  if (q.isLoading) return <p className="text-on-surface-variant">Loading inventory…</p>;
  if (q.error)
    return <p className="text-error">{q.error instanceof ApiError ? q.error.message : "Error"}</p>;

  return (
    <div>
      <section className="mb-12 relative">
        <div className="absolute -top-10 -right-5 opacity-20 pointer-events-none">
          <Image
            alt="Floating Candy"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAftFWc3NYsq7AK2wck71jy631Z-iJL9g6o8H_lRrJcR_1_UeRmEW05NECm04Iym24hY5KP78IKaQHWZPEmSg22KtHcwPjFtaTqxdNoslEBy7LWa0UHW0oGfWj9mFWRrxoCSoijBAuicPb7mVsbIxw9gnSLyltm9CiweBAmt9S0F05wda36sEEekCZIkEDMJ5HeLYKVh146_3V4lLBzvym1C_wIY84ZsA_tky0Jf3XohWX3tz-9SnfVRhlUzTmh52UYLBz2Ua4L6Xg"
            width={220}
            height={220}
          />
        </div>
        <h1 className="text-5xl md:text-6xl font-headline font-extrabold tracking-tight text-primary mb-2">
          Snack Inventory
        </h1>
        <p className="text-on-surface-variant font-medium">
          Keep the lab fueled with 100% happiness and 0% hunger.
        </p>
        {searchQuery && (
          <p className="mt-2 text-sm text-secondary">
            Showing results for &quot;{searchQuery}&quot; ({filtered.length})
          </p>
        )}
        {user?.role.slug === "STAFF" && quota.data && (
          <p className="mt-2 text-sm text-on-surface-variant">
            Daily quota: {quota.data.remainingToday} remaining (max {quota.data.maxPerTake} per take)
          </p>
        )}
        <div className="flex flex-wrap gap-3 mt-8">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={`px-6 py-2.5 rounded-full font-bold bouncy-hover ${
                filter === f.key
                  ? "bg-primary-container text-on-primary-container shadow-md"
                  : "bg-surface-container-low text-on-surface"
              }`}
            >
              {f.label}
            </button>
          ))}
          {canEdit && (
            <>
              <Link
                href="/inventory/import"
                className="px-6 py-2.5 rounded-full font-bold bg-surface-container-highest text-primary bouncy-hover"
              >
                Import CSV
              </Link>
              <Link
                href="/inventory/new"
                className="ml-auto px-6 py-2.5 rounded-full font-bold bg-secondary-container text-on-secondary-container bouncy-hover"
              >
                Add Snack
              </Link>
            </>
          )}
          {hasCamera && (
            <button
              type="button"
              onClick={() => setScanOpen(true)}
              className="px-6 py-2.5 rounded-full font-bold bg-tertiary-container text-on-tertiary-container bouncy-hover"
            >
              Scan SKU
            </button>
          )}
        </div>
      </section>

      {filtered.length === 0 && (
        <p className="mb-12 text-center text-on-surface-variant">No snacks match your filters.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-24">
        {filtered.map((row, i) => {
          const low = row.quantity <= row.lowStockThreshold;
          const rot = i % 2 === 0 ? "-rotate-1" : "rotate-1";
          const unit = formatProductUnit(row.product);
          const exp = expiryStatus(row.product.expiryDate);
          const qty = takeQty[row.product.id] ?? 1;
          const maxTake = user?.role.slug === "STAFF" && quota.data
            ? Math.min(row.quantity, quota.data.maxPerTake, quota.data.remainingToday)
            : row.quantity;
          return (
            <div
              key={row.id}
              className={`bg-surface-container-lowest p-5 rounded-lg sticker-shadow bouncy-hover relative group ${rot}`}
            >
              {low && (
                <div className="absolute top-4 right-4 z-10 bg-error-container text-on-error-container text-[10px] font-bold px-2 py-1 rounded-md rotate-[5deg]">
                  LOW STOCK!
                </div>
              )}
              {exp && (
                <div
                  className={`absolute top-4 left-4 z-10 text-[10px] font-bold px-2 py-1 rounded-md ${
                    exp.tone === "error" ? "bg-error text-on-primary" : "bg-tertiary-container text-on-tertiary-container"
                  }`}
                >
                  {exp.label}
                </div>
              )}
              <Link href={`/inventory/${row.product.id}`} className="block">
                <div className="aspect-square rounded-md bg-surface-container-low mb-6 overflow-hidden flex items-center justify-center">
                  {row.product.imageUrl ? (
                    <Image
                      alt={row.product.name}
                      src={row.product.imageUrl}
                      width={240}
                      height={240}
                      className="w-3/4 h-3/4 object-contain group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-3/4 h-3/4 rounded-md bg-surface-container-highest" />
                  )}
                </div>
              </Link>
              <div className="px-2">
                <div className="flex justify-between items-start mb-1">
                  <Link href={`/inventory/${row.product.id}`}>
                    <h3 className="font-headline font-bold text-xl hover:text-primary">{row.product.name}</h3>
                  </Link>
                  <span className={`${low ? "text-error" : "text-secondary"} font-bold text-lg`}>
                    {row.quantity}{" "}
                    <small className="text-[10px] uppercase tracking-wider text-outline">{unit}</small>
                  </span>
                </div>
                <p className="text-sm text-outline mb-4">
                  {row.product.category} • {row.product.sku}
                </p>
                <div className="mb-3 flex items-center justify-center">
                  <QuantityStepper
                    value={Math.min(qty, maxTake || 1)}
                    min={1}
                    max={Math.max(1, maxTake)}
                    size="sm"
                    onChange={(v) => setTakeQty((prev) => ({ ...prev, [row.product.id]: v }))}
                  />
                </div>
                <button
                  type="button"
                  disabled={row.quantity === 0 || maxTake === 0 || take.isPending}
                  onClick={() => take.mutate({ productId: row.product.id, quantity: Math.min(qty, maxTake) })}
                  className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                >
                  <span className="material-symbols-outlined">touch_app</span> Log Item Taken
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <section className="mb-12 bg-surface-container-low p-8 rounded-[2rem] relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <span className="material-symbols-outlined text-9xl">history_edu</span>
        </div>
        <div className="relative z-10">
          <h2 className="text-3xl font-headline font-extrabold text-primary mb-6 flex items-center gap-3">
            <span className="material-symbols-outlined">receipt_long</span> Recent History
          </h2>
          {history.isLoading && <p className="text-on-surface-variant">Loading…</p>}
          {history.error && (
            <p className="text-error">
              {history.error instanceof ApiError ? history.error.message : "Could not load history."}
            </p>
          )}
          <div className="space-y-4">
            {history.data?.items.map((e) => (
              <HistoryEntry key={e.id} e={e} />
            ))}
          </div>
          <Link href="/history" className="mt-8 text-primary font-bold hover:underline flex items-center gap-2">
            View all history <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>
      </section>

      <QrScanner
        open={scanOpen}
        onClose={() => setScanOpen(false)}
        onScan={(sku) => {
          const match = q.data?.find((r) => r.product.sku.toLowerCase() === sku.toLowerCase());
          if (match) {
            take.mutate({ productId: match.product.id, quantity: 1 });
          } else {
            toast.error(`No product found for SKU: ${sku}`);
          }
        }}
      />
    </div>
  );
}
