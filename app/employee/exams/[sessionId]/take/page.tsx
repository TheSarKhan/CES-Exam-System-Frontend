"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { SessionStart } from "@/lib/types";
import { ExamRunner, type SubmitPayload } from "@/components/exam/ExamRunner";
import { Loading } from "@/components/ui/Feedback";
import { buttonClasses } from "@/components/ui/Button";

export default function TakeExamPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = Number(params.sessionId);
  const { user } = useAuth();

  const [session, setSession] = useState<SessionStart | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<SessionStart>(`/api/v1/sessions/${sessionId}`)
      .then(setSession)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) return <Loading label="İmtahan yüklənir…" />;
  if (error || !session) {
    return (
      <div className="card mx-auto mt-6 max-w-md p-6 text-center">
        <p className="mb-4 text-[14px] text-danger-fg">{error || "Sessiya tapılmadı"}</p>
        <Link href="/employee/exams" className={buttonClasses("outline", "md")}>
          İmtahanlarıma qayıt
        </Link>
      </div>
    );
  }

  const submit = async (payload: SubmitPayload) => {
    await apiFetch(`/api/v1/sessions/${sessionId}/submit`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    router.push(`/employee/exams/${sessionId}/result`);
  };

  return (
    <ExamRunner
      session={session}
      takerName={user ? `${user.firstName} ${user.lastName}` : undefined}
      backHref="/employee/exams"
      onSubmit={submit}
    />
  );
}
