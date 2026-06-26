"use client";

import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/lib/theme";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      onClick={toggle}
      aria-label={theme === "dark" ? "İşıqlı rejim" : "Qaranlıq rejim"}
      title={theme === "dark" ? "İşıqlı rejim" : "Qaranlıq rejim"}
      className={
        "flex h-9 w-9 items-center justify-center rounded-[9px] text-fg-muted transition-colors hover:bg-slate-100 hover:text-fg dark:hover:bg-surface-2 " +
        (className ?? "")
      }
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
