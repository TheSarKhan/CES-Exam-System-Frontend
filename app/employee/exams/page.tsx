"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { MyAssignment } from "@/lib/types";
import { StatusPill, ResultPill } from "@/components/ui/Badge";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Loading, EmptyState } from "@/components/ui/Feedback";
import { FileText } from "lucide-react";

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("az", { day: "2-digit", month: "short", year: "numeric" });
}

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
      <div className="mb-6">
        <h2 className="text-[22px] font-bold tracking-[-0.4px] text-fg">İmtahanlarım</h2>
        <p className="mt-0.5 text-[13.5px] text-fg-muted">Sənə təyin olunmuş bütün imtahan və sorğular</p>
      </div>

      {error && <div className="mb-4 rounded-[11px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-danger-fg">{error}</div>}

      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <div className="card">
          <EmptyState icon={<FileText size={22} />} title="İmtahan təyin olunmayıb" description="Sənə imtahan təyin olunduqda burada görünəcək." />
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map((a) => (
            <div key={a.assignmentId} className="card flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <div className="text-[15px] font-semibold text-fg">{a.examTitle}</div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-[12.5px] text-fg-muted">
                  <span>{a.examType === "SURVEY" ? "Sorğu" : "İmtahan"}</span>
                  {a.durationMinutes && <span className="num">{a.durationMinutes} dəq</span>}
                  <span>Son tarix: <span className="num">{fmt(a.endDate)}</span></span>
                </div>
              </div>

              {a.status === "COMPLETED" ? (
                a.passed == null ? <ResultPill result="survey" /> : a.passed ? <ResultPill result="pass" /> : <ResultPill result="fail" />
              ) : (
                <StatusPill status={a.status === "IN_PROGRESS" ? "active" : "scheduled"} label={a.status === "IN_PROGRESS" ? "Davam edir" : "Gözləyir"} />
              )}

              {a.status === "COMPLETED" && a.score != null && (
                <span className="num w-12 text-right text-[15px] font-semibold text-fg">{a.score}%</span>
              )}

              {a.status === "COMPLETED" && a.sessionId ? (
                <Link href={`/employee/exams/${a.sessionId}/result`} className={buttonClasses("outline", "sm")}>
                  Nəticə
                </Link>
              ) : a.status !== "COMPLETED" ? (
                <Button size="sm" loading={starting === a.assignmentId} iconRight={<ArrowRight size={15} />} onClick={() => start(a)}>
                  {a.status === "IN_PROGRESS" ? "Davam et" : "Başla"}
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
