"use client";

import { usePathname, useRouter } from "next/navigation";
import { useSearch } from "@/context/search-context";

type Props = {
  className?: string;
  compact?: boolean;
};

export function SearchBar({ className = "", compact = false }: Props) {
  const { query, setQuery } = useSearch();
  const pathname = usePathname();
  const router = useRouter();

  function handleChange(value: string) {
    setQuery(value);
    if (value && pathname !== "/inventory") {
      router.push("/inventory");
    }
  }

  return (
    <div
      className={`flex items-center rounded-full bg-surface-container-highest ring-1 ring-outline-variant/15 ${compact ? "px-3 py-1.5" : "px-4 py-2"} ${className}`}
    >
      <span className="material-symbols-outlined text-outline text-xl">search</span>
      <input
        type="search"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Search snacks…"
        className={`ml-2 w-full bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant ${compact ? "min-w-[120px]" : "min-w-[160px]"}`}
      />
      {query && (
        <button
          type="button"
          onClick={() => setQuery("")}
          className="material-symbols-outlined text-outline text-lg hover:text-primary"
          aria-label="Clear search"
        >
          close
        </button>
      )}
    </div>
  );
}
