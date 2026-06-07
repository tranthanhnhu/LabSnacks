"use client";

import { useTheme } from "@/context/theme-context";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-full p-2 text-primary hover:bg-surface-container-highest"
      aria-label="Toggle theme"
    >
      <span className="material-symbols-outlined">{theme === "dark" ? "light_mode" : "dark_mode"}</span>
    </button>
  );
}
