"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  ClipboardList,
  FolderTree,
  Users,
  Building2,
  BarChart3,
  LineChart,
  LogOut,
  CheckSquare,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";

const navItems = [
  { href: "/dashboard", icon: LayoutGrid, label: "İdarə paneli" },
  { href: "/exams", icon: ClipboardList, label: "İmtahanlar" },
  { href: "/question-bank", icon: FolderTree, label: "Sual bankı" },
  { href: "/analytics", icon: LineChart, label: "Analitika" },
  { href: "/reports", icon: BarChart3, label: "Hesabatlar" },
  { href: "/users", icon: Users, label: "İstifadəçilər" },
  { href: "/departments", icon: Building2, label: "Şöbələr" },
];

export function IconRail() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside className="sticky top-0 flex h-screen w-[62px] flex-none flex-col items-center bg-sidebar py-3.5">
      {/* Brand */}
      <Link
        href="/dashboard"
        className="mb-3 flex h-[38px] w-[38px] items-center justify-center rounded-[11px] bg-gradient-to-br from-blue-500 to-blue-700 shadow-[0_4px_12px_rgba(37,99,235,0.45)]"
        title="Corporate Assessment"
      >
        <CheckSquare size={20} strokeWidth={2.2} className="text-white" />
      </Link>

      <div className="my-1 h-px w-7 bg-white/8" />

      {/* Nav */}
      <nav className="flex flex-1 flex-col items-center gap-1.5 pt-2">
        {navItems.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              aria-label={item.label}
              className={cn(
                "group relative flex h-10 w-10 items-center justify-center rounded-[11px] transition-colors",
                active
                  ? "bg-[rgba(59,130,246,0.18)] text-blue-400"
                  : "text-slate-400 hover:bg-white/6 hover:text-slate-200",
              )}
            >
              <Icon size={19} strokeWidth={2} />
              {/* Tooltip */}
              <span className="pointer-events-none absolute left-[52px] z-20 whitespace-nowrap rounded-md bg-sidebar-2 px-2.5 py-1 text-[12px] font-medium text-white opacity-0 shadow-pop transition-opacity group-hover:opacity-100">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <button
        onClick={() => logout()}
        title="Çıxış"
        aria-label="Çıxış"
        className="flex h-10 w-10 items-center justify-center rounded-[11px] text-slate-400 transition-colors hover:bg-white/6 hover:text-danger"
      >
        <LogOut size={19} strokeWidth={2} />
      </button>
    </aside>
  );
}
