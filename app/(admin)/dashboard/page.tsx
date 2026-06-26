"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Users, ClipboardList, CheckCircle2, TrendingUp, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import type { DashboardStats } from "@/lib/types";
import { KpiCard, Gauge, scoreColor } from "@/components/ui/DataViz";
import { Card, CardHeader } from "@/components/ui/Card";
import { ResultPill } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Loading, EmptyState } from "@/components/ui/Feedback";
import { buttonClasses } from "@/components/ui/Button";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("az", { day: "2-digit", month: "short", year: "numeric" });
}

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
  const scored = recent.filter((r) => r.score != null);
  const avgScore = scored.length
    ? Math.round(scored.reduce((s, r) => s + (r.score ?? 0), 0) / scored.length)
    : 0;
  const passCount = recent.filter((r) => r.passed === true).length;
  const failCount = recent.filter((r) => r.passed === false).length;
  const passRate = passCount + failCount ? Math.round((passCount / (passCount + failCount)) * 100) : 0;

  const today = new Date().toLocaleDateString("az", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="mx-auto max-w-[1200px]">
      {/* Greeting */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-[22px] font-bold tracking-[-0.4px] text-fg">
            Xoş gəldin, {user?.firstName ?? "Admin"} 👋
          </h2>
          <p className="mt-0.5 text-[13.5px] text-fg-muted capitalize">{today}</p>
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
        <KpiCard
          icon={<Users size={19} />}
          tone="blue"
          value={loading ? "—" : stats?.totalUsers ?? 0}
          label="Ümumi istifadəçi"
        />
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
        />
        <KpiCard
          icon={<TrendingUp size={19} />}
          tone="amber"
          value={loading ? "—" : `${avgScore}%`}
          label="Son nəticələrin ortalaması"
        />
      </div>

      {/* Charts row */}
      <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="p-5">
          <CardHeader title="Son imtahan nəticələri" subtitle="Ən son tamamlanan sessiyalar" />
          <div className="mt-5">
            {loading ? (
              <Loading />
            ) : scored.length === 0 ? (
              <EmptyState icon={<TrendingUp size={22} />} title="Hələ nəticə yoxdur" description="İmtahanlar tamamlandıqca nəticələr burada görünəcək." />
            ) : (
              <div className="flex h-[180px] items-end gap-3">
                {scored.slice(0, 10).map((r) => (
                  <div key={r.sessionId} className="flex flex-1 flex-col items-center gap-2">
                    <span className="num text-[11px] font-semibold text-fg-muted">{r.score}%</span>
                    <div className="flex w-full flex-1 items-end">
                      <div
                        className="w-full rounded-t-[6px] transition-[height]"
                        style={{ height: `${Math.max(4, r.score ?? 0)}%`, background: scoreColor(r.score ?? 0) }}
                        title={`${r.userName} — ${r.score}%`}
                      />
                    </div>
                    <span className="w-full truncate text-center text-[10.5px] text-fg-faint">
                      {r.userName.split(" ")[0]}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        <Card className="flex flex-col p-5">
          <CardHeader title="Keçid nisbəti" subtitle="Son sessiyalar üzrə" />
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-2">
            <Gauge value={passRate} label="keçid" color="#16A34A" />
            <div className="flex gap-5 text-[13px]">
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-success" />
                Keçdi <b className="num font-semibold text-fg">{passCount}</b>
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-danger" />
                Kəsildi <b className="num font-semibold text-fg">{failCount}</b>
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
