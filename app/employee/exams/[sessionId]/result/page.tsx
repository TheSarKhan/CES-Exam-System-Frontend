"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { SessionResult } from "@/lib/types";
import { ResultView } from "@/components/exam/ResultView";
import { Loading } from "@/components/ui/Feedback";

export default function EmployeeResultPage() {
  const params = useParams();
  const sessionId = Number(params.sessionId);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<SessionResult>(`/api/v1/sessions/${sessionId}/result`)
      .then(setResult)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) return <Loading label="Nəticə yüklənir…" />;
  if (error || !result) {
    return <div className="card mx-auto max-w-md p-6 text-center text-[14px] text-danger-fg">{error || "Nəticə tapılmadı"}</div>;
  }

  return (
    <div>
      <Link href="/employee/exams" className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-fg-muted hover:text-fg">
        <ArrowLeft size={15} /> İmtahanlarıma qayıt
      </Link>
      <ResultView result={result} />
    </div>
  );
}
