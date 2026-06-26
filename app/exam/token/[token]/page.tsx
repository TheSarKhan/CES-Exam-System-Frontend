"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Clock, Calendar, ShieldCheck, ArrowRight } from "lucide-react";
import { publicFetch } from "@/lib/publicApi";
import type { TokenAssignment, SessionStart } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Feedback";

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("az", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function CandidateExamLandingPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [info, setInfo] = useState<TokenAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    publicFetch<TokenAssignment>(`/api/v1/public/exam-token/${token}`)
      .then(setInfo)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const start = async () => {
    setStarting(true);
    setError("");
    try {
      if (info?.status === "IN_PROGRESS" && info.sessionId) {
        router.push(`/exam/token/${token}/${info.sessionId}/take`);
        return;
      }
      if (info?.status === "COMPLETED" && info.sessionId) {
        router.push(`/exam/token/${token}/${info.sessionId}/result`);
        return;
      }
      const s = await publicFetch<SessionStart>(`/api/v1/public/exam-token/${token}/start`, { method: "POST" });
      router.push(`/exam/token/${token}/${s.sessionId}/take`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "İmtahana başlanmadı");
      setStarting(false);
    }
  };

  if (loading) return <div className="px-4 py-10"><Loading /></div>;
  if (!info) {
    return <div className="mx-auto mt-10 max-w-md px-4 text-center text-[14px] text-danger-fg">{error || "İmtahan linki tapılmadı."}</div>;
  }

  return (
    <div className="mx-auto max-w-[640px] px-4 py-10">
      <div className="card overflow-hidden p-0">
        <div className="relative overflow-hidden p-7 text-white" style={{ background: "linear-gradient(135deg,#0E1B33,#1D3A6B)" }}>
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full" style={{ background: "radial-gradient(circle,rgba(59,130,246,0.35),transparent 70%)" }} />
          <div className="relative">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-blue-300">Qiymətləndirmə</span>
            <h1 className="mt-2 text-[22px] font-bold tracking-[-0.3px]">{info.examTitle}</h1>
            <p className="mt-1 text-[13.5px] text-slate-300">Xoş gəldiniz, {info.candidateName}</p>
          </div>
        </div>

        <div className="p-7">
          {info.examDescription && <p className="mb-5 text-[14px] leading-relaxed text-fg-soft">{info.examDescription}</p>}

          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {info.durationMinutes && (
              <Info icon={<Clock size={16} />} label="Müddət" value={`${info.durationMinutes} dəqiqə`} />
            )}
            <Info icon={<Calendar size={16} />} label="Son tarix" value={fmt(info.endDate)} />
          </div>

          {error && <div className="mb-4 rounded-[11px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-danger-fg">{error}</div>}

          {info.status === "COMPLETED" ? (
            <Button size="lg" className="w-full" onClick={() => router.push(`/exam/token/${token}/${info.sessionId}/result`)}>
              Nəticəyə bax
            </Button>
          ) : (
            <Button size="lg" className="w-full" loading={starting} iconRight={<ArrowRight size={18} />} onClick={start}>
              {info.status === "IN_PROGRESS" ? "İmtahana davam et" : "İmtahana başla"}
            </Button>
          )}

          <p className="mt-5 flex items-center justify-center gap-1.5 text-[12px] text-fg-faint">
            <ShieldCheck size={14} /> Bu, birdəfəlik təhlükəsiz imtahan linkidir. Başqaları ilə paylaşmayın.
          </p>
        </div>
      </div>
    </div>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-[11px] border border-line bg-surface-2 px-4 py-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-blue-50 text-blue-600">{icon}</span>
      <div>
        <div className="text-[11.5px] text-fg-muted">{label}</div>
        <div className="num text-[13.5px] font-semibold text-fg">{value}</div>
      </div>
    </div>
  );
}
