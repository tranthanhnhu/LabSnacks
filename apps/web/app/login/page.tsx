"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth, type AuthUser } from "@/context/auth-context";
import { apiFetch, ApiError } from "@/lib/api";

export default function LoginPage() {
  const { login, token, ready } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("admin@kawaii.lab");
  const [password, setPassword] = useState("demo123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (ready && token) router.replace("/dashboard");
  }, [ready, token, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <p className="text-on-surface-variant">Loading…</p>
      </div>
    );
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch<{ token: string; user: AuthUser }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      login(res.token, res.user);
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof ApiError) setError("Invalid email or password.");
      else setError("Sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-surface px-6 py-16 font-body text-on-surface">
      <div className="pointer-events-none absolute -left-12 top-[15%] h-64 w-64 rounded-full bg-surface-container-high opacity-60 blur-[80px]" />
      <div className="pointer-events-none absolute -right-20 bottom-[10%] h-80 w-80 rounded-full bg-secondary-container opacity-40 blur-[100px]" />

      <div className="relative z-10 w-full max-w-md rounded-[var(--radius-xl)] bg-surface-container-low p-10 shadow-[0_12px_32px_rgba(69,34,63,0.08)] ring-1 ring-outline-variant/15">
        <h1 className="font-headline text-4xl font-black tracking-tight text-primary">Lab sign-in</h1>
        <p className="mt-2 text-on-surface-variant">Enter your credentials to open the snack protocol.</p>

        <form className="mt-8 flex flex-col gap-4" onSubmit={onSubmit}>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Email
            <input
              className="rounded-2xl bg-surface-container-highest px-4 py-3 text-on-surface shadow-inner outline-none ring-1 ring-outline-variant/15 focus:ring-2 focus:ring-primary"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              autoComplete="email"
              required
            />
          </label>
          <label className="flex flex-col gap-1 text-sm font-medium">
            Password
            <input
              className="rounded-2xl bg-surface-container-highest px-4 py-3 text-on-surface shadow-inner outline-none ring-1 ring-outline-variant/15 focus:ring-2 focus:ring-primary"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              autoComplete="current-password"
              required
            />
          </label>
          {error && <p className="text-sm font-medium text-error">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="gradient-primary mt-2 rounded-full py-4 font-headline font-bold text-on-primary shadow-lg transition active:scale-95 disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Enter lab"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-on-surface-variant">
          <Link href="/roles" className="text-primary hover:underline">
            ← Back to role selection
          </Link>
        </p>
      </div>
    </div>
  );
}
