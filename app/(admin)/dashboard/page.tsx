"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Users, ClipboardList, CheckCircle2, TrendingUp, Plus, ClipboardCheck, ShieldAlert,
  Activity, ArrowRight, ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import type { DashboardStats, DashboardAttentionSession } from "@/lib/types";
import { KpiCard, Gauge, scoreColor } from "@/components/ui/DataViz";
import { Card, CardHeader } from "@/components/ui/Card";
import { ResultPill } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Loading, EmptyState } from "@/components/ui/Feedback";
import { buttonClasses } from "@/components/ui/Button";
import { formatDate, formatDateWithWeekdayAz } from "@/lib/format";
import { cn } from "@/lib/cn";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<DashboardStats>("/api/v1/admin/dashboard")
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const recent = stats?.recentSessions ?? [];
  const allClear = !!stats && (stats.pendingGradingCount ?? 0) === 0 && (stats.flaggedCount ?? 0) === 0;
  const today = formatDateWithWeekdayAz(new Date());

  return (
    <div className="mx-auto max-w-[1200px]">
      {/* Greeting */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-bold tracking-[-0.4px] text-fg">
            Xoş gəldin, {user?.firstName ?? "Admin"} 👋
          </h2>
          <p className="mt-0.5 text-[13.5px] text-fg-muted">{today}</p>
        </div>
        <Link href="/exams/create" className={buttonClasses("primary", "md")}>
          <Plus size={17} /> Yeni imtahan
        </Link>
      </div>

      {error && (
        <div className="mb-5 rounded-[11px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-danger-fg">
          {error}
        </div>
      )}

      {/* KPI grid */}
      <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={<Users size={19} />} tone="blue" value={loading ? "—" : stats?.totalUsers ?? 0} label="Aktiv istifadəçi" />
        <KpiCard
          icon={<ClipboardList size={19} />}
          tone="green"
          value={loading ? "—" : stats?.activeExams ?? 0}
          label="Aktiv imtahan"
          topRight={
            !loading && (stats?.activeExams ?? 0) > 0 ? (
              <span className="flex items-center gap-1.5 text-[11.5px] font-semibold text-success-fg">
                <span className="h-[7px] w-[7px] rounded-full bg-success animate-[pulse-dot_1.6s_ease_infinite]" />
                canlı
              </span>
            ) : undefined
          }
        />
        <KpiCard
          icon={<CheckCircle2 size={19} />}
          tone="purple"
          value={loading ? "—" : stats?.completedThisMonth ?? 0}
          label="Bu ay tamamlanan"
          topRight={!loading ? <span className="num text-[11px] text-fg-muted">cəmi {stats?.completedTotal ?? 0}</span> : undefined}
        />
        <KpiCard
          icon={<TrendingUp size={19} />}
          tone="amber"
          value={loading ? "—" : stats?.avgScore != null ? `${stats.avgScore}%` : "—"}
          label="Ümumi orta nəticə"
        />
      </div>

      {/* Action center */}
      {!loading && stats && (
        allClear ? (
          <Card className="mb-5 flex items-center gap-3.5 p-5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-success-bg text-success-fg">
              <ShieldCheck size={22} />
            </span>
            <div>
              <p className="text-[14.5px] font-semibold text-fg">Hər şey qaydasındadır</p>
              <p className="text-[13px] text-fg-muted">Qiymətləndirmə gözləyən sessiya və proktorinq xəbərdarlığı yoxdur.</p>
            </div>
          </Card>
        ) : (
          <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <AttentionCard
              tone="amber"
              icon={<ClipboardCheck size={18} />}
              title="Qiymətləndirmə gözləyir"
              total={stats.pendingGradingCount ?? 0}
              items={stats.pendingGrading ?? []}
              unit="cavab"
              emptyText="Qiymətləndirilməli sessiya yoxdur."
            />
            <AttentionCard
              tone="red"
              icon={<ShieldAlert size={18} />}
              title="Proktorinq xəbərdarlıqları"
              total={stats.flaggedCount ?? 0}
              items={stats.flaggedSessions ?? []}
              unit="pozuntu"
              emptyText="Pozuntu qeydə alınmayıb."
            />
          </div>
        )
      )}

      {/* Charts row */}
      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="p-5">
          <CardHeader title="Son 7 günün aktivliyi" subtitle="Gündəlik tamamlanan imtahanlar" />
          <div className="mt-5">
            {loading ? <Loading /> : <WeeklyActivity data={stats?.weeklyActivity ?? []} />}
          </div>
        </Card>

        <Card className="flex flex-col p-5">
          <CardHeader title="Keçid nisbəti" subtitle="Bütün tamamlanmış imtahanlar" />
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-2">
            <Gauge value={stats?.passRate ?? 0} label="keçid" color="#16A34A" />
            <div className="flex gap-5 text-[13px]">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
                Tamamlanan <b className="num font-semibold text-fg">{stats?.completedTotal ?? 0}</b>
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent list */}
      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h3 className="text-[16px] font-semibold text-fg">Son tamamlanan imtahanlar</h3>
          <Link href="/reports" className="text-[13px] font-medium text-blue-600 hover:underline">
            Hamısına bax
          </Link>
        </div>

        {loading ? (
          <Loading />
        ) : recent.length === 0 ? (
          <EmptyState icon={<ClipboardList size={22} />} title="Tamamlanan imtahan yoxdur" description="İmtahanlar tamamlandıqca burada siyahılanacaq." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-line bg-surface-2">
                  {["Əməkdaş", "İmtahan", "Nəticə", "Status", "Tarix"].map((h) => (
                    <th key={h} className="px-5 py-3 text-[11.5px] font-semibold uppercase tracking-wider text-fg-faint">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map((row) => (
                  <tr key={row.sessionId} className="border-b border-line last:border-0 hover:bg-surface-2">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={row.userName} size={32} />
                        <span className="text-[13.5px] font-medium text-fg">{row.userName}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[13.5px] text-fg-soft">{row.examTitle}</td>
                    <td className="px-5 py-3">
                      <span className="num text-[13.5px] font-semibold text-fg">
                        {row.score != null ? `${row.score}%` : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {row.passed == null ? (
                        <ResultPill result="survey" />
                      ) : row.passed ? (
                        <ResultPill result="pass" />
                      ) : (
                        <ResultPill result="fail" />
                      )}
                    </td>
                    <td className="px-5 py-3 num text-[12.5px] text-fg-muted">{formatDate(row.completedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function AttentionCard({
  tone, icon, title, total, items, unit, emptyText,
}: {
  tone: "amber" | "red";
  icon: React.ReactNode;
  title: string;
  total: number;
  items: DashboardAttentionSession[];
  unit: string;
  emptyText: string;
}) {
  const tones = {
    amber: { tile: "bg-amber-50 text-amber-600 dark:bg-amber-500/10", badge: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400" },
    red: { tile: "bg-red-50 text-red-600 dark:bg-red-500/10", badge: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400" },
  } as const;
  const t = tones[tone];
  return (
    <Card className="flex flex-col p-0">
      <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <span className={cn("flex h-9 w-9 items-center justify-center rounded-[10px]", t.tile)}>{icon}</span>
          <h3 className="text-[14.5px] font-semibold text-fg">{title}</h3>
        </div>
        {total > 0 && <span className={cn("num rounded-full px-2.5 py-1 text-[12px] font-semibold", t.badge)}>{total}</span>}
      </div>
      {items.length === 0 ? (
        <div className="px-5 py-6 text-center text-[13px] text-fg-muted">{emptyText}</div>
      ) : (
        <div className="flex flex-col divide-y divide-line">
          {items.map((s) => (
            <Link
              key={s.sessionId}
              href={`/exams/${s.examId}/results`}
              className="group flex items-center gap-3 px-5 py-3 hover:bg-surface-2"
            >
              <Avatar name={s.userName} size={30} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium text-fg">{s.userName}</div>
                <div className="truncate text-[11.5px] text-fg-muted">{s.examTitle}</div>
              </div>
              <span className={cn("num shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold", t.badge)}>
                {s.count} {unit}
              </span>
              <ArrowRight size={15} className="shrink-0 text-fg-faint transition-transform group-hover:translate-x-0.5" />
            </Link>
          ))}
        </div>
      )}
    </Card>
  );
}

function WeeklyActivity({ data }: { data: { label: string; count: number }[] }) {
  if (data.length === 0) {
    return <EmptyState icon={<Activity size={22} />} title="Məlumat yoxdur" description="Tamamlanan imtahanlar burada görünəcək." />;
  }
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="flex items-end gap-1.5 sm:gap-2.5">
      {data.map((d, i) => {
        const h = Math.round((d.count / max) * 150);
        return (
          <div key={i} className="flex min-w-0 flex-1 flex-col items-center gap-1.5">
            <span className="num text-[11px] font-semibold text-fg-muted">{d.count > 0 ? d.count : ""}</span>
            <div className="flex w-full items-end justify-center" style={{ height: 150 }}>
              <div
                className="w-full max-w-[40px] rounded-t-[6px]"
                style={{ height: d.count > 0 ? Math.max(4, h) : 3, background: d.count > 0 ? scoreColor(70) : "#E2E8F0" }}
              />
            </div>
            <span className="num w-full truncate text-center text-[10.5px] text-fg-faint">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
