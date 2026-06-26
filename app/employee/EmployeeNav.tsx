"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Avatar } from "@/components/ui/Avatar";
import { ThemeToggle } from "@/components/app/ThemeToggle";
import { cn } from "@/lib/cn";

const links = [
  { href: "/employee/dashboard", label: "İdarə paneli" },
  { href: "/employee/exams", label: "İmtahanlarım" },
];

export function EmployeeNav() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const fullName = user ? `${user.firstName} ${user.lastName}` : "İstifadəçi";

  return (
    <nav className="flex items-center gap-1 sm:gap-2">
      {links.map((l) => {
        const active = pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "hidden rounded-[9px] px-3 py-2 text-[13.5px] font-medium transition-colors sm:block",
              active
                ? "bg-blue-50 text-blue-700 dark:bg-blue-600/15 dark:text-blue-400"
                : "text-fg-muted hover:bg-slate-100 hover:text-fg dark:hover:bg-surface-2",
            )}
          >
            {l.label}
          </Link>
        );
      })}

      <ThemeToggle className="ml-1" />

      <div className="ml-1 flex items-center gap-2.5 border-l border-line pl-3">
        <Avatar name={fullName} size={34} bg="#1D4ED8" />
        <div className="hidden leading-tight md:block">
          <div className="text-[13px] font-semibold text-fg">{fullName}</div>
          <div className="text-[11.5px] text-fg-muted">İşçi</div>
        </div>
      </div>

      <button
        onClick={() => logout()}
        title="Çıxış"
        aria-label="Çıxış"
        className="ml-1 flex h-9 w-9 items-center justify-center rounded-[9px] text-fg-muted transition-colors hover:bg-slate-100 hover:text-danger dark:hover:bg-surface-2"
      >
        <LogOut size={18} />
      </button>
    </nav>
  );
}
