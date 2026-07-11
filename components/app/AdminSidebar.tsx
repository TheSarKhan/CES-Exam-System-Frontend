"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid, ClipboardList, FolderTree, LineChart, BarChart3, Users, Building2,
  Settings, LogOut, Sun, Moon, ChevronLeft, ChevronRight, ScrollText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { Avatar } from "@/components/ui/Avatar";
import { BrandLogo } from "@/components/app/BrandLogo";
import { NotificationBell } from "@/components/app/NotificationBell";
import { cn } from "@/lib/cn";

const nav: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/dashboard", label: "İdarə paneli", icon: LayoutGrid },
  { href: "/exams", label: "İmtahanlar", icon: ClipboardList },
  { href: "/question-bank", label: "Sual bankı", icon: FolderTree },
  { href: "/analytics", label: "Analitika", icon: LineChart },
  { href: "/reports", label: "Hesabatlar", icon: BarChart3 },
  { href: "/users", label: "İstifadəçilər", icon: Users },
  { href: "/departments", label: "Şöbələr", icon: Building2 },
  { href: "/audit", label: "Audit jurnalı", icon: ScrollText },
  { href: "/settings", label: "Parametrlər", icon: Settings },
];

const STORAGE_KEY = "ces_admin_sidebar_collapsed";
const rowBase = "group relative flex items-center gap-3 rounded-[11px] px-3 py-2.5 text-[13.5px] font-medium transition-colors";
const rowIdle = "text-fg-muted hover:bg-surface-2 hover:text-fg";
const rowActive = "bg-blue-50 text-blue-700 dark:bg-blue-600/15 dark:text-blue-400";

export function AdminSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const fullName = user ? `${user.firstName} ${user.lastName}` : "İstifadəçi";
  const accountActive = pathname.startsWith("/account");
  const markSrc = theme === "dark" ? "/logo-mark.png" : "/logo-mark-light.png";

  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  const toggleCollapsed = () =>
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });

  const justify = collapsed ? "justify-center" : "justify-start";

  return (
    <aside
      className={cn(
        "sticky top-0 z-40 flex h-screen flex-none flex-col border-r border-line bg-surface px-3 py-4 transition-[width] duration-200",
        collapsed ? "w-[74px]" : "w-[238px]",
      )}
    >
      {/* Collapse toggle — round button straddling the right border */}
      <button
        onClick={toggleCollapsed}
        title={collapsed ? "Genişlət" : "Daralt"}
        aria-label={collapsed ? "Genişlət" : "Daralt"}
        className="absolute -right-3 top-[74px] z-30 flex h-6 w-6 items-center justify-center rounded-full border border-line bg-surface text-fg-muted shadow-[0_1px_4px_rgba(0,0,0,0.12)] transition-colors hover:border-blue-300 hover:text-blue-700 dark:hover:text-blue-400"
      >
        {collapsed ? <ChevronRight size={14} strokeWidth={2.4} /> : <ChevronLeft size={14} strokeWidth={2.4} />}
      </button>

      {/* Brand */}
      <Link
        href="/dashboard"
        className={cn("mb-5 flex items-center", collapsed ? "justify-center" : "justify-start px-1")}
      >
        {collapsed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={markSrc} alt="CES" className="h-10 w-auto object-contain" />
        ) : (
          <BrandLogo className="h-[40px] w-auto max-w-[196px] object-contain" fallback={<CesBrand />} />
        )}
      </Link>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1.5">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(rowBase, justify, active ? rowActive : rowIdle)}
            >
              <Icon size={19} strokeWidth={2} className="shrink-0" />
              {!collapsed && <span className="flex-1">{item.label}</span>}
              {collapsed && <Tooltip label={item.label} />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom — notifications, profile, theme, logout */}
      <div className="mt-2 flex flex-col gap-1.5 border-t border-line pt-3">
        <NotificationBell variant="sidebar" collapsed={collapsed} />

        <Link
          href="/account"
          title="Hesabım"
          className={cn(
            "group relative flex items-center gap-2.5 rounded-[11px] px-2 py-2 transition-colors",
            justify,
            accountActive ? "bg-surface-2" : "hover:bg-surface-2",
          )}
        >
          <Avatar name={fullName} size={32} bg="#8E6F17" />
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[13px] font-semibold text-fg">{fullName}</div>
              <div className="text-[11px] text-fg-muted">Hesabım</div>
            </div>
          )}
          {collapsed && <Tooltip label="Hesabım" />}
        </Link>

        <button onClick={toggle} title={theme === "dark" ? "İşıqlı rejim" : "Qaranlıq rejim"} className={cn(rowBase, justify, rowIdle)}>
          {theme === "dark" ? <Sun size={19} className="shrink-0" /> : <Moon size={19} className="shrink-0" />}
          {!collapsed && <span>{theme === "dark" ? "İşıqlı rejim" : "Qaranlıq rejim"}</span>}
          {collapsed && <Tooltip label={theme === "dark" ? "İşıqlı rejim" : "Qaranlıq rejim"} />}
        </button>

        <button onClick={() => logout()} title="Çıxış" className={cn(rowBase, justify, "text-fg-muted hover:bg-surface-2 hover:text-danger")}>
          <LogOut size={19} className="shrink-0" />
          {!collapsed && <span>Çıxış</span>}
          {collapsed && <Tooltip label="Çıxış" />}
        </button>
      </div>
    </aside>
  );
}

/** Built-in CES wordmark used until the logo PNGs are present (theme-safe). */
function CesBrand() {
  return (
    <span className="flex items-center gap-2.5 text-fg">
      <svg width="38" height="38" viewBox="0 0 40 40" fill="none" className="shrink-0">
        <path d="M20 2.6 L35.5 11.55 L35.5 28.45 L20 37.4 L4.5 28.45 L4.5 11.55 Z" stroke="#C8A449" strokeWidth="2.3" />
        <path d="M25.5 13.8 L17 13.8 L17 26.2 L25.5 26.2" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M17 20 L22.6 20" stroke="#C8A449" strokeWidth="2.6" strokeLinecap="round" />
      </svg>
      <span className="leading-none">
        <span className="block text-[17px] font-extrabold tracking-[2px] text-fg">CES</span>
        <span className="mt-[3px] block text-[9px] font-semibold uppercase tracking-[1.8px] text-[#B4902F]">Assessment</span>
      </span>
    </span>
  );
}

/** Hover tooltip shown only when the sidebar is collapsed. */
function Tooltip({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute left-[58px] z-20 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1 text-[12px] font-medium text-white opacity-0 shadow-pop transition-opacity group-hover:opacity-100 dark:bg-sidebar-2">
      {label}
    </span>
  );
}
