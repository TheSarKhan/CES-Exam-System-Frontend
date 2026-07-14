"use client";

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Bell, CheckCheck, ClipboardCheck, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { NotificationFeed, NotificationItem } from "@/lib/types";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

function relTime(iso: string | null): string {
  if (!iso) return "";
  const t = new Date(iso).getTime();
  if (isNaN(t)) return "";
  const diffMin = Math.floor((Date.now() - t) / 60000);
  if (diffMin < 1) return "indicə";
  if (diffMin < 60) return `${diffMin} dəq əvvəl`;
  const h = Math.floor(diffMin / 60);
  if (h < 24) return `${h} saat əvvəl`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} gün əvvəl`;
  return formatDate(iso);
}

function itemVisual(item: NotificationItem) {
  if (item.type === "GRADING")
    return { icon: <ClipboardCheck size={16} />, bg: "#FEF3C7", fg: "#B45309" };
  if (item.type === "VIOLATION")
    return { icon: <ShieldAlert size={16} />, bg: "#FEE2E2", fg: "#B91C1C" };
  if (item.passed === false)
    return { icon: <XCircle size={16} />, bg: "#FEE2E2", fg: "#B91C1C" };
  return { icon: <CheckCircle2 size={16} />, bg: "#DCFCE7", fg: "#15803D" };
}

export function NotificationBell({
  variant = "bar",
  collapsed = false,
}: {
  variant?: "bar" | "sidebar";
  collapsed?: boolean;
}) {
  const [feed, setFeed] = useState<NotificationFeed>({ unreadCount: 0, items: [] });
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [panelPos, setPanelPos] = useState<React.CSSProperties | null>(null);
  const isSidebar = variant === "sidebar";

  const load = useCallback(async () => {
    try {
      const f = await apiFetch<NotificationFeed>("/api/v1/admin/notifications");
      setFeed(f);
    } catch {
      /* notifications must never break the shell */
    }
  }, []);

  // initial load + poll the badge every 60s
  useEffect(() => {
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [load]);

  // close on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t)) return;
      if (panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Reposition the (portaled) panel relative to the trigger button. Rendering the panel into
  // document.body — rather than nesting it inside the sidebar's `position: sticky` element —
  // keeps it out of the sidebar's own stacking context, so page content that forms its own
  // stacking context (sticky headers, transforms, etc.) can never paint over it.
  useLayoutEffect(() => {
    if (!open) { setPanelPos(null); return; }
    const reposition = () => {
      const el = wrapRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      if (isSidebar) {
        setPanelPos({ left: rect.right + 8, bottom: window.innerHeight - rect.bottom });
      } else {
        setPanelPos({ top: rect.top + 46, right: window.innerWidth - rect.right });
      }
    };
    reposition();
    window.addEventListener("resize", reposition);
    window.addEventListener("scroll", reposition, true);
    return () => {
      window.removeEventListener("resize", reposition);
      window.removeEventListener("scroll", reposition, true);
    };
  }, [open, isSidebar]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) load(); // refresh on open
  };

  const markAllRead = async () => {
    setLoading(true);
    try {
      await apiFetch<void>("/api/v1/admin/notifications/read", { method: "POST" });
      setFeed((f) => ({ unreadCount: 0, items: f.items.map((i) => ({ ...i, unread: false })) }));
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  const badge = feed.unreadCount > 99 ? "99+" : String(feed.unreadCount);

  return (
    <div ref={wrapRef} className={cn("relative", isSidebar && "w-full")}>
      {isSidebar ? (
        <button
          onClick={toggle}
          title="Bildirişlər"
          aria-label="Bildirişlər"
          className={cn(
            "group relative flex w-full items-center gap-3 rounded-[11px] px-3 py-2.5 text-[13.5px] font-medium transition-colors",
            collapsed ? "justify-center" : "justify-start",
            open
              ? "bg-blue-50 text-blue-700 dark:bg-blue-600/15 dark:text-blue-400"
              : "text-fg-muted hover:bg-surface-2 hover:text-fg",
          )}
        >
          <span className="relative shrink-0">
            <Bell size={19} strokeWidth={2} />
            {collapsed && feed.unreadCount > 0 && (
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-surface bg-danger" />
            )}
          </span>
          {!collapsed && <span className="flex-1 text-left">Bildirişlər</span>}
          {!collapsed && feed.unreadCount > 0 && (
            <span className="num shrink-0 rounded-full bg-danger px-1.5 text-[10.5px] font-bold leading-[17px] text-white">
              {feed.unreadCount > 9 ? "9+" : feed.unreadCount}
            </span>
          )}
          {collapsed && (
            <span className="pointer-events-none absolute left-[58px] z-20 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1 text-[12px] font-medium text-white opacity-0 shadow-pop transition-opacity group-hover:opacity-100 dark:bg-sidebar-2">
              Bildirişlər
            </span>
          )}
        </button>
      ) : (
        <button
          onClick={toggle}
          className={cn(
            "relative flex h-[38px] w-[38px] items-center justify-center rounded-[9px] text-fg-muted transition-colors hover:bg-slate-100 hover:text-fg dark:hover:bg-surface-2",
            open && "bg-slate-100 text-fg dark:bg-surface-2",
          )}
          aria-label="Bildirişlər"
        >
          <Bell size={19} />
          {feed.unreadCount > 0 && (
            <span className="num absolute right-1 top-1 flex h-[15px] min-w-[15px] items-center justify-center rounded-full border-2 border-surface bg-danger px-1 text-[9.5px] font-bold leading-none text-white">
              {badge}
            </span>
          )}
        </button>
      )}

      {open && panelPos && typeof document !== "undefined" && createPortal(
        <div
          ref={panelRef}
          style={{ position: "fixed", ...panelPos }}
          className="z-[100] w-[368px] overflow-hidden rounded-[14px] border border-line bg-surface shadow-[0_12px_32px_rgba(15,23,42,0.16)]"
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="text-[14px] font-semibold text-fg">Bildirişlər</h3>
              {feed.unreadCount > 0 && (
                <span className="num rounded-full bg-danger-bg px-1.5 py-0.5 text-[10.5px] font-semibold text-danger-fg">
                  {badge} yeni
                </span>
              )}
            </div>
            {feed.unreadCount > 0 && (
              <button
                onClick={markAllRead}
                disabled={loading}
                className="inline-flex items-center gap-1 text-[12px] font-medium text-blue-600 hover:text-blue-700 disabled:opacity-60"
              >
                <CheckCheck size={14} /> Hamısını oxu
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {feed.items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-slate-100 text-slate-400 dark:bg-surface-2">
                  <Bell size={20} />
                </span>
                <p className="text-[13px] text-fg-muted">Hələ bildiriş yoxdur</p>
              </div>
            ) : (
              feed.items.map((item) => {
                const v = itemVisual(item);
                return (
                  <Link
                    key={item.sessionId}
                    href={`/exams/${item.examId}/results`}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex gap-3 border-b border-line px-4 py-3 transition-colors last:border-b-0 hover:bg-surface-2",
                      item.unread && "bg-blue-50/50 dark:bg-blue-600/5",
                    )}
                  >
                    <span
                      className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px]"
                      style={{ background: v.bg, color: v.fg }}
                    >
                      {v.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] leading-snug text-fg">
                        <b>{item.userName}</b>{" "}
                        <span className="text-fg-muted">“{item.examTitle}” imtahanını tamamladı</span>
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {item.score != null && item.pendingGrading === 0 && (
                          <span className="num text-[11.5px] font-semibold text-fg">{Math.round(item.score)}%</span>
                        )}
                        {item.pendingGrading > 0 && (
                          <span className="num inline-flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10.5px] font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                            <ClipboardCheck size={10} /> {item.pendingGrading} qiymətləndir
                          </span>
                        )}
                        {item.violations > 0 && (
                          <span className="num inline-flex items-center gap-1 rounded-full bg-danger-bg px-1.5 py-0.5 text-[10.5px] font-semibold text-danger-fg">
                            <ShieldAlert size={10} /> {item.violations} pozuntu
                          </span>
                        )}
                        <span className="ml-auto shrink-0 text-[11px] text-fg-faint">{relTime(item.time)}</span>
                      </div>
                    </div>
                    {item.unread && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-600" />}
                  </Link>
                );
              })
            )}
          </div>

          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="block border-t border-line py-2.5 text-center text-[12.5px] font-medium text-fg-muted hover:bg-surface-2 hover:text-fg"
          >
            İdarə panelinə keç
          </Link>
        </div>,
        document.body,
      )}
    </div>
  );
}
