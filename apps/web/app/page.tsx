"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuth } from "@/context/auth-context";

export default function HomePage() {
  const { token, ready } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    router.replace(token ? "/dashboard" : "/roles");
  }, [ready, token, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface font-body text-on-surface">
      <p className="text-on-surface-variant">Redirecting…</p>
    </div>
  );
}
