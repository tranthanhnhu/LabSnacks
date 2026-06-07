"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useAuth } from "@/context/auth-context";
import { apiFetch, ApiError } from "@/lib/api";
import { toast } from "@/lib/toast";

type RestockRow = {
  id: string;
  quantity: number;
  status: string;
  product: { name: string; sku: string };
  requestedBy: { name: string };
  reviewedBy: { name: string } | null;
};

type ProductOption = { id: string; name: string; sku: string };

export default function RestockPage() {
  const { token, user } = useAuth();
  const qc = useQueryClient();
  const canReview = user?.role.slug === "ADMIN" || user?.role.slug === "MANAGER";

  const list = useQuery({
    queryKey: ["restock"],
    queryFn: () => apiFetch<RestockRow[]>("/api/restock", { token }),
    enabled: !!token,
  });

  const products = useQuery({
    queryKey: ["products"],
    queryFn: () => apiFetch<ProductOption[]>("/api/products", { token }),
    enabled: !!token,
  });

  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("10");
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [approveId, setApproveId] = useState<string | null>(null);

  const createReq = useMutation({
    mutationFn: async () => {
      await apiFetch("/api/restock", {
        method: "POST",
        token,
        body: JSON.stringify({ productId, quantity: Number(quantity) }),
      });
    },
    onSuccess: () => {
      toast.success("Restock request submitted.");
      qc.invalidateQueries({ queryKey: ["restock"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (e) => toast.fromError(e, "Could not submit request."),
  });

  const approve = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/restock/${id}/approve`, { method: "POST", token });
    },
    onSuccess: () => {
      toast.success("Request approved.");
      setApproveId(null);
      qc.invalidateQueries({ queryKey: ["restock"] });
      qc.invalidateQueries({ queryKey: ["inventory"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (e) => toast.fromError(e, "Could not approve."),
  });

  const reject = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      await apiFetch(`/api/restock/${id}/reject`, {
        method: "POST",
        token,
        body: JSON.stringify({ reason: reason || undefined }),
      });
    },
    onSuccess: () => {
      toast.success("Request rejected.");
      setRejectId(null);
      setRejectReason("");
      qc.invalidateQueries({ queryKey: ["restock"] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (e) => toast.fromError(e, "Could not reject."),
  });

  if (list.isLoading) return <p className="text-on-surface-variant">Loading requests…</p>;
  if (list.error)
    return <p className="text-error">{list.error instanceof ApiError ? list.error.message : "Error"}</p>;

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-headline text-5xl font-extrabold tracking-tight text-primary md:text-6xl">
          Protocol &amp; Restock
        </h1>
        <p className="mt-2 text-on-surface-variant">Track and process snack restock requests.</p>
      </header>

      <section className="rounded-[var(--radius-lg)] bg-surface-container-low p-6 sticker-shadow">
        <h2 className="font-headline text-xl font-bold text-on-surface">Create restock request</h2>
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-end">
          <label className="flex flex-1 flex-col gap-1 text-sm font-medium">
            Product
            <select
              className="rounded-2xl bg-surface-container-highest px-4 py-3 ring-1 ring-outline-variant/15"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="">— select —</option>
              {products.data?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </label>
          <label className="flex w-full flex-col gap-1 text-sm font-medium md:w-40">
            Quantity
            <input
              type="number"
              min={1}
              className="rounded-2xl bg-surface-container-highest px-4 py-3 ring-1 ring-outline-variant/15"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
            />
          </label>
          <button
            type="button"
            disabled={!productId || createReq.isPending}
            onClick={() => createReq.mutate()}
            className="gradient-primary rounded-full px-8 py-3 font-headline font-bold text-on-primary disabled:opacity-50"
          >
            Submit request
          </button>
        </div>
      </section>

      <section className="overflow-hidden rounded-[var(--radius-lg)] bg-surface-container-lowest sticker-shadow">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-container-highest font-headline text-on-surface">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Requested by</th>
              <th className="px-4 py-3">Status</th>
              {canReview && <th className="px-4 py-3">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {list.data?.map((r) => (
              <tr key={r.id} className="border-t border-outline-variant/10">
                <td className="px-4 py-3">
                  <div className="font-headline font-bold">{r.product.name}</div>
                  <div className="text-xs text-on-surface-variant">{r.product.sku}</div>
                </td>
                <td className="px-4 py-3 font-bold text-secondary">{r.quantity}</td>
                <td className="px-4 py-3">{r.requestedBy.name}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold ${
                      r.status === "PENDING"
                        ? "bg-tertiary-container text-on-tertiary-container"
                        : r.status === "APPROVED"
                          ? "bg-secondary-container text-on-secondary-container"
                          : "bg-error-container/30 text-error"
                    }`}
                  >
                    {r.status}
                  </span>
                </td>
                {canReview && (
                  <td className="space-x-2 px-4 py-3">
                    {r.status === "PENDING" && (
                      <>
                        <button
                          type="button"
                          className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-on-primary"
                          onClick={() => setApproveId(r.id)}
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          className="rounded-full bg-outline-variant/30 px-3 py-1 text-xs font-bold"
                          onClick={() => {
                            setRejectId(r.id);
                            setRejectReason("");
                          }}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <ConfirmDialog
        open={!!approveId}
        title="Approve restock?"
        message="This will add the requested quantity to inventory."
        confirmLabel="Approve"
        loading={approve.isPending}
        onConfirm={() => approveId && approve.mutate(approveId)}
        onCancel={() => setApproveId(null)}
      />

      {rejectId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            aria-label="Close"
            onClick={() => setRejectId(null)}
          />
          <div className="relative z-10 w-full max-w-md rounded-[var(--radius-lg)] bg-surface-container-lowest p-6 shadow-xl ring-1 ring-outline-variant/15">
            <h2 className="font-headline text-xl font-bold">Reject request</h2>
            <p className="mt-1 text-sm text-on-surface-variant">Provide a reason for the requester.</p>
            <textarea
              className="mt-4 w-full rounded-xl bg-surface-container-highest px-4 py-3 ring-1 ring-outline-variant/15"
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Not enough budget for this cycle."
            />
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setRejectId(null)}
                className="rounded-full px-5 py-2 text-sm font-bold text-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={reject.isPending}
                onClick={() => reject.mutate({ id: rejectId, reason: rejectReason })}
                className="rounded-full bg-error px-5 py-2 text-sm font-bold text-on-primary disabled:opacity-50"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
