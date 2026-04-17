"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { apiFetch, ApiError } from "@/lib/api";

type NotificationRow = {
  id: string;
  title: string;
  body: string;
  type: string;
  readAt: string | null;
  createdAt: string;
};

export function NotificationBell() {
  const { token } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const q = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiFetch<NotificationRow[]>("/api/notifications", { token }),
    enabled: !!token,
    refetchInterval: 30_000,
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/notifications/${id}/read`, { method: "PATCH", token });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unread = q.data?.filter((n) => !n.readAt).length ?? 0;

  return (
    <div className="relative">
      <button
        type="button"
        className="material-symbols-outlined relative text-primary hover:scale-105"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notifications"
      >
        notifications
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-error-container px-1 text-[10px] font-bold text-on-error-container">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-h-96 overflow-auto rounded-2xl bg-surface-container-lowest p-3 shadow-xl ring-1 ring-outline-variant/15">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-headline font-bold text-primary">Notifications</span>
            <button
              type="button"
              className="text-xs text-secondary"
              onClick={async () => {
                try {
                  await apiFetch("/api/notifications/read-all", { method: "POST", token });
                  qc.invalidateQueries({ queryKey: ["notifications"] });
                } catch (e) {
                  if (e instanceof ApiError && e.status === 403) return;
                  console.error(e);
                }
              }}
            >
              Mark all read
            </button>
          </div>
          {q.isLoading && <p className="text-sm text-on-surface-variant">Loading…</p>}
          {q.data?.length === 0 && <p className="text-sm text-on-surface-variant">No notifications yet.</p>}
          <ul className="flex flex-col gap-2">
            {q.data?.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  className={`w-full rounded-xl p-3 text-left text-sm transition ${
                    n.readAt ? "bg-surface-container-low/50" : "bg-surface-container-highest"
                  }`}
                  onClick={() => {
                    if (!n.readAt) markRead.mutate(n.id);
                  }}
                >
                  <div className="font-headline font-bold text-on-surface">{n.title}</div>
                  <div className="text-on-surface-variant">{n.body}</div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
