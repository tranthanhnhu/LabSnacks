"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { apiFetch, ApiError } from "@/lib/api";

type InvRow = {
  id: string;
  quantity: number;
  lowStockThreshold: number;
  product: { id: string; name: string; sku: string; category: string };
};

export default function InventoryPage() {
  const { token, user } = useAuth();
  const qc = useQueryClient();
  const canEdit = user?.role.slug === "ADMIN" || user?.role.slug === "MANAGER";

  const q = useQuery({
    queryKey: ["inventory"],
    queryFn: () => apiFetch<InvRow[]>("/api/inventory", { token }),
    enabled: !!token,
  });

  const [editing, setEditing] = useState<string | null>(null);
  const [qty, setQty] = useState("");
  const [thr, setThr] = useState("");

  const saveInv = useMutation({
    mutationFn: async (input: { productId: string; quantity: number; lowStockThreshold: number }) => {
      await apiFetch(`/api/inventory/${input.productId}/quantity`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ quantity: input.quantity }),
      });
      await apiFetch(`/api/inventory/${input.productId}/threshold`, {
        method: "PATCH",
        token,
        body: JSON.stringify({ lowStockThreshold: input.lowStockThreshold }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      setEditing(null);
    },
  });

  if (q.isLoading) return <p className="text-on-surface-variant">Loading inventory…</p>;
  if (q.error)
    return <p className="text-error">{q.error instanceof ApiError ? q.error.message : "Error"}</p>;

  return (
    <div className="space-y-10">
      <header className="relative">
        <h1 className="font-headline text-5xl font-extrabold tracking-tight text-primary md:text-6xl">
          Snack Inventory
        </h1>
        <p className="mt-2 font-medium text-on-surface-variant">
          Keep the lab fueled with clear, honest stock levels.
        </p>
      </header>

      <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
        {q.data?.map((row, i) => {
          const low = row.quantity <= row.lowStockThreshold;
          const rot = i % 2 === 0 ? "-rotate-1" : "rotate-1";
          return (
            <div
              key={row.id}
              className={`relative rounded-lg bg-surface-container-lowest p-5 sticker-shadow bouncy-hover ${rot}`}
            >
              {low && (
                <div className="absolute right-4 top-4 z-10 rotate-[5deg] rounded-md bg-error-container px-2 py-1 text-[10px] font-bold text-on-error-container">
                  LOW STOCK!
                </div>
              )}
              <div className="mb-4 aspect-square rounded-md bg-surface-container-low" />
              <div className="px-1">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <h3 className="font-headline text-xl font-bold">{row.product.name}</h3>
                  <span className={`font-headline text-lg font-bold ${low ? "text-error" : "text-secondary"}`}>
                    {row.quantity}
                  </span>
                </div>
                <p className="mb-4 text-sm text-outline">
                  {row.product.category} · {row.product.sku}
                </p>
                {canEdit && editing === row.product.id ? (
                  <div className="flex flex-col gap-2 rounded-xl bg-surface-container-highest p-3 text-sm">
                    <label className="flex flex-col gap-1">
                      Quantity
                      <input
                        className="rounded-lg px-2 py-1"
                        type="number"
                        value={qty}
                        onChange={(e) => setQty(e.target.value)}
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      Low-stock threshold
                      <input
                        className="rounded-lg px-2 py-1"
                        type="number"
                        value={thr}
                        onChange={(e) => setThr(e.target.value)}
                      />
                    </label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="flex-1 rounded-full bg-primary py-2 font-bold text-on-primary"
                        onClick={() =>
                          saveInv.mutate({
                            productId: row.product.id,
                            quantity: Number(qty || row.quantity),
                            lowStockThreshold: Number(thr || row.lowStockThreshold),
                          })
                        }
                      >
                        Save
                      </button>
                      <button type="button" className="rounded-full px-3 py-2" onClick={() => setEditing(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    disabled={!canEdit}
                    onClick={() => {
                      setEditing(row.product.id);
                      setQty(String(row.quantity));
                      setThr(String(row.lowStockThreshold));
                    }}
                    className="gradient-primary flex w-full items-center justify-center gap-2 rounded-xl py-3 font-headline font-bold text-on-primary transition active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <span className="material-symbols-outlined">edit</span>
                    {canEdit ? "Edit quantity / threshold" : "Managers can edit stock"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
