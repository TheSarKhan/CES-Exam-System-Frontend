"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, FileText, Clock, CheckCircle2, XCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { EmployeeNotificationFeed, EmployeeNotificationItem } from "@/lib/types";
import { Loading, EmptyState } from "@/components/ui/Feedback";
import { cn } from "@/lib/cn";
import { timeAgoAz, formatDate } from "@/lib/format";

function visual(item: EmployeeNotificationItem) {
  if (item.type === "RESULT") {
    if (item.passed === false) return { icon: <XCircle size={17} />, bg: "#FEE2E2", fg: "#B91C1C" };
    return { icon: <CheckCircle2 size={17} />, bg: "#DCFCE7", fg: "#15803D" };
  }
  if (item.type === "DEADLINE") return { icon: <Clock size={17} />, bg: "#FEF3C7", fg: "#B45309" };
  return { icon: <FileText size={17} />, bg: "#F7EFD8", fg: "#8E6F17" };
}

function message(item: EmployeeNotificationItem) {
  if (item.type === "RESULT") {
    const verdict = item.passed == null ? "tamamlandı" : item.passed ? "keçdin ✓" : "keçə bilmədin";
    const score = item.score != null ? ` — ${Math.round(item.score)}%` : "";
    return { title: "Nəticən hazırdır", detail: `${item.examTitle}${score} · ${verdict}` };
  }
  if (item.type === "DEADLINE") {
    return { title: "Son tarix yaxınlaşır", detail: `${item.examTitle} · ${formatDate(item.deadline)}` };
  }
  return { title: "Yeni imtahan təyin olundu", detail: item.examTitle };
}

function href(item: EmployeeNotificationItem) {
  if (item.type === "RESULT" && item.sessionId) return `/employee/exams/${item.sessionId}/result`;
  return "/employee/exams";
}

export default function EmployeeNotificationsPage() {
  const [feed, setFeed] = useState<EmployeeNotificationFeed>({ unreadCount: 0, items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    apiFetch<EmployeeNotificationFeed>("/api/v1/account/notifications")
      .then(setFeed)
      .catch((e) => setError(e instanceof Error ? e.message : "Yüklənmədi"))
      .finally(() => setLoading(false));
  }, []);

  const markAllRead = async () => {
    setMarking(true);
    try {
      await apiFetch<void>("/api/v1/account/notifications/read", { method: "POST" });
      setFeed((f) => ({ unreadCount: 0, items: f.items.map((i) => ({ ...i, unread: false })) }));
    } catch {
      /* ignore */
    } finally {
      setMarking(false);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-bold tracking-[-0.4px] text-fg">Bildirişlər</h2>
          <p className="mt-0.5 text-[13.5px] text-fg-muted">Təyinatlar, son tarixlər və nəticələr</p>
        </div>
        {feed.unreadCount > 0 && (
          <button
            onClick={markAllRead}
            disabled={marking}
            className="inline-flex items-center gap-1.5 rounded-[9px] border border-line px-3 py-2 text-[13px] font-medium text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg disabled:opacity-60"
          >
            <CheckCheck size={15} /> Hamısını oxu
          </button>
        )}
      </div>

      {error && <div className="rounded-[11px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-danger-fg">{error}</div>}

      {feed.items.length === 0 ? (
        <div className="card">
          <EmptyState icon={<Bell size={22} />} title="Bildiriş yoxdur" description="Sənə imtahan təyin olunduqda və nəticələr hazır olduqda burada görünəcək." />
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {feed.items.map((item, i) => {
            const v = visual(item);
            const m = message(item);
            return (
              <Link
                key={`${item.assignmentId}-${i}`}
                href={href(item)}
                className={cn(
                  "card flex items-center gap-4 p-4 transition-colors hover:bg-surface-2",
                  item.unread && "border-l-[3px] border-l-blue-500",
                )}
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px]" style={{ background: v.bg, color: v.fg }}>
                  {v.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-semibold text-fg">{m.title}</span>
                    {item.unread && <span className="h-2 w-2 shrink-0 rounded-full bg-blue-600" />}
                  </div>
                  <div className="truncate text-[12.5px] text-fg-muted">{m.detail}</div>
                </div>
                <span className="shrink-0 text-[11.5px] text-fg-faint">{timeAgoAz(item.time)}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
