"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { apiFetch, ApiError } from "@/lib/api";

type HistoryRow = {
  id: string;
  type: "TAKE" | "RESTOCK" | "ADJUST" | "CREATE";
  delta: number;
  note: string | null;
  createdAt: string;
  product: { id: string; name: string; sku: string };
  user: { id: string; name: string } | null;
};

function formatDelta(delta: number) {
  return delta > 0 ? `+${delta} items` : `${delta} item${Math.abs(delta) === 1 ? "" : "s"}`;
}

export default function HistoryPage() {
  const { token } = useAuth();
  const q = useQuery({
    queryKey: ["history"],
    queryFn: () => apiFetch<HistoryRow[]>("/api/history", { token }),
    enabled: !!token,
    refetchInterval: 30_000,
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-headline text-5xl font-extrabold tracking-tight text-primary md:text-6xl">
          History
        </h1>
        <p className="mt-2 text-on-surface-variant">Recent inventory activity.</p>
      </header>

      <section className="rounded-[var(--radius-lg)] bg-surface-container-low p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <span className="material-symbols-outlined text-9xl">history_edu</span>
        </div>
        <div className="relative z-10">
          <h2 className="mb-6 flex items-center gap-3 font-headline text-3xl font-extrabold text-rose-800">
            <span className="material-symbols-outlined">receipt_long</span> Recent History
          </h2>

          {q.isLoading && <p className="text-on-surface-variant">Loading…</p>}
          {q.error && (
            <p className="text-error">
              {q.error instanceof ApiError ? q.error.message : "Could not load history."}
            </p>
          )}

          <div className="space-y-4">
            {q.data?.map((e) => {
              const badge =
                e.delta < 0
                  ? "bg-pink-100 text-pink-700"
                  : e.delta > 0
                    ? "bg-secondary-container text-secondary"
                    : "bg-surface-container-highest text-on-surface-variant";
              const iconWrap =
                e.delta < 0
                  ? "bg-tertiary-container text-tertiary"
                  : e.delta > 0
                    ? "bg-outline-variant text-white"
                    : "bg-secondary-container text-secondary";
              const actor = e.user?.name ?? (e.delta > 0 ? "System" : "Unknown");
              const verb = e.delta < 0 ? "just took" : e.delta > 0 ? "restocked" : "updated";
              const qty = Math.abs(e.delta);

              return (
                <div
                  key={e.id}
                  className="flex items-center gap-4 rounded-2xl bg-white/60 p-4 shadow-sm transition-transform hover:translate-x-2"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full ${iconWrap}`}>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                      person
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold">
                      {actor} <span className="font-normal text-outline">{verb}</span> {qty}x{" "}
                      {e.product.name}
                    </p>
                    <p className="text-xs text-outline-variant">
                      {new Date(e.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className={`rounded-full px-3 py-1 text-xs font-bold ${badge}`}>
                    {formatDelta(e.delta)}
                  </div>
                </div>
              );
            })}
          </div>

          <Link href="/inventory" className="mt-8 inline-flex items-center gap-2 font-bold text-primary hover:underline">
            Back to inventory <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

