"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { HistoryEntry } from "@/components/history-entry";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { QuantityStepper } from "@/components/quantity-stepper";
import { useAuth } from "@/context/auth-context";
import { apiFetch, ApiError, apiUrl } from "@/lib/api";
import { toast } from "@/lib/toast";
import { PRODUCT_UNITS } from "@/lib/unit-label";

type ProductDetail = {
  id: string;
  name: string;
  sku: string;
  category: string;
  description: string | null;
  imageUrl: string | null;
  unit?: string;
  unitLabel?: string | null;
  expiryDate?: string | null;
  inventory: { quantity: number; lowStockThreshold: number } | null;
};

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { token, user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const canEdit = user?.role.slug === "ADMIN" || user?.role.slug === "MANAGER";
  const isAdmin = user?.role.slug === "ADMIN";

  const product = useQuery({
    queryKey: ["product", id],
    queryFn: () => apiFetch<ProductDetail>(`/api/products/${id}`, { token }),
    enabled: !!token,
  });

  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [threshold, setThreshold] = useState(0);
  const [unit, setUnit] = useState("PIECE");
  const [unitLabel, setUnitLabel] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [tab, setTab] = useState<"details" | "history">("details");

  const productHistory = useQuery({
    queryKey: ["product-history", id],
    queryFn: () =>
      apiFetch<{ items: Parameters<typeof HistoryEntry>[0]["e"][] }>(
        `/api/products/${id}/history?limit=20`,
        { token },
      ),
    enabled: !!token && tab === "history",
  });

  useEffect(() => {
    if (!product.data) return;
    setName(product.data.name);
    setCategory(product.data.category);
    setDescription(product.data.description ?? "");
    setImageUrl(product.data.imageUrl ?? "");
    if (product.data.inventory) {
      setQuantity(product.data.inventory.quantity);
      setThreshold(product.data.inventory.lowStockThreshold);
    }
    setUnit(product.data.unit ?? "PIECE");
    setUnitLabel(product.data.unitLabel ?? "");
    setExpiryDate(product.data.expiryDate ? product.data.expiryDate.slice(0, 10) : "");
  }, [product.data]);

  const saveProduct = useMutation({
    mutationFn: async () => {
      await apiFetch(`/api/products/${id}`, {
        method: "PATCH",
        token,
        body: JSON.stringify({
          name,
          category,
          description: description || null,
          imageUrl: imageUrl || null,
          unit,
          unitLabel: unitLabel || null,
          expiryDate: expiryDate || null,
        }),
      });
    },
    onSuccess: () => {
      toast.success("Product updated.");
      qc.invalidateQueries({ queryKey: ["product", id] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    },
    onError: (e) => toast.fromError(e, "Could not update product."),
  });

  const saveQuantity = useMutation({
    mutationFn: async () => {
      await apiFetch(`/api/inventory/${id}/quantity`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ quantity }),
      });
    },
    onSuccess: () => {
      toast.success("Stock quantity updated.");
      qc.invalidateQueries({ queryKey: ["product", id] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["history"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (e) => toast.fromError(e, "Could not update quantity."),
  });

  const saveThreshold = useMutation({
    mutationFn: async () => {
      await apiFetch(`/api/inventory/${id}/threshold`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ lowStockThreshold: threshold }),
      });
    },
    onSuccess: () => {
      toast.success("Low-stock threshold updated.");
      qc.invalidateQueries({ queryKey: ["product", id] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
    },
    onError: (e) => toast.fromError(e, "Could not update threshold."),
  });

  const removeProduct = useMutation({
    mutationFn: async () => {
      await apiFetch(`/api/products/${id}`, { method: "DELETE", token });
    },
    onSuccess: () => {
      toast.success("Product deleted.");
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      router.push("/inventory");
    },
    onError: (e) => toast.fromError(e, "Could not delete product."),
  });

  const upload = useMutation({
    mutationFn: async (f: File) => {
      const form = new FormData();
      form.set("file", f);
      const res = await fetch(apiUrl("/api/uploads"), {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new ApiError(data?.error ?? "UPLOAD_FAILED", res.status, data?.details);
      return data as { url: string };
    },
    onSuccess: (d) => {
      setImageUrl(apiUrl(d.url));
      toast.success("Image uploaded.");
    },
    onError: () => toast.error("Image upload failed."),
  });

  if (product.isLoading) return <p className="text-on-surface-variant">Loading product…</p>;
  if (product.error || !product.data)
    return <p className="text-error">{product.error instanceof ApiError ? product.error.message : "Not found."}</p>;

  const p = product.data;
  const low = p.inventory && p.inventory.quantity <= p.inventory.lowStockThreshold;

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-center gap-2 text-sm">
        <Link href="/inventory" className="font-bold text-primary hover:underline">
          ← Inventory
        </Link>
      </div>

      <header className="flex flex-wrap items-start gap-6">
        <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-xl bg-surface-container-low">
          {p.imageUrl ? (
            <Image src={p.imageUrl} alt={p.name} width={128} height={128} className="object-contain" />
          ) : (
            <span className="material-symbols-outlined text-4xl text-outline">cookie</span>
          )}
        </div>
        <div>
          <h1 className="font-headline text-4xl font-extrabold text-primary">{p.name}</h1>
          <p className="text-on-surface-variant">
            {p.sku} · {p.category}
          </p>
          {p.inventory && (
            <p className={`mt-2 font-bold ${low ? "text-error" : "text-secondary"}`}>
              In stock: {p.inventory.quantity}
              {low && " (LOW STOCK)"}
            </p>
          )}
        </div>
      </header>

      <div className="flex gap-2 border-b border-outline-variant/15 pb-2">
        <button
          type="button"
          onClick={() => setTab("details")}
          className={`rounded-full px-4 py-2 text-sm font-bold ${tab === "details" ? "bg-primary text-on-primary" : "text-on-surface-variant"}`}
        >
          Details
        </button>
        <button
          type="button"
          onClick={() => setTab("history")}
          className={`rounded-full px-4 py-2 text-sm font-bold ${tab === "history" ? "bg-primary text-on-primary" : "text-on-surface-variant"}`}
        >
          History
        </button>
      </div>

      {tab === "history" && (
        <section className="rounded-[var(--radius-lg)] bg-surface-container-low p-6 sticker-shadow">
          <h2 className="font-headline text-xl font-bold">Product history</h2>
          {productHistory.isLoading && <LoadingSkeleton rows={4} />}
          {productHistory.data?.items.length === 0 && (
            <EmptyState title="No history yet" message="Activity for this product will appear here." />
          )}
          <div className="mt-4 space-y-3">
            {productHistory.data?.items.map((e) => (
              <HistoryEntry key={e.id} e={e} />
            ))}
          </div>
        </section>
      )}

      {tab === "details" && canEdit && (
        <section className="rounded-[var(--radius-lg)] bg-surface-container-low p-6 sticker-shadow">
          <h2 className="font-headline text-xl font-bold">Edit product</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Name">
              <input
                className="w-full rounded-xl bg-surface-container-highest px-4 py-4 ring-1 ring-outline-variant/15 focus:ring-2 focus:ring-primary"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </Field>
            <Field label="Category">
              <input
                className="w-full rounded-xl bg-surface-container-highest px-4 py-4 ring-1 ring-outline-variant/15 focus:ring-2 focus:ring-primary"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
            </Field>
            <Field label="Image URL">
              <input
                className="w-full rounded-xl bg-surface-container-highest px-4 py-4 ring-1 ring-outline-variant/15 focus:ring-2 focus:ring-primary"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </Field>
            <Field label="Upload image">
              <input
                type="file"
                accept="image/*"
                className="w-full rounded-xl bg-surface-container-highest px-4 py-4 ring-1 ring-outline-variant/15 focus:ring-2 focus:ring-primary"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) upload.mutate(f);
                }}
              />
            </Field>
            <Field label="Unit">
              <select
                className="w-full rounded-xl bg-surface-container-highest px-4 py-4 ring-1 ring-outline-variant/15"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              >
                {PRODUCT_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Unit label">
              <input
                className="w-full rounded-xl bg-surface-container-highest px-4 py-4 ring-1 ring-outline-variant/15"
                value={unitLabel}
                onChange={(e) => setUnitLabel(e.target.value)}
              />
            </Field>
            <Field label="Expiry date">
              <input
                type="date"
                className="w-full rounded-xl bg-surface-container-highest px-4 py-4 ring-1 ring-outline-variant/15"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
              />
            </Field>
          </div>
          <Field label="Description">
            <textarea
              className="w-full rounded-xl bg-surface-container-highest px-4 py-4 ring-1 ring-outline-variant/15 focus:ring-2 focus:ring-primary"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <button
            type="button"
            disabled={saveProduct.isPending}
            onClick={() => saveProduct.mutate()}
            className="mt-4 rounded-full bg-primary px-8 py-3 font-headline font-bold text-on-primary disabled:opacity-50"
          >
            Save changes
          </button>
        </section>
      )}

      {tab === "details" && canEdit && p.inventory && (
        <section className="rounded-[var(--radius-lg)] bg-surface-container-low p-6 sticker-shadow">
          <h2 className="font-headline text-xl font-bold">Stock controls</h2>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-outline">Quantity</p>
              <div className="mt-2 flex items-center gap-4">
                <QuantityStepper value={quantity} min={0} max={9999} onChange={setQuantity} />
                <button
                  type="button"
                  disabled={saveQuantity.isPending}
                  onClick={() => saveQuantity.mutate()}
                  className="rounded-full bg-secondary px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-50"
                >
                  Update
                </button>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-outline">Low-stock threshold</p>
              <div className="mt-2 flex items-center gap-4">
                <QuantityStepper value={threshold} min={0} max={9999} onChange={setThreshold} />
                <button
                  type="button"
                  disabled={saveThreshold.isPending}
                  onClick={() => saveThreshold.mutate()}
                  className="rounded-full bg-secondary px-4 py-2 text-sm font-bold text-on-primary disabled:opacity-50"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {tab === "details" && isAdmin && (
        <section className="rounded-[var(--radius-lg)] border border-error/20 bg-error-container/10 p-6">
          <h2 className="font-headline text-lg font-bold text-error">Danger zone</h2>
          <p className="mt-1 text-sm text-on-surface-variant">Permanently delete this product and its inventory.</p>
          <button
            type="button"
            onClick={() => setDeleteOpen(true)}
            className="mt-4 rounded-full bg-error px-6 py-2 text-sm font-bold text-on-primary"
          >
            Delete product
          </button>
        </section>
      )}

      <ConfirmDialog
        open={deleteOpen}
        title="Delete product?"
        message={`This will permanently remove "${p.name}" and all related data.`}
        confirmLabel="Delete"
        destructive
        loading={removeProduct.isPending}
        onConfirm={() => removeProduct.mutate()}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <div className="pl-2 text-xs font-bold uppercase tracking-widest text-outline">{label}</div>
      <div className="mt-2">{children}</div>
    </label>
  );
}
