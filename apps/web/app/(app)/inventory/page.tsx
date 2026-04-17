"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { apiFetch, ApiError } from "@/lib/api";

type InvRow = {
  id: string;
  quantity: number;
  lowStockThreshold: number;
  product: { id: string; name: string; sku: string; category: string; imageUrl?: string | null };
};

type HistoryRow = {
  id: string;
  type: "TAKE" | "RESTOCK" | "ADJUST" | "CREATE";
  delta: number;
  createdAt: string;
  product: { id: string; name: string; sku: string };
  user: { id: string; name: string } | null;
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
  const qc = useQueryClient();
  const canEdit = user?.role.slug === "ADMIN" || user?.role.slug === "MANAGER";

  const q = useQuery({
    queryKey: ["inventory"],
    queryFn: () => apiFetch<InvRow[]>("/api/inventory", { token }),
    enabled: !!token,
  });

  const history = useQuery({
    queryKey: ["history"],
    queryFn: () => apiFetch<HistoryRow[]>("/api/history", { token }),
    enabled: !!token,
    refetchInterval: 30_000,
  });

  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("ALL");

  const filtered = useMemo(() => {
    const rows = q.data ?? [];
    if (filter === "ALL") return rows;
    if (filter === "DRINKS") return rows.filter((r) => /drink/i.test(r.product.category));
    if (filter === "FRUITS") return rows.filter((r) => /fruit/i.test(r.product.category));
    if (filter === "NOODLES") return rows.filter((r) => /noodle/i.test(r.product.category));
    return rows.filter((r) => /snack|candy|bakery|chips|cookie/i.test(r.product.category));
  }, [q.data, filter]);

  const take = useMutation({
    mutationFn: async (input: { productId: string; quantity: number }) => {
      await apiFetch(`/api/inventory/${input.productId}/take`, {
        method: "POST",
        token,
        body: JSON.stringify({ quantity: input.quantity }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["history"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
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
            <Link
              href="/inventory/new"
              className="ml-auto px-6 py-2.5 rounded-full font-bold bg-secondary-container text-on-secondary-container bouncy-hover"
            >
              Add Snack
            </Link>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 mb-24">
        {filtered.map((row, i) => {
          const low = row.quantity <= row.lowStockThreshold;
          const rot = i % 2 === 0 ? "-rotate-1" : "rotate-1";
          const unit = /drink/i.test(row.product.category)
            ? "bottles"
            : /noodle/i.test(row.product.category)
              ? "cups"
              : /fruit/i.test(row.product.category)
                ? "pcs"
                : "packs";
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
              <div className="px-2">
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-headline font-bold text-xl">{row.product.name}</h3>
                  <span className={`${low ? "text-error" : "text-secondary"} font-bold text-lg`}>
                    {row.quantity}{" "}
                    <small className="text-[10px] uppercase tracking-wider text-outline">{unit}</small>
                  </span>
                </div>
                <p className="text-sm text-outline mb-6">
                  {row.product.category} • {row.product.sku}
                </p>
                <button
                  type="button"
                  onClick={() => take.mutate({ productId: row.product.id, quantity: 1 })}
                  className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary py-3 rounded-xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all"
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
          <h2 className="text-3xl font-headline font-extrabold text-rose-800 mb-6 flex items-center gap-3">
            <span className="material-symbols-outlined">receipt_long</span> Recent History
          </h2>
          {history.isLoading && <p className="text-on-surface-variant">Loading…</p>}
          {history.error && (
            <p className="text-error">
              {history.error instanceof ApiError ? history.error.message : "Could not load history."}
            </p>
          )}
          <div className="space-y-4">
            {history.data?.slice(0, 3).map((e) => {
              const actor = e.user?.name ?? (e.delta > 0 ? "System" : "Unknown");
              const verb = e.delta < 0 ? "just took" : e.delta > 0 ? "restocked" : "updated";
              const badge =
                e.delta < 0
                  ? "bg-pink-100 text-pink-700"
                  : e.delta > 0
                    ? "bg-secondary-container text-secondary"
                    : "bg-white/70 text-outline";
              const iconWrap =
                e.delta < 0
                  ? "bg-tertiary-container text-tertiary"
                  : e.delta > 0
                    ? "bg-outline-variant text-white"
                    : "bg-secondary-container text-secondary";
              return (
                <div
                  key={e.id}
                  className="flex items-center gap-4 bg-white/60 p-4 rounded-2xl shadow-sm hover:translate-x-2 transition-transform"
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${iconWrap}`}>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                      person
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold">
                      {actor} <span className="font-normal text-outline">{verb}</span> {Math.abs(e.delta)}x{" "}
                      {e.product.name}
                    </p>
                    <p className="text-xs text-outline-variant">
                      {new Date(e.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className={`text-xs font-bold px-3 py-1 rounded-full ${badge}`}>
                    {e.delta > 0 ? `+${e.delta} items` : `${e.delta} item${Math.abs(e.delta) === 1 ? "" : "s"}`}
                  </div>
                </div>
              );
            })}
          </div>
          <Link href="/history" className="mt-8 text-primary font-bold hover:underline flex items-center gap-2">
            View all history <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
