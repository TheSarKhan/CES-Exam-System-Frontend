"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, FileText, CheckCircle2, TrendingUp, Trophy } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { MyAssignment } from "@/lib/types";
import { ResultPill } from "@/components/ui/Badge";
import { Segmented } from "@/components/ui/DataViz";
import { Loading, EmptyState } from "@/components/ui/Feedback";
import { cn } from "@/lib/cn";
import { formatDate } from "@/lib/format";

type Filter = "all" | "pass" | "fail";

export default function EmployeeResultsPage() {
  const [items, setItems] = useState<MyAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    apiFetch<MyAssignment[]>("/api/v1/assignments/my")
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const completed = useMemo(
    () =>
      items
        .filter((a) => a.status === "COMPLETED")
        .sort((a, b) => (b.endDate ?? "").localeCompare(a.endDate ?? "")),
    [items],
  );

  const scored = completed.filter((a) => a.score != null && a.passed != null);
  const avg = scored.length ? Math.round(scored.reduce((s, a) => s + (a.score ?? 0), 0) / scored.length) : null;
  const best = scored.length ? Math.max(...scored.map((a) => a.score ?? 0)) : null;
  const passedCount = completed.filter((a) => a.passed === true).length;

  const view = useMemo(
    () =>
      completed.filter((a) =>
        filter === "all" ? true : filter === "pass" ? a.passed === true : a.passed === false,
      ),
    [completed, filter],
  );

  if (loading) return <Loading />;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="text-[22px] font-bold tracking-[-0.4px] text-fg">Nəticələrim</h2>
        <p className="mt-0.5 text-[13.5px] text-fg-muted">Tamamladığın bütün imtahan və sorğular</p>
      </div>

      {error && <div className="rounded-[11px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-danger-fg">{error}</div>}

      {completed.length === 0 ? (
        <div className="card">
          <EmptyState icon={<FileText size={22} />} title="Hələ nəticə yoxdur" description="İmtahan tamamladıqca nəticələrin burada görünəcək." />
        </div>
      ) : (
        <>
          {/* summary */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat icon={<CheckCircle2 size={17} />} tone="gold" value={completed.length} label="Tamamlanmış" />
            <Stat icon={<TrendingUp size={17} />} tone="green" value={avg == null ? "—" : `${avg}%`} label="Orta nəticə" />
            <Stat icon={<Trophy size={17} />} tone="amber" value={best == null ? "—" : `${best}%`} label="Ən yüksək" />
            <Stat icon={<CheckCircle2 size={17} />} tone="green" value={passedCount} label="Keçilmiş" />
          </div>

          {/* filter */}
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-[16px] font-semibold text-fg">Tarixçə</h3>
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

          {view.length === 0 ? (
            <div className="card">
              <EmptyState icon={<FileText size={22} />} title="Bu filtrə uyğun nəticə yoxdur" />
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {view.map((a) => (
                <Link
                  key={a.assignmentId}
                  href={a.sessionId ? `/employee/exams/${a.sessionId}/result` : "#"}
                  className="card flex items-center gap-4 p-4 transition-colors hover:bg-surface-2"
                >
                  <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-[11px]", a.passed === false ? "bg-danger-bg text-danger-fg" : "bg-success-bg text-success-fg")}>
                    {a.passed === false ? "✕" : <CheckCircle2 size={20} />}
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
          )}
        </>
      )}
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
