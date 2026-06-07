"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { EmptyState } from "@/components/empty-state";
import { HistoryEntry } from "@/components/history-entry";
import { LoadingSkeleton } from "@/components/loading-skeleton";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/context/auth-context";
import { apiFetch, ApiError } from "@/lib/api";
import { downloadCsv } from "@/lib/export-csv";

type HistoryRow = {
  id: string;
  type: "TAKE" | "RESTOCK" | "ADJUST" | "CREATE";
  delta: number;
  note: string | null;
  createdAt: string;
  product: { id: string; name: string; sku: string };
  user: { id: string; name: string } | null;
};

type HistoryResponse = {
  items: HistoryRow[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

type ProductOption = { id: string; name: string; sku: string };
type UserOption = { id: string; name: string; email: string };

const LOG_TYPES = ["", "TAKE", "RESTOCK", "ADJUST", "CREATE"] as const;

export default function HistoryPage() {
  const { token, user } = useAuth();
  const canFilterUser = user?.role.slug === "ADMIN" || user?.role.slug === "MANAGER";

  const [page, setPage] = useState(1);
  const [type, setType] = useState("");
  const [productId, setProductId] = useState("");
  const [userId, setUserId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const queryString = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("limit", "20");
    if (type) p.set("type", type);
    if (productId) p.set("productId", productId);
    if (userId && canFilterUser) p.set("userId", userId);
    if (from) p.set("from", new Date(from).toISOString());
    if (to) p.set("to", new Date(`${to}T23:59:59`).toISOString());
    return p.toString();
  }, [page, type, productId, userId, from, to, canFilterUser]);

  const q = useQuery({
    queryKey: ["history", queryString],
    queryFn: () => apiFetch<HistoryResponse>(`/api/history?${queryString}`, { token }),
    enabled: !!token,
    refetchInterval: 30_000,
  });

  const products = useQuery({
    queryKey: ["products"],
    queryFn: () => apiFetch<ProductOption[]>("/api/products", { token }),
    enabled: !!token,
  });

  const users = useQuery({
    queryKey: ["users"],
    queryFn: () => apiFetch<UserOption[]>("/api/users", { token }),
    enabled: !!token && canFilterUser,
  });

  return (
    <div className="space-y-8">
      <PageHeader title="History" subtitle="Filter and browse inventory activity.">
        <button
          type="button"
          disabled={!q.data?.items.length}
          onClick={() =>
            q.data &&
            downloadCsv(
              "inventory-history.csv",
              q.data.items.map((e) => ({
                date: e.createdAt,
                type: e.type,
                product: e.product.name,
                sku: e.product.sku,
                user: e.user?.name ?? "",
                delta: e.delta,
                note: e.note ?? "",
              })),
            )
          }
          className="rounded-full bg-primary px-6 py-2 text-sm font-bold text-on-primary disabled:opacity-50"
        >
          Export CSV
        </button>
      </PageHeader>

      <section className="rounded-[var(--radius-lg)] bg-surface-container-low p-4 sticker-shadow">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-xs font-bold uppercase text-outline">
            Type
            <select
              className="mt-1 w-full rounded-xl bg-surface-container-highest px-3 py-2 text-sm"
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
            >
              {LOG_TYPES.map((t) => (
                <option key={t || "all"} value={t}>
                  {t || "All types"}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-bold uppercase text-outline">
            Product
            <select
              className="mt-1 w-full rounded-xl bg-surface-container-highest px-3 py-2 text-sm"
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                setPage(1);
              }}
            >
              <option value="">All products</option>
              {products.data?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          {canFilterUser && (
            <label className="text-xs font-bold uppercase text-outline">
              User
              <select
                className="mt-1 w-full rounded-xl bg-surface-container-highest px-3 py-2 text-sm"
                value={userId}
                onChange={(e) => {
                  setUserId(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All users</option>
                {users.data?.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="text-xs font-bold uppercase text-outline">
            From
            <input
              type="date"
              className="mt-1 w-full rounded-xl bg-surface-container-highest px-3 py-2 text-sm"
              value={from}
              onChange={(e) => {
                setFrom(e.target.value);
                setPage(1);
              }}
            />
          </label>
          <label className="text-xs font-bold uppercase text-outline">
            To
            <input
              type="date"
              className="mt-1 w-full rounded-xl bg-surface-container-highest px-3 py-2 text-sm"
              value={to}
              onChange={(e) => {
                setTo(e.target.value);
                setPage(1);
              }}
            />
          </label>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-[var(--radius-lg)] bg-surface-container-low p-8">
        {q.isLoading && <LoadingSkeleton rows={5} />}
        {q.error && (
          <p className="text-error">
            {q.error instanceof ApiError ? q.error.message : "Could not load history."}
          </p>
        )}
        {q.data?.items.length === 0 && !q.isLoading && (
          <EmptyState title="No activity found" message="Try adjusting your filters." />
        )}
        <div className="space-y-4">
          {q.data?.items.map((e) => (
            <HistoryEntry key={e.id} e={e} />
          ))}
        </div>
        {q.data && q.data.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-full bg-surface-container-highest px-4 py-2 text-sm font-bold disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-sm text-on-surface-variant">
              Page {q.data.page} of {q.data.totalPages} ({q.data.total} total)
            </span>
            <button
              type="button"
              disabled={page >= q.data.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-full bg-surface-container-highest px-4 py-2 text-sm font-bold disabled:opacity-40"
            >
              Next
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
