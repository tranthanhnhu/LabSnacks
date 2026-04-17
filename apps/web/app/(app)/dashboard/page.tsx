"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { apiFetch, ApiError } from "@/lib/api";

type DashboardData = {
  productCount: number;
  pendingRestock: number;
  lowStockAlerts: number;
  recentRestock: {
    id: string;
    quantity: number;
    status: string;
    product: { name: string; sku: string };
    requestedBy: { name: string };
  }[];
};

export default function DashboardPage() {
  const { token } = useAuth();

  const q = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiFetch<DashboardData>("/api/dashboard", { token }),
    enabled: !!token,
  });

  if (q.isLoading) {
    return <p className="text-on-surface-variant">Loading dashboard…</p>;
  }
  if (q.error) {
    return (
      <p className="text-error">
        {q.error instanceof ApiError ? q.error.message : "Could not load data."}
      </p>
    );
  }

  const d = q.data!;

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-headline text-5xl font-extrabold tracking-tight text-primary md:text-6xl">
          Lab Overview
        </h1>
        <p className="mt-2 font-medium text-on-surface-variant">
          Inventory overview and recent restock activity.
        </p>
      </header>

      <div className="grid gap-6 sm:grid-cols-3">
        <StatCard label="Products in system" value={d.productCount} tone="primary" />
        <StatCard label="Pending restock requests" value={d.pendingRestock} tone="secondary" />
        <StatCard label="Low-stock alerts" value={d.lowStockAlerts} tone="error" />
      </div>

      <section className="rounded-[var(--radius-lg)] bg-surface-container-low p-6 sticker-shadow">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-headline text-2xl font-bold text-on-surface">Recent requests</h2>
          <Link href="/restock" className="text-sm font-bold text-primary hover:underline">
            View all
          </Link>
        </div>
        <ul className="divide-y divide-outline-variant/10">
          {d.recentRestock.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
              <div>
                <div className="font-headline font-bold text-on-surface">{r.product.name}</div>
                <div className="text-on-surface-variant">
                  {r.requestedBy.name} · Qty {r.quantity} · {r.status}
                </div>
              </div>
              <span className="rounded-full bg-surface-container-highest px-3 py-1 text-xs font-bold text-primary">
                {r.product.sku}
              </span>
            </li>
          ))}
          {d.recentRestock.length === 0 && (
            <li className="py-6 text-center text-on-surface-variant">No requests yet.</li>
          )}
        </ul>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "primary" | "secondary" | "error";
}) {
  const bg =
    tone === "primary"
      ? "from-primary/15 to-primary-container/20"
      : tone === "secondary"
        ? "from-secondary-container/30 to-secondary/10"
        : "from-error-container/25 to-error/10";
  return (
    <div
      className={`rounded-[var(--radius-lg)] bg-gradient-to-br ${bg} p-6 sticker-shadow`}
    >
      <p className="text-sm font-medium text-on-surface-variant">{label}</p>
      <p className="mt-2 font-headline text-4xl font-black text-on-surface">{value}</p>
    </div>
  );
}
