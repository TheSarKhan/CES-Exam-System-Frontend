"use client";

import React, { useEffect, useState } from "react";
import { TrendingUp, CheckCircle2, Trophy, Target, Users, BarChart3 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { ProgressData, ProgressTrendPoint } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { ProgressBar, scoreColor } from "@/components/ui/DataViz";
import { Loading, EmptyState } from "@/components/ui/Feedback";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";

export default function EmployeeProgressPage() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<ProgressData>("/api/v1/account/progress")
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Yüklənmədi"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading />;
  if (error || !data)
    return <div className="card p-6 text-center text-[14px] text-danger-fg">{error || "Məlumat tapılmadı"}</div>;

  if (data.completed === 0) {
    return (
      <div className="flex flex-col gap-6">
        <Header />
        <div className="card">
          <EmptyState icon={<BarChart3 size={22} />} title="Hələ məlumat yoxdur" description="İmtahan tamamladıqca inkişafın burada vizuallaşacaq." />
        </div>
      </div>
    );
  }

  const sortedCats = [...data.categories].sort(
    (a, b) => (a.successRate ?? 999) - (b.successRate ?? 999),
  );

  return (
    <div className="flex flex-col gap-6">
      <Header />

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat icon={<CheckCircle2 size={17} />} tone="gold" value={data.completed} label="Tamamlanmış" />
        <Stat icon={<TrendingUp size={17} />} tone="green" value={data.avgScore == null ? "—" : `${data.avgScore}%`} label="Orta nəticə" />
        <Stat icon={<Trophy size={17} />} tone="amber" value={data.bestScore == null ? "—" : `${data.bestScore}%`} label="Ən yüksək" />
        <Stat icon={<Target size={17} />} tone="green" value={data.passed} label="Keçilmiş" />
      </div>

      {/* Department comparison */}
      {data.avgScore != null && data.departmentAvg != null && (
        <Card className="p-5">
          <div className="mb-4 flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-blue-50 text-blue-700 dark:bg-blue-600/15 dark:text-blue-400"><Users size={17} /></span>
            <div>
              <h3 className="text-[15px] font-semibold text-fg">Departament müqayisəsi</h3>
              <p className="text-[12.5px] text-fg-muted">{data.departmentName ?? "Departament"} ortası ilə müqayisə</p>
            </div>
          </div>
          <CompareRow label="Mənim ortam" value={data.avgScore} highlight />
          <CompareRow label={`${data.departmentName ?? "Departament"} ortası`} value={data.departmentAvg} />
          <p className="mt-3 text-[12.5px] text-fg-muted">
            {data.avgScore >= data.departmentAvg
              ? `Departament ortasından ${data.avgScore - data.departmentAvg} bal yüksəksən. 👏`
              : `Departament ortasına çatmaq üçün ${data.departmentAvg - data.avgScore} bal qalıb.`}
          </p>
        </Card>
      )}

      {/* Trend */}
      {data.trend.length >= 2 && (
        <Card className="p-5">
          <h3 className="mb-1 text-[15px] font-semibold text-fg">Bal trendi</h3>
          <p className="mb-4 text-[12.5px] text-fg-muted">Tamamlanmış imtahanlar üzrə nəticələrin</p>
          <TrendChart points={data.trend} />
        </Card>
      )}

      {/* Categories */}
      {sortedCats.length > 0 && (
        <Card className="p-5">
          <h3 className="mb-1 text-[15px] font-semibold text-fg">Mövzu üzrə güclü və zəif tərəflər</h3>
          <p className="mb-4 text-[12.5px] text-fg-muted">Kateqoriyalar üzrə düzgün cavab faizin</p>
          <div className="flex flex-col gap-3.5">
            {sortedCats.map((c) => (
              <div key={c.name}>
                <div className="mb-1.5 flex items-center justify-between text-[13px]">
                  <span className="font-medium text-fg">{c.name}</span>
                  <span className="num text-fg-muted">
                    {c.successRate == null ? "—" : `${c.successRate}%`}
                    <span className="ml-1.5 text-fg-faint">({c.correct}/{c.graded})</span>
                  </span>
                </div>
                <ProgressBar value={c.successRate ?? 0} color={scoreColor(c.successRate ?? 0)} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function Header() {
  return (
    <div>
      <h2 className="text-[22px] font-bold tracking-[-0.4px] text-fg">İnkişafım</h2>
      <p className="mt-0.5 text-[13.5px] text-fg-muted">Nəticə trendin, güclü-zəif tərəflərin və müqayisə</p>
    </div>
  );
}

function CompareRow({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="mb-3 last:mb-0">
      <div className="mb-1.5 flex items-center justify-between text-[13px]">
        <span className={cn("font-medium", highlight ? "text-fg" : "text-fg-muted")}>{label}</span>
        <span className="num font-semibold text-fg">{value}%</span>
      </div>
      <ProgressBar value={value} color={highlight ? "#8E6F17" : "#94a3b8"} height={highlight ? 10 : 8} />
    </div>
  );
}

function Stat({
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
        <div className="num text-[19px] font-semibold leading-none text-fg">{value}</div>
        <div className="mt-1 text-[11.5px] text-fg-muted">{label}</div>
      </div>
    </div>
  );
}

/** Compact SVG score-trend line chart. */
function TrendChart({ points }: { points: ProgressTrendPoint[] }) {
  const W = 640;
  const H = 200;
  const padX = 30;
  const padY = 22;
  const pts = points.filter((p) => p.score != null);
  if (pts.length < 2) return null;

  const n = pts.length;
  const xAt = (i: number) => padX + (i * (W - 2 * padX)) / (n - 1);
  const yAt = (v: number) => padY + (1 - v / 100) * (H - 2 * padY);

  const coords = pts.map((p, i) => ({ x: xAt(i), y: yAt(Number(p.score)), p }));
  const line = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ");
  const area = `${line} L${coords[n - 1].x.toFixed(1)},${(H - padY).toFixed(1)} L${coords[0].x.toFixed(1)},${(H - padY).toFixed(1)} Z`;

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-[200px] w-full min-w-[420px]">
        {[0, 25, 50, 75, 100].map((g) => {
          const y = yAt(g);
          return (
            <g key={g}>
              <line x1={padX} y1={y} x2={W - padX} y2={y} className="stroke-line" strokeWidth="1" />
              <text x={4} y={y + 3} className="fill-fg-faint" style={{ fontSize: 9 }}>{g}</text>
            </g>
          );
        })}
        <path d={area} fill="#B4902F" opacity="0.10" />
        <path d={line} fill="none" stroke="#8E6F17" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {coords.map((c, i) => (
          <g key={i}>
            <circle cx={c.x} cy={c.y} r="3.5" fill="#8E6F17" />
            <title>{`${c.p.examTitle}: ${Math.round(Number(c.p.score))}% · ${formatDate(c.p.date)}`}</title>
          </g>
        ))}
      </svg>
    </div>
  );
}
