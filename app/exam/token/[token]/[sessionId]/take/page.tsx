"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, ArrowLeft } from "lucide-react";
import { publicFetch } from "@/lib/publicApi";
import { humanizeError } from "@/lib/errors";
import type { SessionStart, PublicSettings } from "@/lib/types";
import { ExamRunner, type SubmitPayload } from "@/components/exam/ExamRunner";
import { Loading } from "@/components/ui/Feedback";
import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

export default function CandidateTakeExamPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const sessionId = Number(params.sessionId);

  const [session, setSession] = useState<SessionStart | null>(null);
  const [proctoring, setProctoring] = useState(true);
  const [tabLimit, setTabLimit] = useState(3);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    publicFetch<SessionStart>(`/api/v1/public/exam-token/${token}/sessions/${sessionId}`)
      .then(setSession)
      .catch((e) => setError(humanizeError(e, "İmtahan sessiyası yüklənmədi")))
      .finally(() => setLoading(false));
    publicFetch<PublicSettings>("/api/v1/public/settings")
      .then((s) => { setProctoring(s.proctoringEnabled); setTabLimit(s.tabSwitchLimit ?? 3); })
      .catch(() => { /* default to enabled */ });
  }, [token, sessionId]);

  if (loading) return <Loading label="İmtahan yüklənir…" />;
  if (error || !session) {
    return (
      <div className="flex min-h-[72vh] items-center justify-center px-4 py-10">
        <div className="card max-w-[440px] p-8 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger-bg text-danger-fg">
            <AlertTriangle size={28} />
          </span>
          <h2 className="text-[19px] font-bold tracking-[-0.3px] text-fg">İmtahana daxil olmaq mümkün olmadı</h2>
          <p className="mx-auto mt-2 max-w-[320px] text-[14px] leading-relaxed text-fg-muted">
            {error || "İmtahan sessiyası tapılmadı."}
          </p>
          <Link href={`/exam/token/${token}`} className={cn(buttonClasses("primary", "md"), "mt-6")}>
            <ArrowLeft size={16} /> Geri
          </Link>
        </div>
      </div>
    );
  }

  const submit = async (payload: SubmitPayload) => {
    // Honour the system proctoring setting: drop captured violations when it's off.
    const body = proctoring ? payload : { ...payload, violations: undefined };
    await publicFetch(`/api/v1/public/exam-token/${token}/sessions/${sessionId}/submit`, {
      method: "POST",
      body: JSON.stringify(body),
    });
    router.push(`/exam/token/${token}/${sessionId}/result`);
  };

  // 0 = limitsiz → effectively never auto-terminate on tab switches.
  const antiCheatLimit = proctoring ? (tabLimit > 0 ? tabLimit : Number.MAX_SAFE_INTEGER) : Number.MAX_SAFE_INTEGER;

  return <ExamRunner session={session} antiCheatLimit={antiCheatLimit} onSubmit={submit} />;
}
