"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, BarChart3, TrendingUp, CheckCircle2, Users, ListChecks, Building2,
  Check, X, Clock, PieChart,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { ExamAnalytics, Difficulty } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { KpiCard, ProgressBar, scoreColor } from "@/components/ui/DataViz";
import { Loading, EmptyState } from "@/components/ui/Feedback";
import { questionTypeLabel } from "@/components/exam/QuestionInput";
import { DIFFICULTY_META } from "@/lib/questionBank";
import { cn } from "@/lib/cn";

export default function ExamAnalyticsPage() {
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<ExamAnalytics | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<ExamAnalytics>(`/api/v1/exams/${id}/analytics`)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Analitika yüklənmədi"));
  }, [id]);

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-3 flex items-center justify-between">
        <Link href="/exams" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-fg-muted hover:text-fg">
          <ArrowLeft size={15} /> İmtahanlara qayıt
        </Link>
        <Link href={`/exams/${id}/results`} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-blue-600 hover:underline">
          <BarChart3 size={15} /> Nəticələr
        </Link>
      </div>

      {error && <div className="mb-4 rounded-[11px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-danger-fg">{error}</div>}

      {!data ? (
        !error && <Loading />
      ) : (
        <>
          <div className="mb-5 flex items-center gap-2.5">
            <PieChart size={20} className="text-purple-600" />
            <h2 className="text-[22px] font-bold tracking-[-0.4px] text-fg">{data.examTitle}</h2>
            <span className="rounded-full bg-purple-50 px-2.5 py-1 text-[11.5px] font-semibold text-purple-700 dark:bg-purple-500/10">Analitika</span>
          </div>

          {data.completedCount === 0 ? (
            <Card>
              <EmptyState
                icon={<BarChart3 size={22} />}
                title="Hələ analitika yoxdur"
                description="İmtahanı kimsə tamamladıqdan sonra burada təhlil görünəcək."
              />
            </Card>
          ) : (
            <>
              {/* KPIs */}
              <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
                <KpiCard icon={<CheckCircle2 size={19} />} tone="green" value={data.completedCount} label="Tamamlanmış" />
                <KpiCard icon={<TrendingUp size={19} />} tone="blue" value={data.avgScore != null ? `${data.avgScore}%` : "—"} label="Orta nəticə" />
                <KpiCard icon={<Users size={19} />} tone="purple" value={data.passRate != null ? `${data.passRate}%` : "—"} label="Keçid faizi" />
                <KpiCard icon={<ListChecks size={19} />} tone="amber" value={data.questionStats.length} label="Sual sayı" />
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Score distribution */}
                <Card className="p-5">
                  <h3 className="mb-4 text-[15px] font-semibold text-fg">Bal paylanması</h3>
                  <Histogram buckets={data.scoreDistribution} />
                  {data.passMark != null && (
                    <p className="mt-3 text-center text-[12px] text-fg-muted">Keçid balı: <span className="num font-semibold text-fg">{data.passMark}%</span></p>
                  )}
                </Card>

                {/* Difficulty effectiveness */}
                <Card className="p-5">
                  <h3 className="mb-4 text-[15px] font-semibold text-fg">Çətinlik üzrə uğur</h3>
                  {data.difficultyStats.length === 0 ? (
                    <p className="py-6 text-center text-[13px] text-fg-muted">Çətinlik məlumatı yoxdur.</p>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {data.difficultyStats.map((d) => {
                        const meta = DIFFICULTY_META[d.difficulty as Difficulty];
                        return (
                          <div key={d.difficulty}>
                            <div className="mb-1.5 flex items-center justify-between">
                              <span className={cn("rounded-[6px] px-2 py-0.5 text-[11.5px] font-semibold", meta?.cls)}>
                                {meta?.label ?? d.difficulty}
                              </span>
                              <span className="text-[12px] text-fg-muted">
                                {d.questionCount} sual ·{" "}
                                <span className="num font-semibold text-fg">{d.successRate != null ? `${d.successRate}%` : "—"}</span> uğur
                              </span>
                            </div>
                            <ProgressBar value={d.successRate ?? 0} />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </div>

              {/* Question difficulty ranking */}
              <Card className="mt-6 p-0">
                <div className="border-b border-line px-5 py-4">
                  <h3 className="text-[15px] font-semibold text-fg">Suallar üzrə təhlil</h3>
                  <p className="mt-0.5 text-[12.5px] text-fg-muted">Ən çətin suallar (ən aşağı uğur faizi) yuxarıda.</p>
                </div>
                <div className="flex flex-col divide-y divide-line">
                  {data.questionStats.map((q, i) => (
                    <div key={q.questionId} className="flex items-center gap-4 px-5 py-3.5">
                      <span className="num flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[11.5px] font-semibold text-fg-muted">{i + 1}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13.5px] font-medium text-fg">{q.text}</p>
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
                          <span className="inline-flex items-center gap-0.5 text-success-fg"><Check size={11} /> {q.correct}</span>
                          <span className="inline-flex items-center gap-0.5 text-danger-fg"><X size={11} /> {q.wrong}</span>
                          {q.pending > 0 && <span className="inline-flex items-center gap-0.5 text-amber-600"><Clock size={11} /> {q.pending}</span>}
                        </div>
                      </div>
                      <div className="w-[140px] shrink-0">
                        {q.successRate != null ? (
                          <>
                            <div className="mb-1 flex items-center justify-between">
                              <span className="text-[11px] text-fg-muted">uğur</span>
                              <span className="num text-[12.5px] font-semibold" style={{ color: scoreColor(q.successRate) }}>{q.successRate}%</span>
                            </div>
                            <ProgressBar value={q.successRate} />
                          </>
                        ) : (
                          <span className="text-[11.5px] text-fg-faint">qiymətləndirilməyib</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Department comparison */}
              {data.departmentStats.length > 0 && (
                <Card className="mt-6 p-5">
                  <h3 className="mb-4 flex items-center gap-2 text-[15px] font-semibold text-fg">
                    <Building2 size={17} className="text-fg-muted" /> Şöbə müqayisəsi
                  </h3>
                  <div className="flex flex-col gap-3">
                    {data.departmentStats.map((d) => (
                      <div key={d.departmentName} className="flex items-center gap-3">
                        <span className="w-[150px] shrink-0 truncate text-[13px] text-fg">{d.departmentName}</span>
                        <div className="flex-1"><ProgressBar value={d.avgScore ?? 0} /></div>
                        <span className="num w-[52px] shrink-0 text-right text-[13px] font-semibold text-fg">{d.avgScore ?? 0}%</span>
                        <span className="num w-[64px] shrink-0 text-right text-[12px] text-fg-muted">{d.participants} nəfər</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

function Histogram({ buckets }: { buckets: { label: string; count: number }[] }) {
  const max = Math.max(1, ...buckets.map((b) => b.count));
  return (
    <div className="flex items-end gap-3">
      {buckets.map((b, i) => {
        const h = Math.round((b.count / max) * 140);
        return (
          <div key={b.label} className="flex flex-1 flex-col items-center gap-1.5">
            <span className="num text-[12px] font-semibold text-fg">{b.count}</span>
            <div className="flex w-full items-end justify-center" style={{ height: 140 }}>
              <div
                className="w-full max-w-[46px] rounded-t-[6px]"
                style={{
                  height: b.count > 0 ? Math.max(4, h) : 3,
                  background: b.count > 0 ? scoreColor(i * 20 + 10) : "#E2E8F0",
                }}
              />
            </div>
            <span className="text-[11px] text-fg-muted">{b.label}</span>
          </div>
        );
      })}
    </div>
  );
}
