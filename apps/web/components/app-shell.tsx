"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, type RoleSlug } from "@/context/auth-context";
import { NotificationBell } from "@/components/notification-bell";

type NavItem = { href: string; label: string; icon: string; roles: RoleSlug[] };

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard", roles: ["ADMIN", "MANAGER", "STAFF"] },
  { href: "/inventory", label: "Inventory", icon: "inventory_2", roles: ["ADMIN", "MANAGER", "STAFF"] },
  { href: "/restock", label: "Restock", icon: "shopping_cart", roles: ["ADMIN", "MANAGER", "STAFF"] },
  { href: "/analytics", label: "Analytics", icon: "analytics", roles: ["ADMIN", "MANAGER"] },
  { href: "/users", label: "Users", icon: "group", roles: ["ADMIN"] },
];

function canSee(item: NavItem, role: RoleSlug) {
  return item.roles.includes(role);
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const role = user!.role.slug;

  return (
    <div className="min-h-screen bg-surface font-body text-on-surface selection:bg-primary-container selection:text-on-primary-container">
      <header className="fixed top-0 left-0 right-0 z-50 flex w-full items-center justify-between bg-pink-50/60 px-6 py-4 shadow-[0_12px_32px_rgba(69,34,63,0.08)] backdrop-blur-xl">
        <Link href="/dashboard" className="font-headline text-2xl font-black tracking-tight text-primary">
          Kawaii Lab Snacks
        </Link>
        <div className="hidden items-center gap-4 md:flex">
          <div className="flex items-center rounded-full bg-surface-container-highest px-4 py-2 ring-1 ring-outline-variant/15">
            <span className="material-symbols-outlined text-outline">search</span>
            <span className="ml-2 text-sm text-on-surface-variant">Search snacks…</span>
          </div>
          <NotificationBell />
          <div className="flex items-center gap-2 rounded-full bg-surface-container-low px-3 py-1">
            <span className="text-sm font-medium">{user!.name}</span>
            <span className="rounded-full bg-tertiary-container px-2 py-0.5 text-xs font-bold text-on-tertiary-container">
              {user!.role.name}
            </span>
          </div>
          <button
            type="button"
            onClick={() => logout()}
            className="rounded-full px-4 py-2 text-sm font-bold text-primary hover:bg-surface-container-highest"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="flex min-h-screen pt-24 pb-12">
        <aside className="fixed left-0 top-0 z-40 hidden h-full w-72 flex-col rounded-r-[var(--radius-xl)] bg-pink-100/50 p-4 pt-24 shadow-xl backdrop-blur-lg md:flex">
          <div className="mb-10 flex items-center gap-4 px-4">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-primary-container">
              <Image
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCu9VNHT8J3MXGPsFio7gtOeR4HL1ILljeZm_ysAKDCpFgGR8DJASw6ZMBmY43PK8mcEkYJp2Vzc_W4FP7p4ESfv_zbpGr1WWzH9-R8YCfoZU7x6RsNvKdjiG0gvxN4u1uF56loUzaFkkeQJ3uJvOLetwsS-loWK4yDB03alSwrRebmG1QsPhmlTxSVHFJgD99HOLaK0uMYHlv7Y2URKottts7uw1LJ58UOb5fof9IuEXAeNeY0HJiCrUl1eUjcdgdGiaTSpRa-ZSQ"
                alt="Mascot"
                width={48}
                height={48}
                className="h-full w-full object-cover"
              />
            </div>
            <div>
              <h3 className="font-headline font-black text-primary">Lab Protocol</h3>
              <p className="text-xs text-on-surface-variant">{user!.role.name}</p>
            </div>
          </div>
          <nav className="flex flex-col gap-2 font-headline font-semibold">
            {NAV.filter((n) => canSee(n, role)).map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-full px-4 py-3 transition-all duration-300 hover:translate-x-2 ${
                    active
                      ? "mx-2 bg-gradient-to-r from-primary to-primary-container text-on-primary shadow-md"
                      : "text-on-surface/80 hover:text-primary"
                  }`}
                >
                  <span className="material-symbols-outlined">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <Link
            href="/restock"
            className="gradient-primary mt-auto mx-4 flex items-center justify-center gap-2 rounded-xl py-4 font-bold text-on-primary sticker-shadow bouncy-hover active:scale-95"
          >
            <span className="material-symbols-outlined">add_circle</span>
            Request restock
          </Link>
        </aside>

        <main className="flex-1 px-4 md:ml-72 md:px-12">{children}</main>
      </div>
    </div>
  );
}
