"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertTriangle, ArrowLeft, ShieldAlert } from "lucide-react";
import { publicFetch } from "@/lib/publicApi";
import { humanizeError } from "@/lib/errors";
import type { SessionResult } from "@/lib/types";
import { ResultView } from "@/components/exam/ResultView";
import { Loading } from "@/components/ui/Feedback";
import { buttonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

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
      .catch((e) => setError(humanizeError(e, "Nəticə yüklənmədi")))
      .finally(() => setLoading(false));
  }, [token, sessionId]);

  if (loading) return <Loading label="Nəticə yüklənir…" />;
  if (error || !result) {
    return (
      <div className="flex min-h-[72vh] items-center justify-center px-4 py-10">
        <div className="card max-w-[440px] p-8 text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger-bg text-danger-fg">
            <AlertTriangle size={28} />
          </span>
          <h2 className="text-[19px] font-bold tracking-[-0.3px] text-fg">Nəticə açıla bilmədi</h2>
          <p className="mx-auto mt-2 max-w-[320px] text-[14px] leading-relaxed text-fg-muted">
            {error || "Nəticə tapılmadı."}
          </p>
          <Link href={`/exam/token/${token}`} className={cn(buttonClasses("primary", "md"), "mt-6")}>
            <ArrowLeft size={16} /> Geri
          </Link>
        </div>
      </div>
    );
  }

  const autoTerminated = result.terminationReason === "PROCTORING";

  // Auto-terminated by anti-cheat: never show a "successfully submitted" message — make it
  // explicit the session ended automatically because of a rules violation.
  if (autoTerminated) {
    return (
      <div className="mx-auto mt-10 max-w-md px-4">
        <div className="card flex flex-col items-center p-8 text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger-bg text-danger-fg">
            <ShieldAlert size={30} />
          </span>
          <h2 className="text-[19px] font-bold text-fg">Sessiya avtomatik dayandırıldı</h2>
          <p className="mt-2 text-[14px] text-fg-muted">
            İmtahan qaydalarının pozulması (icazəsiz keçidlər) aşkarlandığı üçün sessiya avtomatik
            tamamlandı. O ana qədərki cavablarınız qeydə alındı və təşkilat tərəfindən
            yoxlanılacaq.
          </p>
        </div>
      </div>
    );
  }

  // When the admin disabled "show result to candidate", the server returns a masked result.
  if (result.resultHidden) {
    return (
      <div className="mx-auto mt-10 max-w-md px-4">
        <div className="card flex flex-col items-center p-8 text-center">
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success-bg text-success-fg">
            <CheckCircle2 size={30} />
          </span>
          <h2 className="text-[19px] font-bold text-fg">İmtahan tamamlandı</h2>
          <p className="mt-2 text-[14px] text-fg-muted">
            Cavablarınız qeydə alındı. Nəticəniz təşkilat tərəfindən qiymətləndiriləcək.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[900px] px-4 py-8">
      <ResultView result={result} />
    </div>
  );
}
