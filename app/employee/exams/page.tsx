"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, Clock, CalendarClock, FileText, CheckCircle2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { MyAssignment } from "@/lib/types";
import { StatusPill } from "@/components/ui/Badge";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Loading, EmptyState } from "@/components/ui/Feedback";
import { formatDate } from "@/lib/format";

export default function EmployeeExamsPage() {
  const [items, setItems] = useState<MyAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [starting, setStarting] = useState<number | null>(null);

  useEffect(() => {
    apiFetch<MyAssignment[]>("/api/v1/assignments/my")
      .then(setItems)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Only active work belongs here; finished exams live under "Nəticələrim".
  const active = items.filter((a) => a.status !== "COMPLETED");

  const start = async (a: MyAssignment) => {
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

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[22px] font-bold tracking-[-0.4px] text-fg">İmtahanlarım</h2>
          <p className="mt-0.5 text-[13.5px] text-fg-muted">Səni gözləyən aktiv imtahan və sorğular</p>
        </div>
        {active.length > 0 && (
          <span className="num rounded-full bg-blue-50 px-3 py-1 text-[12.5px] font-semibold text-blue-700 dark:bg-blue-600/15 dark:text-blue-300">
            {active.length} aktiv
          </span>
        )}
      </div>

      {error && <div className="mb-4 rounded-[11px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-danger-fg">{error}</div>}

      {loading ? (
        <Loading />
      ) : active.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<CheckCircle2 size={22} />}
            title="Aktiv imtahan yoxdur"
            description="Hazırda səni gözləyən imtahan yoxdur. Tamamladıqların Nəticələrim bölməsindədir."
            action={<Link href="/employee/results" className={buttonClasses("outline", "sm")}>Nəticələrimə bax</Link>}
          />
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {active.map((a) => {
            const inProgress = a.status === "IN_PROGRESS";
            return (
              <div key={a.assignmentId} className="card flex flex-col gap-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-blue-50 text-blue-700 dark:bg-blue-600/15 dark:text-blue-400">
                    <FileText size={20} />
                  </span>
                  <StatusPill status={inProgress ? "active" : "scheduled"} label={inProgress ? "Davam edir" : "Gözləyir"} />
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="text-[15.5px] font-semibold leading-snug text-fg">{a.examTitle}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] text-fg-muted">
                    <span>{a.examType === "SURVEY" ? "Sorğu" : "İmtahan"}</span>
                    {a.durationMinutes && <span className="flex items-center gap-1.5"><Clock size={13} /> <span className="num">{a.durationMinutes}</span> dəqiqə</span>}
                    {a.endDate && <span className="flex items-center gap-1.5"><CalendarClock size={13} /> Son tarix: <span className="num">{formatDate(a.endDate)}</span></span>}
                  </div>
                </div>

                <Button
                  className="w-full"
                  loading={starting === a.assignmentId}
                  iconRight={<ArrowRight size={16} />}
                  onClick={() => start(a)}
                >
                  {inProgress ? "Davam et" : "İmtahana başla"}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
