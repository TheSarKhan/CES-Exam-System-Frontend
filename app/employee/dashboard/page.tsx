"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, Clock, FileText, CheckCircle2, TrendingUp, Hourglass,
  CalendarClock, ChevronRight, Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import type { MyAssignment } from "@/lib/types";
import { ResultPill } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Feedback";
import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";

export default function EmployeeDashboardPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<MyAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState<number | null>(null);

  const load = useCallback(() => {
    return apiFetch<MyAssignment[]>("/api/v1/assignments/my")
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // `start()` navigates away with window.location.href and deliberately leaves the button
  // spinning. Coming back — e.g. abandoning the exam and pressing Back — restores this page
  // from the bfcache with its JS state intact, so that spinner would never clear. Reset it
  // (and refresh the now-stale assignment list) whenever the page is shown again.
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      setStarting(null);
      if (e.persisted) load();
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, [load]);

  const pending = items.filter((a) => a.status !== "COMPLETED");
  const completed = items.filter((a) => a.status === "COMPLETED");
  const scored = completed.filter((a) => a.score != null);
  const avg = scored.length ? Math.round(scored.reduce((s, a) => s + (a.score ?? 0), 0) / scored.length) : 0;

  // Mirrors the backend's `now > endDate` deadline check; in-progress sessions
  // run on their own timer, so they are never treated as expired.
  const isExpired = (a: MyAssignment) =>
    a.status !== "IN_PROGRESS" && !!a.endDate && new Date(a.endDate).getTime() < Date.now();

  const start = async (a: MyAssignment) => {
    if (isExpired(a)) return; // deadline passed — backend would reject anyway
    setStarting(a.assignmentId);
    try {
      if (a.status === "IN_PROGRESS" && a.sessionId) {
        window.location.href = `/employee/exams/${a.sessionId}/take`;
        return;
      }
      const s = await apiFetch<{ sessionId: number }>("/api/v1/sessions/start", {
        method: "POST",
        body: JSON.stringify({ assignmentId: a.assignmentId }),
      });
      window.location.href = `/employee/exams/${s.sessionId}/take`;
    } catch (e) {
      alert(e instanceof Error ? e.message : "İmtahana başlanmadı");
      setStarting(null);
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[22px] font-bold tracking-[-0.4px] text-fg">Salam, {user?.firstName} 👋</h2>
        <p className="mt-0.5 text-[13.5px] text-fg-muted">Qiymətləndirmə panelin</p>
      </div>

      {error && (
        <div className="rounded-[11px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-danger-fg">{error}</div>
      )}

      {/* Status banner */}
      <div
        className="relative overflow-hidden rounded-[16px] p-6 text-white sm:p-7"
        style={{ background: "linear-gradient(135deg,#24221C 0%,#332F26 55%,#463F2E 100%)" }}
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full" style={{ background: "radial-gradient(circle,rgba(201,165,76,0.30),transparent 70%)" }} />
        <div className="relative flex flex-wrap items-center justify-between gap-5">
          <div>
            <span className="text-[12px] font-semibold uppercase tracking-wider" style={{ color: "#D7BA6C" }}>
              {pending.length > 0 ? "Səni gözləyir" : "Hər şey qaydasındadır"}
            </span>
            <h3 className="mt-2 text-[21px] font-bold tracking-[-0.3px]">
              {pending.length > 0
                ? `${pending.length} gözləyən imtahanın var`
                : "Gözləyən imtahan yoxdur"}
            </h3>
            <p className="mt-1.5 text-[13px] text-slate-300">
              {pending.length > 0
                ? "Aşağıdan birbaşa başlaya, ya da İmtahanlarım bölməsinə keçə bilərsən."
                : "Yeni imtahan təyin olunduqda burada görünəcək."}
            </p>
          </div>
          {pending.length > 0 ? (
            <Link href="/employee/exams" className="flex h-11 items-center gap-2 rounded-[11px] bg-white px-5 text-[14px] font-semibold text-[#5E470C] shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-transform hover:-translate-y-0.5">
              İmtahanlara keç <ArrowRight size={17} />
            </Link>
          ) : (
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/12"><Sparkles size={20} /></span>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <MiniKpi icon={<CheckCircle2 size={18} />} tone="gold" value={completed.length} label="Tamamlanmış" />
        <MiniKpi icon={<TrendingUp size={18} />} tone="green" value={scored.length ? `${avg}%` : "—"} label="Orta nəticəm" />
        <MiniKpi icon={<Hourglass size={18} />} tone="amber" value={pending.length} label="Gözləyən" />
      </div>

      {/* Pending preview */}
      {pending.length > 0 && (
        <Section title="Gözləyən imtahanlar" href={pending.length > 3 ? "/employee/exams" : undefined} linkLabel="Hamısı">
          <div className="flex flex-col gap-2.5">
            {pending.slice(0, 3).map((a) => {
              const expired = isExpired(a);
              return (
              <div key={a.assignmentId} className="card flex flex-wrap items-center gap-4 p-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-blue-50 text-blue-700 dark:bg-blue-600/15 dark:text-blue-400">
                  <FileText size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14.5px] font-semibold text-fg">{a.examTitle}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-3 text-[12.5px] text-fg-muted">
                    <span>{a.examType === "SURVEY" ? "Sorğu" : "İmtahan"}</span>
                    {a.durationMinutes && <span className="flex items-center gap-1"><Clock size={12} /> <span className="num">{a.durationMinutes}</span> dəq</span>}
                    {a.endDate && <span className="flex items-center gap-1"><CalendarClock size={12} /> <span className="num">{formatDate(a.endDate)}</span></span>}
                  </div>
                </div>
                {expired ? (
                  <span className="shrink-0 rounded-full bg-slate-100 px-3 py-1 text-[12.5px] font-semibold text-slate-500 dark:bg-surface-2 dark:text-fg-muted">
                    Müddəti bitib
                  </span>
                ) : (
                  <button
                    onClick={() => start(a)}
                    disabled={starting === a.assignmentId}
                    className={cn(buttonClasses("primary", "sm"), "shrink-0")}
                  >
                    {starting === a.assignmentId ? "Başlanır…" : a.status === "IN_PROGRESS" ? "Davam et" : "Başla"}
                    <ArrowRight size={15} />
                  </button>
                )}
              </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Recent results preview */}
      {completed.length > 0 && (
        <Section title="Son nəticələr" href="/employee/results" linkLabel="Hamısı">
          <div className="flex flex-col gap-2.5">
            {completed.slice(0, 3).map((a) => (
              <Link
                key={a.assignmentId}
                href={a.sessionId ? `/employee/exams/${a.sessionId}/result` : "#"}
                className="card flex items-center gap-4 p-4 transition-colors hover:bg-surface-2"
              >
                <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px]", a.passed === false ? "bg-danger-bg text-danger-fg" : "bg-success-bg text-success-fg")}>
                  {a.passed === false ? "✕" : <CheckCircle2 size={18} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14.5px] font-semibold text-fg">{a.examTitle}</div>
                  <div className="text-[12.5px] text-fg-muted">{a.examType === "SURVEY" ? "Sorğu" : "İmtahan"} · {formatDate(a.endDate)}</div>
                </div>
                {a.score != null && <span className="num hidden text-[15px] font-semibold text-fg sm:block">{a.score}%</span>}
                {a.passed == null ? <ResultPill result="survey" /> : a.passed ? <ResultPill result="pass" /> : <ResultPill result="fail" />}
                <ChevronRight size={16} className="text-fg-faint" />
              </Link>
            ))}
          </div>
        </Section>
      )}
    </div>
  );
}

function Section({
  title,
  href,
  linkLabel,
  children,
}: {
  title: string;
  href?: string;
  linkLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="text-[16px] font-semibold text-fg">{title}</h3>
        {href && (
          <Link href={href} className="flex items-center gap-1 text-[13px] font-medium text-blue-700 hover:text-blue-800 dark:text-blue-400">
            {linkLabel ?? "Hamısı"} <ChevronRight size={15} />
          </Link>
        )}
      </div>
      {children}
    </div>
  );
}

function MiniKpi({
  icon,
  tone,
  value,
  label,
}: {
  icon: React.ReactNode;
  tone: "gold" | "green" | "amber";
  value: React.ReactNode;
  label: string;
}) {
  const tones = {
    gold: { bg: "#F7EFD8", fg: "#8E6F17" },
    green: { bg: "#DCFCE7", fg: "#15803D" },
    amber: { bg: "#FEF3C7", fg: "#B45309" },
  } as const;
  const t = tones[tone];
  return (
    <div className="card flex items-center gap-3 p-4">
      <span className="flex h-10 w-10 items-center justify-center rounded-[11px]" style={{ background: t.bg, color: t.fg }}>
        {icon}
      </span>
      <div>
        <div className="num text-[20px] font-semibold leading-none text-fg">{value}</div>
        <div className="mt-1 text-[12px] text-fg-muted">{label}</div>
      </div>
    </div>
  );
}
