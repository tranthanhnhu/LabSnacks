"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth-context";
import { apiFetch, ApiError } from "@/lib/api";

type Summary = {
  productCount: number;
  totalUnits: number;
  pendingRestock: number;
  lowStockAlerts: number;
  snacksByCategory: { category: string; count: number }[];
};

type Trend = { status: string; count: number }[];

export default function AnalyticsPage() {
  const { token, user } = useAuth();
  const allowed = user?.role.slug === "ADMIN" || user?.role.slug === "MANAGER";

  const summary = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: () => apiFetch<Summary>("/api/analytics/summary", { token }),
    enabled: !!token && allowed,
  });

  const trend = useQuery({
    queryKey: ["analytics-trend"],
    queryFn: () => apiFetch<Trend>("/api/analytics/restock-trend", { token }),
    enabled: !!token && allowed,
  });

  if (!allowed) {
    return (
      <div className="rounded-[var(--radius-lg)] bg-error-container/20 p-8 text-center font-headline text-on-surface">
        You do not have permission to view analytics (Admin / Inventory Manager only).
      </div>
    );
  }

  if (summary.isLoading || trend.isLoading) {
    return <p className="text-on-surface-variant">Loading analytics…</p>;
  }
  if (summary.error || trend.error) {
    const e = summary.error ?? trend.error;
    return (
      <p className="text-error">{e instanceof ApiError ? e.message : "Could not load data."}</p>
    );
  }

  const s = summary.data!;
  const maxBar = Math.max(...s.snacksByCategory.map((c) => c.count), 1);

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-headline text-5xl font-extrabold tracking-tight text-primary md:text-6xl">
          Analytics Lab
        </h1>
        <p className="mt-2 text-on-surface-variant">Snacks by category and restock request status.</p>
      </header>

      <div className="grid gap-6 md:grid-cols-4">
        <MiniStat label="Products" value={s.productCount} />
        <MiniStat label="Total units in stock" value={s.totalUnits} />
        <MiniStat label="Pending restock" value={s.pendingRestock} />
        <MiniStat label="Low-stock alerts" value={s.lowStockAlerts} accent="error" />
      </div>

      <section className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-[var(--radius-lg)] bg-surface-container-low p-6 sticker-shadow">
          <h2 className="font-headline text-xl font-bold">Snacks by category</h2>
          <div className="mt-6 space-y-4">
            {s.snacksByCategory.map((c) => (
              <div key={c.category}>
                <div className="mb-1 flex justify-between text-sm font-medium">
                  <span>{c.category}</span>
                  <span className="text-secondary">{c.count}</span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-surface-container-highest">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-primary-container"
                    style={{ width: `${(c.count / maxBar) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] bg-surface-container-low p-6 sticker-shadow">
          <h2 className="font-headline text-xl font-bold">Restock request status</h2>
          <ul className="mt-6 space-y-3">
            {trend.data?.map((t) => (
              <li
                key={t.status}
                className="flex items-center justify-between rounded-xl bg-surface-container-highest px-4 py-3"
              >
                <span className="font-headline font-bold">{t.status}</span>
                <span className="text-2xl font-black text-primary">{t.count}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

function MiniStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "error";
}) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] p-5 sticker-shadow ${
        accent === "error" ? "bg-error-container/20" : "bg-surface-container-lowest"
      }`}
    >
      <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className="mt-2 font-headline text-3xl font-black text-on-surface">{value}</p>
    </div>
  );
}
