"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/auth-context";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!token) router.replace("/login");
  }, [ready, token, router]);

  if (!ready || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface font-body text-on-surface">
        <p className="text-on-surface-variant">Loading session…</p>
      </div>
    );
  }

  return <>{children}</>;
}
