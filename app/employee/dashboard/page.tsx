"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, FileText, CheckCircle2, TrendingUp, Hourglass } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import type { MyAssignment } from "@/lib/types";
import { ResultPill } from "@/components/ui/Badge";
import { Segmented } from "@/components/ui/DataViz";
import { Loading, EmptyState } from "@/components/ui/Feedback";
import { cn } from "@/lib/cn";

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("az", { day: "2-digit", month: "short", year: "numeric" });
}

export default function EmployeeDashboardPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<MyAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState<number | null>(null);
  const [filter, setFilter] = useState<"all" | "pass" | "fail">("all");

  useEffect(() => {
    apiFetch<MyAssignment[]>("/api/v1/assignments/my")
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const pending = items.filter((a) => a.status !== "COMPLETED");
  const completed = items.filter((a) => a.status === "COMPLETED");
  const next = pending[0];
  const scored = completed.filter((a) => a.score != null);
  const avg = scored.length ? Math.round(scored.reduce((s, a) => s + (a.score ?? 0), 0) / scored.length) : 0;

  const history = useMemo(
    () =>
      completed.filter((a) =>
        filter === "all" ? true : filter === "pass" ? a.passed === true : a.passed === false,
      ),
    [completed, filter],
  );

  const startExam = async (a: MyAssignment) => {
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
        <h2 className="text-[22px] font-bold tracking-[-0.4px] text-fg">
          Salam, {user?.firstName} 👋
        </h2>
        <p className="mt-0.5 text-[13.5px] text-fg-muted">Mənim qiymətləndirmələrim</p>
      </div>

      {error && (
        <div className="rounded-[11px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-danger-fg">{error}</div>
      )}

      {/* Hero */}
      {next ? (
        <div
          className="relative overflow-hidden rounded-[16px] p-7 text-white"
          style={{ background: "linear-gradient(135deg,#0E1B33 0%,#16294A 55%,#1D3A6B 100%)" }}
        >
          <div
            className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full"
            style={{ background: "radial-gradient(circle,rgba(59,130,246,0.35),transparent 70%)" }}
          />
          <div className="relative flex flex-wrap items-end justify-between gap-5">
            <div>
              <span className="text-[12px] font-semibold uppercase tracking-wider text-blue-300">
                Növbəti təyin olunmuş imtahan
              </span>
              <h3 className="mt-2 text-[21px] font-bold tracking-[-0.3px]">{next.examTitle}</h3>
              <div className="mt-2.5 flex flex-wrap items-center gap-4 text-[13px] text-slate-300">
                {next.durationMinutes && (
                  <span className="flex items-center gap-1.5"><Clock size={14} /> <span className="num">{next.durationMinutes}</span> dəqiqə</span>
                )}
                <span className="flex items-center gap-1.5"><FileText size={14} /> {next.examType === "SURVEY" ? "Sorğu" : "İmtahan"}</span>
                {next.endDate && <span>Son tarix: <span className="num">{fmt(next.endDate)}</span></span>}
              </div>
            </div>
            <button
              onClick={() => startExam(next)}
              disabled={starting === next.assignmentId}
              className="flex h-12 items-center gap-2 rounded-[11px] bg-white px-6 text-[15px] font-semibold text-blue-700 shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-transform hover:-translate-y-0.5 disabled:opacity-70"
            >
              {starting === next.assignmentId ? "Başlanır…" : next.status === "IN_PROGRESS" ? "Davam et" : "İmtahana başla"}
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      ) : (
        <div className="card">
          <EmptyState icon={<CheckCircle2 size={22} />} title="Aktiv imtahan yoxdur" description="Hazırda sənə təyin olunmuş gözləyən imtahan yoxdur." />
        </div>
      )}

      {/* Mini KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <MiniKpi icon={<CheckCircle2 size={18} />} tone="blue" value={completed.length} label="Tamamlanmış" />
        <MiniKpi icon={<TrendingUp size={18} />} tone="green" value={`${avg}%`} label="Orta nəticəm" />
        <MiniKpi icon={<Hourglass size={18} />} tone="amber" value={pending.length} label="Gözləyən" />
      </div>

      {/* History */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-[16px] font-semibold text-fg">Keçmiş nəticələrim</h3>
          <Segmented
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "Hamısı" },
              { value: "pass", label: "Keçdi" },
              { value: "fail", label: "Kəsildi" },
            ]}
          />
        </div>

        {history.length === 0 ? (
          <div className="card">
            <EmptyState icon={<FileText size={22} />} title="Nəticə yoxdur" description="Tamamlanmış imtahanların burada görünəcək." />
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {history.map((a) => (
              <Link
                key={a.assignmentId}
                href={a.sessionId ? `/employee/exams/${a.sessionId}/result` : "#"}
                className="card flex items-center gap-4 p-4 transition-colors hover:bg-surface-2"
              >
                <span
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px]",
                    a.passed === false ? "bg-danger-bg text-danger-fg" : "bg-success-bg text-success-fg",
                  )}
                >
                  {a.passed === false ? "✕" : <CheckCircle2 size={20} />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14.5px] font-semibold text-fg">{a.examTitle}</div>
                  <div className="text-[12.5px] text-fg-muted">
                    {a.examType === "SURVEY" ? "Sorğu" : "İmtahan"} · {fmt(a.endDate)}
                  </div>
                </div>
                {a.score != null && (
                  <span className="num hidden text-[15px] font-semibold text-fg sm:block">{a.score}%</span>
                )}
                {a.passed == null ? <ResultPill result="survey" /> : a.passed ? <ResultPill result="pass" /> : <ResultPill result="fail" />}
                <ArrowRight size={16} className="text-fg-faint" />
              </Link>
            ))}
          </div>
        )}
      </div>
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
  tone: "blue" | "green" | "amber";
  value: React.ReactNode;
  label: string;
}) {
  const tones = {
    blue: { bg: "#EAF1FE", fg: "#2563EB" },
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
