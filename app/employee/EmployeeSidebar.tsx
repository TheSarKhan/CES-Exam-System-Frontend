"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid, ClipboardList, Trophy, TrendingUp, Bell, LogOut, Sun, Moon, ChevronLeft, ChevronRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useTheme } from "@/lib/theme";
import { apiFetch } from "@/lib/api";
import { Avatar } from "@/components/ui/Avatar";
import { BrandLogo } from "@/components/app/BrandLogo";
import { cn } from "@/lib/cn";

const NOTIF_HREF = "/employee/notifications";
const nav: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/employee/dashboard", label: "İdarə paneli", icon: LayoutGrid },
  { href: "/employee/exams", label: "İmtahanlarım", icon: ClipboardList },
  { href: "/employee/results", label: "Nəticələrim", icon: Trophy },
  { href: "/employee/progress", label: "İnkişafım", icon: TrendingUp },
  { href: NOTIF_HREF, label: "Bildirişlər", icon: Bell },
];

const STORAGE_KEY = "ces_emp_sidebar_collapsed";
const rowBase = "group relative flex items-center gap-3 rounded-[11px] px-3 py-2.5 text-[13.5px] font-medium transition-colors";
const rowIdle = "text-fg-muted hover:bg-surface-2 hover:text-fg";
const rowActive = "bg-blue-50 text-blue-700 dark:bg-blue-600/15 dark:text-blue-400";

export function EmployeeSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const fullName = user ? `${user.firstName} ${user.lastName}` : "İstifadəçi";
  const profileActive = pathname.startsWith("/employee/profile");
  const markSrc = theme === "dark" ? "/logo-mark.png" : "/logo-mark-light.png";

  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    setCollapsed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  // Unread notification badge — refetch on navigation so it clears after viewing.
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    apiFetch<{ unreadCount: number }>("/api/v1/account/notifications")
      .then((f) => setUnread(f.unreadCount))
      .catch(() => { /* keep silent */ });
  }, [pathname]);
  const toggleCollapsed = () =>
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      return next;
    });

  const justify = collapsed ? "justify-center" : "justify-start";

  return (
    // The <aside> owns the surface (background + right border) and stretches to the full
    // document height, so it is never cut off on pages taller than the viewport. The inner
    // wrapper is what sticks, keeping the nav pinned within the viewport as the page scrolls.
    <aside
      className={cn(
        "flex-none self-stretch border-r border-line bg-surface transition-[width] duration-200",
        collapsed ? "w-[74px]" : "w-[238px]",
      )}
    >
    {/* `sticky` creates a stacking context, so the z-index that lifts the sidebar
        (and the collapse toggle overflowing out of it) above the page content must
        live on this element — page cards are positioned and paint later. */}
    <div className="sticky top-0 z-40 flex h-screen flex-col px-3 py-4">
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
        href="/employee/dashboard"
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
      <nav className="flex min-h-0 flex-1 flex-col gap-1.5 overflow-y-auto">
        {nav.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          const badge = item.href === NOTIF_HREF ? unread : 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              className={cn(rowBase, justify, active ? rowActive : rowIdle)}
            >
              <span className="relative shrink-0">
                <Icon size={19} strokeWidth={2} />
                {collapsed && badge > 0 && (
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-surface bg-danger" />
                )}
              </span>
              {!collapsed && <span className="flex-1">{item.label}</span>}
              {!collapsed && badge > 0 && (
                <span className="num shrink-0 rounded-full bg-danger px-1.5 text-[10.5px] font-bold leading-[17px] text-white">
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
              {collapsed && <Tooltip label={item.label} />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom — profile, theme, logout */}
      <div className="mt-2 flex flex-col gap-1.5 border-t border-line pt-3">
        <Link
          href="/employee/profile"
          title="Profil"
          className={cn(
            "group relative flex items-center gap-2.5 rounded-[11px] px-2 py-2 transition-colors",
            justify,
            profileActive ? "bg-surface-2" : "hover:bg-surface-2",
          )}
        >
          <Avatar name={fullName} size={32} bg="#8E6F17" />
          {!collapsed && (
            <div className="min-w-0 leading-tight">
              <div className="truncate text-[13px] font-semibold text-fg">{fullName}</div>
              <div className="text-[11px] text-fg-muted">Profilim</div>
            </div>
          )}
          {collapsed && <Tooltip label="Profil" />}
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
