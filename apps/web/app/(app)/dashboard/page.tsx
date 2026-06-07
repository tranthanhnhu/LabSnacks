"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/context/auth-context";
import { apiFetch, ApiError } from "@/lib/api";

type RestockItem = {
  id: string;
  quantity: number;
  status: string;
  product: { name: string; sku: string };
  requestedBy: { name: string };
};

type StaffDashboard = {
  role: "STAFF";
  myRequests: RestockItem[];
  takeQuota: { remainingToday: number; maxPerDay: number; maxPerTake: number; usedToday: number };
  popularSnacks: { product?: { name: string; sku: string }; takeCount: number }[];
};

type ManagerDashboard = {
  role: "MANAGER";
  productCount: number;
  pendingRestock: number;
  lowStockAlerts: number;
  recentRestock: RestockItem[];
  pendingQueue: RestockItem[];
};

type AdminDashboard = {
  role: "ADMIN";
  productCount: number;
  pendingRestock: number;
  lowStockAlerts: number;
  recentRestock: RestockItem[];
  userCount: number;
};

type DashboardData = StaffDashboard | ManagerDashboard | AdminDashboard;

export default function DashboardPage() {
  const { token } = useAuth();

  const q = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => apiFetch<DashboardData>("/api/dashboard", { token }),
    enabled: !!token,
  });

  if (q.isLoading) return <p className="text-on-surface-variant">Loading dashboard…</p>;
  if (q.error)
    return <p className="text-error">{q.error instanceof ApiError ? q.error.message : "Could not load data."}</p>;

  const d = q.data!;

  if (d.role === "STAFF") return <StaffView d={d} />;
  if (d.role === "MANAGER") return <ManagerView d={d} />;
  return <AdminView d={d} />;
}

function StaffView({ d }: { d: StaffDashboard }) {
  return (
    <div className="space-y-10">
      <PageHeader title="Lab Overview" subtitle="Your snack activity and daily quota." />
      <div className="grid gap-6 sm:grid-cols-3">
        <StatCard label="Remaining today" value={d.takeQuota.remainingToday} tone="primary" />
        <StatCard label="Used today" value={d.takeQuota.usedToday} tone="secondary" />
        <StatCard label="Max per take" value={d.takeQuota.maxPerTake} tone="secondary" />
      </div>
      <RequestList title="My requests" items={d.myRequests} />
      {d.popularSnacks.length > 0 && (
        <section className="rounded-[var(--radius-lg)] bg-surface-container-low p-6 sticker-shadow">
          <h2 className="font-headline text-xl font-bold">Popular snacks</h2>
          <ul className="mt-4 space-y-2">
            {d.popularSnacks.map((s, i) => (
              <li key={i} className="flex justify-between text-sm">
                <span>{s.product?.name ?? "Unknown"}</span>
                <span className="font-bold text-secondary">{s.takeCount} taken</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function ManagerView({ d }: { d: ManagerDashboard }) {
  return (
    <div className="space-y-10">
      <PageHeader title="Lab Overview" subtitle="Inventory and approval queue." />
      <div className="grid gap-6 sm:grid-cols-3">
        <StatCard label="Products" value={d.productCount} tone="primary" />
        <StatCard label="Pending restock" value={d.pendingRestock} tone="secondary" />
        <StatCard label="Low-stock alerts" value={d.lowStockAlerts} tone="error" />
      </div>
      <RequestList title="Approval queue" items={d.pendingQueue} empty="No pending approvals." />
      <RequestList title="Recent requests" items={d.recentRestock} />
    </div>
  );
}

function AdminView({ d }: { d: AdminDashboard }) {
  return (
    <div className="space-y-10">
      <PageHeader title="Lab Overview" subtitle="Full system overview." />
      <div className="grid gap-6 sm:grid-cols-4">
        <StatCard label="Products" value={d.productCount} tone="primary" />
        <StatCard label="Users" value={d.userCount} tone="secondary" />
        <StatCard label="Pending restock" value={d.pendingRestock} tone="secondary" />
        <StatCard label="Low-stock alerts" value={d.lowStockAlerts} tone="error" />
      </div>
      <RequestList title="Recent requests" items={d.recentRestock} />
    </div>
  );
}

function RequestList({
  title,
  items,
  empty = "No requests yet.",
}: {
  title: string;
  items: RestockItem[];
  empty?: string;
}) {
  return (
    <section className="rounded-[var(--radius-lg)] bg-surface-container-low p-6 sticker-shadow">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-headline text-2xl font-bold">{title}</h2>
        <Link href="/restock" className="text-sm font-bold text-primary hover:underline">
          View all
        </Link>
      </div>
      <ul className="divide-y divide-outline-variant/10">
        {items.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
            <div>
              <div className="font-headline font-bold">{r.product.name}</div>
              <div className="text-on-surface-variant">
                {r.requestedBy.name} · Qty {r.quantity} · {r.status}
              </div>
            </div>
            <span className="rounded-full bg-surface-container-highest px-3 py-1 text-xs font-bold text-primary">
              {r.product.sku}
            </span>
          </li>
        ))}
        {items.length === 0 && <li className="py-6 text-center text-on-surface-variant">{empty}</li>}
      </ul>
    </section>
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
    <div className={`rounded-[var(--radius-lg)] bg-gradient-to-br ${bg} p-6 sticker-shadow`}>
      <p className="text-sm font-medium text-on-surface-variant">{label}</p>
      <p className="mt-2 font-headline text-4xl font-black">{value}</p>
    </div>
  );
}
