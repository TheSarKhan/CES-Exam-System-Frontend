"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { publicFetch } from "@/lib/publicApi";
import type { SessionStart } from "@/lib/types";
import { ExamRunner, type SubmitPayload } from "@/components/exam/ExamRunner";
import { Loading } from "@/components/ui/Feedback";
import { buttonClasses } from "@/components/ui/Button";

export default function CandidateTakeExamPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const sessionId = Number(params.sessionId);

  const [session, setSession] = useState<SessionStart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    publicFetch<SessionStart>(`/api/v1/public/exam-token/${token}/sessions/${sessionId}`)
      .then(setSession)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, sessionId]);

  if (loading) return <Loading label="İmtahan yüklənir…" />;
  if (error || !session) {
    return (
      <div className="card mx-auto mt-6 max-w-md p-6 text-center">
        <p className="mb-4 text-[14px] text-danger-fg">{error || "Sessiya tapılmadı"}</p>
        <Link href={`/exam/token/${token}`} className={buttonClasses("outline", "md")}>
          Geri
        </Link>
      </div>
    );
  }

  const submit = async (payload: SubmitPayload) => {
    await publicFetch(`/api/v1/public/exam-token/${token}/sessions/${sessionId}/submit`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    router.push(`/exam/token/${token}/${sessionId}/result`);
  };

  return <ExamRunner session={session} onSubmit={submit} />;
}
