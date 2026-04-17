"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type RoleSlug = "ADMIN" | "MANAGER" | "STAFF";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: { id: string; slug: RoleSlug; name: string };
};

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  ready: boolean;
};

const STORAGE_KEY = "kawaii_lab_auth";

const AuthContext = createContext<
  (AuthState & {
    login: (token: string, user: AuthUser) => void;
    logout: () => void;
  }) | null
>(null);

function loadStored(): { token: string; user: AuthUser } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { token: string; user: AuthUser };
    if (!parsed?.token || !parsed?.user) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const s = loadStored();
    if (s) {
      setToken(s.token);
      setUser(s.user);
    }
    setReady(true);
  }, []);

  const login = useCallback((t: string, u: AuthUser) => {
    setToken(t);
    setUser(u);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: t, user: u }));
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      ready,
      login,
      logout,
    }),
    [token, user, ready, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
