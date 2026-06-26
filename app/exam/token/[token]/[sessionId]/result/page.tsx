"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { publicFetch } from "@/lib/publicApi";
import type { SessionResult } from "@/lib/types";
import { ResultView } from "@/components/exam/ResultView";
import { Loading } from "@/components/ui/Feedback";

export default function CandidateResultPage() {
  const params = useParams();
  const token = params.token as string;
  const sessionId = Number(params.sessionId);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    publicFetch<SessionResult>(`/api/v1/public/exam-token/${token}/sessions/${sessionId}/result`)
      .then(setResult)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, sessionId]);

  if (loading) return <Loading label="Nəticə yüklənir…" />;
  if (error || !result) {
    return <div className="card mx-auto max-w-md p-6 text-center text-[14px] text-danger-fg">{error || "Nəticə tapılmadı"}</div>;
  }

  return (
    <div className="mx-auto max-w-[900px] px-4 py-8">
      <ResultView result={result} />
    </div>
  );
}
