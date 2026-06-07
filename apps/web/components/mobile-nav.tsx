"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { NotificationBell } from "@/components/notification-bell";
import { SearchBar } from "@/components/search-bar";
import { ThemeToggle } from "@/components/theme-toggle";
import { useAuth, type RoleSlug } from "@/context/auth-context";

type NavItem = { href: string; label: string; icon: string; roles: RoleSlug[] };

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard", roles: ["ADMIN", "MANAGER", "STAFF"] },
  { href: "/inventory", label: "Inventory", icon: "inventory_2", roles: ["ADMIN", "MANAGER", "STAFF"] },
  { href: "/history", label: "History", icon: "history", roles: ["ADMIN", "MANAGER", "STAFF"] },
  { href: "/restock", label: "Requests", icon: "add_reaction", roles: ["ADMIN", "MANAGER", "STAFF"] },
  { href: "/analytics", label: "Analytics", icon: "analytics", roles: ["ADMIN", "MANAGER", "STAFF"] },
  { href: "/users", label: "Users", icon: "group", roles: ["ADMIN"] },
];

const BOTTOM_NAV = NAV.filter((n) => n.href !== "/users").slice(0, 4);

function canSee(item: NavItem, role: RoleSlug) {
  return item.roles.includes(role);
}

export function MobileNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const role = user!.role.slug;
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <div className="flex items-center gap-2 md:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="material-symbols-outlined rounded-full p-2 text-primary hover:bg-surface-container-highest"
          aria-label="Open menu"
        >
          menu
        </button>
        <NotificationBell />
      </div>

      {drawerOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-on-surface/40 backdrop-blur-sm"
            aria-label="Close menu"
            onClick={() => setDrawerOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-72 flex-col bg-surface-container-low p-4 pt-20 shadow-xl">
            <div className="mb-4 flex items-center gap-2 px-2">
              <SearchBar compact className="flex-1" />
              <ThemeToggle />
            </div>
            <nav className="flex flex-col gap-1 font-headline font-semibold">
              {NAV.filter((n) => canSee(n, role)).map((item) => {
                const active = pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    className={`flex items-center gap-3 rounded-full px-4 py-3 ${
                      active ? "bg-primary text-on-primary" : "text-on-surface"
                    }`}
                  >
                    <span className="material-symbols-outlined">{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-auto space-y-2 border-t border-outline-variant/15 pt-4">
              <div className="px-4 text-sm">
                <span className="font-bold">{user!.name}</span>
                <span className="ml-2 rounded-full bg-tertiary-container px-2 py-0.5 text-xs font-bold text-on-tertiary-container">
                  {user!.role.name}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setDrawerOpen(false);
                  logout();
                }}
                className="w-full rounded-full px-4 py-3 text-left font-bold text-primary hover:bg-surface-container-highest"
              >
                Sign out
              </button>
            </div>
          </aside>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-outline-variant/15 bg-surface-container-lowest/95 px-2 py-2 backdrop-blur-md md:hidden">
        {BOTTOM_NAV.filter((n) => canSee(n, role)).map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-bold ${
                active ? "text-primary" : "text-on-surface-variant"
              }`}
            >
              <span className="material-symbols-outlined text-xl">{item.icon}</span>
              {item.label.split(" ")[0]}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-bold text-on-surface-variant"
        >
          <span className="material-symbols-outlined text-xl">more_horiz</span>
          More
        </button>
      </nav>
    </>
  );
}
