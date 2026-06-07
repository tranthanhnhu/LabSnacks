"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/context/auth-context";
import { apiFetch, ApiError } from "@/lib/api";
import { downloadCsv } from "@/lib/export-csv";

type Summary = {
  productCount: number;
  totalUnits: number;
  pendingRestock: number;
  lowStockAlerts: number;
  snacksByCategory: { category: string; count: number }[];
};

export default function AnalyticsPage() {
  const { token } = useAuth();

  const summary = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: () => apiFetch<Summary>("/api/analytics/summary", { token }),
    enabled: !!token,
  });

  const restockTrend = useQuery({
    queryKey: ["analytics-trend"],
    queryFn: () => apiFetch<{ status: string; count: number }[]>("/api/analytics/restock-trend", { token }),
    enabled: !!token,
  });

  const takeTrend = useQuery({
    queryKey: ["analytics-take-trend"],
    queryFn: () =>
      apiFetch<{ period: string; count: number }[]>("/api/analytics/take-trend?granularity=week", { token }),
    enabled: !!token,
  });

  const topProducts = useQuery({
    queryKey: ["analytics-top"],
    queryFn: () =>
      apiFetch<{ product?: { name: string; sku: string }; takeCount: number }[]>(
        "/api/analytics/top-products?limit=8",
        { token },
      ),
    enabled: !!token,
  });

  const approvalTime = useQuery({
    queryKey: ["analytics-approval"],
    queryFn: () => apiFetch<{ averageHours: number; sampleSize: number }>("/api/analytics/restock-approval-time", {
      token,
    }),
    enabled: !!token,
  });

  const expiry = useQuery({
    queryKey: ["analytics-expiry"],
    queryFn: () =>
      apiFetch<
        { id: string; name: string; sku: string; expiryDate: string; daysLeft: number | null; expired: boolean }[]
      >("/api/analytics/expiry?withinDays=30", { token }),
    enabled: !!token,
  });

  const loading =
    summary.isLoading ||
    restockTrend.isLoading ||
    takeTrend.isLoading ||
    topProducts.isLoading ||
    approvalTime.isLoading;

  if (loading) return <p className="text-on-surface-variant">Loading analytics…</p>;
  if (summary.error)
    return <p className="text-error">{summary.error instanceof ApiError ? summary.error.message : "Error"}</p>;

  const s = summary.data!;
  const maxBar = Math.max(...s.snacksByCategory.map((c) => c.count), 1);

  return (
    <div className="space-y-10">
      <PageHeader title="Analytics Lab" subtitle="Consumption trends, top snacks, and expiry report.">
        <button
          type="button"
          onClick={() =>
            downloadCsv(
              "analytics-summary.csv",
              s.snacksByCategory.map((c) => ({ category: c.category, count: c.count })),
            )
          }
          className="rounded-full bg-primary px-6 py-2 text-sm font-bold text-on-primary"
        >
          Export CSV
        </button>
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-5">
        <MiniStat label="Products" value={s.productCount} />
        <MiniStat label="Total units" value={s.totalUnits} />
        <MiniStat label="Pending restock" value={s.pendingRestock} />
        <MiniStat label="Low-stock" value={s.lowStockAlerts} accent="error" />
        <MiniStat
          label="Avg approval (hrs)"
          value={approvalTime.data?.averageHours ?? 0}
          suffix={approvalTime.data ? `n=${approvalTime.data.sampleSize}` : undefined}
        />
      </div>

      <section className="grid gap-8 lg:grid-cols-2">
        <ChartCard title="Consumption by week">
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={takeTrend.data ?? []}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="var(--color-primary)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top snacks taken">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={(topProducts.data ?? []).map((t) => ({
                name: t.product?.name ?? "?",
                count: t.takeCount,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} textAnchor="end" height={60} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="var(--color-primary-container)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

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
          <h2 className="font-headline text-xl font-bold">Restock status</h2>
          <ul className="mt-6 space-y-3">
            {restockTrend.data?.map((t) => (
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

      {(expiry.data?.length ?? 0) > 0 && (
        <section className="rounded-[var(--radius-lg)] bg-surface-container-low p-6 sticker-shadow">
          <h2 className="font-headline text-xl font-bold">Expiry report (30 days)</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {expiry.data?.map((p) => (
              <li key={p.id} className="flex justify-between rounded-xl bg-surface-container-highest px-4 py-3">
                <span>
                  {p.name} ({p.sku})
                </span>
                <span className={p.expired ? "font-bold text-error" : "text-secondary"}>
                  {p.expired ? "Expired" : `${p.daysLeft}d left`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[var(--radius-lg)] bg-surface-container-low p-6 sticker-shadow">
      <h2 className="font-headline text-xl font-bold">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  accent,
  suffix,
}: {
  label: string;
  value: number;
  accent?: "error";
  suffix?: string;
}) {
  return (
    <div
      className={`rounded-[var(--radius-lg)] p-5 sticker-shadow ${
        accent === "error" ? "bg-error-container/20" : "bg-surface-container-lowest"
      }`}
    >
      <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{label}</p>
      <p className="mt-2 font-headline text-3xl font-black">{value}</p>
      {suffix && <p className="text-xs text-outline">{suffix}</p>}
    </div>
  );
}
