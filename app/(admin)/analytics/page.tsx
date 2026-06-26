"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ClipboardList, TrendingUp, Target, MessageSquare, ShieldAlert, Flame, XCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { ExamReport, AnalyticsInsights, AnalyticsQuestionInsight, Difficulty } from "@/lib/types";
import { PageHeader } from "@/components/app/PageHeader";
import { Card, CardHeader } from "@/components/ui/Card";
import { KpiCard, Gauge, ProgressBar, scoreColor } from "@/components/ui/DataViz";
import { Loading, EmptyState, Alert } from "@/components/ui/Feedback";
import { questionTypeLabel } from "@/components/exam/QuestionInput";
import { DIFFICULTY_META } from "@/lib/questionBank";
import { cn } from "@/lib/cn";

const MONTHS = ["Yan", "Fev", "Mar", "Apr", "May", "İyn", "İyl", "Avq", "Sen", "Okt", "Noy", "Dek"];

export default function AnalyticsPage() {
  const [reports, setReports] = useState<ExamReport[]>([]);
  const [insights, setInsights] = useState<AnalyticsInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<ExamReport[]>("/api/v1/admin/reports")
      .then(setReports)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    // Loads only once the aggregation endpoint exists; until then the section stays a placeholder.
    apiFetch<AnalyticsInsights>("/api/v1/admin/analytics/insights")
      .then(setInsights)
      .catch(() => setInsights(null));
  }, []);

  const stats = useMemo(() => {
    const scored = reports.filter((r) => r.passed != null && r.score != null);
    const surveys = reports.filter((r) => r.passed == null);
    const avg = scored.length ? Math.round(scored.reduce((s, r) => s + (r.score ?? 0), 0) / scored.length) : 0;
    const pass = scored.filter((r) => r.passed).length;
    const passRate = scored.length ? Math.round((pass / scored.length) * 100) : 0;

    // by department
    const deptMap = new Map<string, { sum: number; n: number }>();
    scored.forEach((r) => {
      const k = r.departmentName || "Digər";
      const e = deptMap.get(k) ?? { sum: 0, n: 0 };
      e.sum += r.score ?? 0;
      e.n += 1;
      deptMap.set(k, e);
    });
    const byDept = [...deptMap.entries()].map(([name, v]) => ({ name, avg: Math.round(v.sum / v.n) })).sort((a, b) => b.avg - a.avg);

    // pass-rate trend by month (last 6)
    const now = new Date();
    const months: { label: string; rate: number; n: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const inMonth = scored.filter((r) => {
        const rd = new Date(r.endTime);
        return `${rd.getFullYear()}-${rd.getMonth()}` === key;
      });
      const p = inMonth.filter((r) => r.passed).length;
      months.push({ label: MONTHS[d.getMonth()], rate: inMonth.length ? Math.round((p / inMonth.length) * 100) : 0, n: inMonth.length });
    }

    // score distribution buckets
    const buckets = [0, 0, 0, 0, 0]; // <40,40-59,60-79,80-89,90-100
    scored.forEach((r) => {
      const s = r.score ?? 0;
      if (s < 40) buckets[0]++;
      else if (s < 60) buckets[1]++;
      else if (s < 80) buckets[2]++;
      else if (s < 90) buckets[3]++;
      else buckets[4]++;
    });

    return { total: reports.length, scored: scored.length, surveys: surveys.length, avg, passRate, pass, fail: scored.length - pass, byDept, months, buckets };
  }, [reports]);

  if (loading) return <Loading />;

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader title="Analitika" subtitle="Nəticə dinamikası və şöbə performansı" />

      {error && <div className="mb-4 rounded-[11px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-danger-fg">{error}</div>}

      {reports.length === 0 ? (
        <Card><EmptyState icon={<TrendingUp size={22} />} title="Analitika üçün məlumat yoxdur" description="İmtahanlar tamamlandıqca statistika burada görünəcək." /></Card>
      ) : (
        <div className="flex flex-col gap-5">
          {/* KPIs */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard icon={<ClipboardList size={19} />} tone="blue" value={stats.total} label="Ümumi sessiya" />
            <KpiCard icon={<TrendingUp size={19} />} tone="green" value={`${stats.avg}%`} label="Orta nəticə" />
            <KpiCard icon={<Target size={19} />} tone="amber" value={`${stats.passRate}%`} label="Keçid faizi" />
            <KpiCard icon={<MessageSquare size={19} />} tone="purple" value={stats.surveys} label="Sorğu cavabı" />
          </div>

          {/* Trend + donut */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.7fr_1fr]">
            <Card className="p-5">
              <CardHeader title="Keçid faizinin dinamikası" subtitle="Son 6 ay" />
              <div className="mt-4">
                <TrendChart months={stats.months} />
              </div>
            </Card>
            <Card className="flex flex-col p-5">
              <CardHeader title="Keçdi / Kəsildi" />
              <div className="flex flex-1 flex-col items-center justify-center gap-4 py-2">
                <Gauge value={stats.passRate} label="keçid" color="#16A34A" />
                <div className="flex gap-5 text-[13px]">
                  <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-success" /> Keçdi <b className="num text-fg">{stats.pass}</b></span>
                  <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-danger" /> Kəsildi <b className="num text-fg">{stats.fail}</b></span>
                </div>
              </div>
            </Card>
          </div>

          {/* Dept + distribution */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="p-5">
              <CardHeader title="Şöbələr üzrə performans" subtitle="Orta nəticə" />
              <div className="mt-4 flex flex-col gap-3.5">
                {stats.byDept.length === 0 ? (
                  <p className="text-[13px] text-fg-muted">Məlumat yoxdur.</p>
                ) : (
                  stats.byDept.map((d) => (
                    <div key={d.name}>
                      <div className="mb-1 flex items-center justify-between text-[13px]">
                        <span className="font-medium text-fg-soft">{d.name}</span>
                        <span className="num font-semibold text-fg">{d.avg}%</span>
                      </div>
                      <ProgressBar value={d.avg} />
                    </div>
                  ))
                )}
              </div>
            </Card>

            <Card className="p-5">
              <CardHeader title="Nəticə bölgüsü" subtitle="Bal aralıqları üzrə sessiya sayı" />
              <div className="mt-5 flex h-[170px] items-end gap-3">
                {stats.buckets.map((count, i) => {
                  const labels = ["<40", "40–59", "60–79", "80–89", "90+"];
                  const max = Math.max(...stats.buckets, 1);
                  const colors = ["#DC2626", "#D97706", "#2563EB", "#16A34A", "#15803D"];
                  return (
                    <div key={i} className="flex flex-1 flex-col items-center gap-2">
                      <span className="num text-[11px] font-semibold text-fg-muted">{count}</span>
                      <div className="flex w-full flex-1 items-end">
                        <div className="w-full rounded-t-[6px]" style={{ height: `${Math.max(4, (count / max) * 100)}%`, background: colors[i] }} />
                      </div>
                      <span className="num text-[10.5px] text-fg-faint">{labels[i]}</span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {insights ? (
            <>
              {/* Question-level insights */}
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card className="p-0">
                  <div className="flex items-center gap-2 border-b border-line px-5 py-4">
                    <Flame size={17} className="text-red-500" />
                    <h3 className="text-[15px] font-semibold text-fg">Ən çətin suallar</h3>
                    <span className="text-[12px] text-fg-muted">ən aşağı uğur faizi</span>
                  </div>
                  {insights.hardestQuestions.length === 0 ? (
                    <div className="px-5 py-6 text-center text-[13px] text-fg-muted">Qiymətləndirilmiş sual yoxdur.</div>
                  ) : (
                    <div className="flex flex-col divide-y divide-line">
                      {insights.hardestQuestions.map((q, i) => (
                        <InsightRow key={q.questionId} q={q} rank={i + 1} metric="rate" />
                      ))}
                    </div>
                  )}
                </Card>

                <Card className="p-0">
                  <div className="flex items-center gap-2 border-b border-line px-5 py-4">
                    <XCircle size={17} className="text-amber-500" />
                    <h3 className="text-[15px] font-semibold text-fg">Ən çox səhv cavablandırılan</h3>
                    <span className="text-[12px] text-fg-muted">səhv cavab sayına görə</span>
                  </div>
                  {insights.mostMissed.length === 0 ? (
                    <div className="px-5 py-6 text-center text-[13px] text-fg-muted">Səhv cavab qeydə alınmayıb.</div>
                  ) : (
                    <div className="flex flex-col divide-y divide-line">
                      {insights.mostMissed.map((q, i) => (
                        <InsightRow key={q.questionId} q={q} rank={i + 1} metric="wrong" />
                      ))}
                    </div>
                  )}
                </Card>
              </div>

              {/* Anti-cheat log summary */}
              <Card className="p-0">
                <div className="flex items-center justify-between border-b border-line px-5 py-4">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={17} className="text-red-500" />
                    <h3 className="text-[15px] font-semibold text-fg">Anti-cheat jurnalı</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="num rounded-full bg-red-50 px-2.5 py-1 text-[11.5px] font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-400">
                      {insights.totalViolations} hadisə
                    </span>
                    <span className="num rounded-full bg-surface-2 px-2.5 py-1 text-[11.5px] font-semibold text-fg-muted">
                      {insights.flaggedSessions} sessiya
                    </span>
                  </div>
                </div>
                {insights.violationStats.length === 0 ? (
                  <EmptyState icon={<ShieldAlert size={22} />} title="Pozuntu yoxdur" description="İmtahanlar zamanı anti-cheat pozuntusu qeydə alınmayıb." />
                ) : (
                  <div className="flex flex-col gap-3 p-5">
                    {insights.violationStats.map((v) => {
                      const pct = insights.totalViolations > 0 ? (v.count / insights.totalViolations) * 100 : 0;
                      return (
                        <div key={v.type} className="flex items-center gap-3">
                          <span className="w-[200px] shrink-0 truncate text-[13px] text-fg-soft">{v.label || v.type}</span>
                          <div className="flex-1"><ProgressBar value={pct} color="#DC2626" /></div>
                          <span className="num w-[40px] shrink-0 text-right text-[13px] font-semibold text-fg">{v.count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            </>
          ) : (
            <Alert tone="info" title="Sual səviyyəsi analitikası və anti-cheat jurnalı">
              Ən çətin suallar, ən çox səhv cavablandırılan suallar və anti-cheat pozuntu statistikası üçün backend-də
              ayrıca aqreqasiya endpoint-i tələb olunur — bu bölmə həmin endpoint hazır olduqda aktivləşəcək.
            </Alert>
          )}
        </div>
      )}
    </div>
  );
}

function TrendChart({ months }: { months: { label: string; rate: number; n: number }[] }) {
  const W = 640, H = 200, pad = 28;
  const innerW = W - pad * 2, innerH = H - pad * 2;
  const pts = months.map((m, i) => ({
    x: pad + (months.length === 1 ? innerW / 2 : (i / (months.length - 1)) * innerW),
    y: pad + innerH - (m.rate / 100) * innerH,
    ...m,
  }));
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${line} L${pts[pts.length - 1].x},${pad + innerH} L${pts[0].x},${pad + innerH} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 200 }}>
      {[0, 25, 50, 75, 100].map((g) => {
        const y = pad + innerH - (g / 100) * innerH;
        return (
          <g key={g}>
            <line x1={pad} y1={y} x2={W - pad} y2={y} className="stroke-line" strokeWidth="1" />
            <text x={4} y={y + 3} className="fill-fg-faint" style={{ fontSize: 9 }}>{g}</text>
          </g>
        );
      })}
      <path d={area} fill="#B4902F" opacity="0.10" />
      <path d={line} fill="none" stroke="#8E6F17" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="3.5" fill="#8E6F17" />
          <text x={p.x} y={H - 8} textAnchor="middle" className="fill-fg-muted" style={{ fontSize: 10 }}>{p.label}</text>
        </g>
      ))}
    </svg>
  );
}

function InsightRow({ q, rank, metric }: { q: AnalyticsQuestionInsight; rank: number; metric: "rate" | "wrong" }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <span className="num flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[11px] font-semibold text-fg-muted">{rank}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-medium text-fg">{q.text}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-fg-muted">
          <span>{questionTypeLabel(q.type)}</span>
          {q.difficulty && (
            <>
              <span className="text-fg-faint">·</span>
              <span className={cn("rounded-[5px] px-1.5 py-0.5 font-semibold", DIFFICULTY_META[q.difficulty as Difficulty]?.cls)}>
                {DIFFICULTY_META[q.difficulty as Difficulty]?.label ?? q.difficulty}
              </span>
            </>
          )}
          <span className="text-fg-faint">·</span>
          <span className="num">{q.total} cavab</span>
        </div>
      </div>
      {metric === "rate" ? (
        <span className="num shrink-0 text-[13px] font-semibold" style={{ color: scoreColor(q.successRate ?? 0) }}>
          {q.successRate != null ? `${q.successRate}%` : "—"}
        </span>
      ) : (
        <span className="num shrink-0 rounded-full bg-danger-bg px-2 py-0.5 text-[12px] font-semibold text-danger-fg">{q.wrong} səhv</span>
      )}
    </div>
  );
}
