"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Clock, Calendar, ShieldCheck, ArrowRight, Repeat, Save, Eye, Timer } from "lucide-react";
import { publicFetch } from "@/lib/publicApi";
import type { TokenAssignment, SessionStart, PublicSettings } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Feedback";
import { formatDateTime } from "@/lib/format";

function fmt(iso: string | null) {
  return formatDateTime(iso);
}

export default function CandidateExamLandingPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [info, setInfo] = useState<TokenAssignment | null>(null);
  const [settings, setSettings] = useState<PublicSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");

  useEffect(() => {
    publicFetch<TokenAssignment>(`/api/v1/public/exam-token/${token}`)
      .then(setInfo)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    publicFetch<PublicSettings>("/api/v1/public/settings")
      .then(setSettings)
      .catch(() => { /* branding optional */ });
  }, [token]);

  // Anti-cheat applies to exams only, so surveys never show the monitoring notice.
  const proctoring = (settings?.proctoringEnabled ?? true) && info?.examType !== "SURVEY";

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
      const s = await publicFetch<SessionStart>(`/api/v1/public/exam-token/${token}/start`, {
        method: "POST",
        body: JSON.stringify({ candidateName: name.trim() || null }),
      });
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
        <div className="relative flex min-h-[170px] flex-col justify-end overflow-hidden p-7 text-white">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/exam-hero.png" alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(90deg, rgba(24,22,18,0.94) 0%, rgba(24,22,18,0.74) 45%, rgba(24,22,18,0.30) 100%), linear-gradient(0deg, rgba(24,22,18,0.6), transparent 62%)",
            }}
          />
          <div className="relative">
            <span className="text-[12px] font-semibold uppercase tracking-wider text-[#C9A24B]">{settings?.orgName || "Qiymətləndirmə"}</span>
            <h1 className="mt-2 text-[22px] font-bold tracking-[-0.3px]">{info.examTitle}</h1>
            <p className="mt-1 text-[13.5px] text-slate-300">{info.candidateName ? `Xoş gəldiniz, ${info.candidateName}` : "İmtahana xoş gəldiniz"}</p>
          </div>
        </div>

        <div className="p-7">
          {info.examDescription && <p className="mb-5 text-[14px] leading-relaxed text-fg-soft">{info.examDescription}</p>}

          <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {info.durationMinutes && (
              <Info icon={<Clock size={16} />} label="Müddət" value={`${info.durationMinutes} dəqiqə`} />
            )}
            <Info icon={<Calendar size={16} />} label="Son tarix" value={fmt(info.endDate)} />
          </div>

          {info.status === "PENDING" && (
            <div className="mb-6 rounded-[13px] border border-line bg-surface-2 p-4">
              <p className="mb-3 text-[12.5px] font-semibold uppercase tracking-wide text-fg-muted">Başlamazdan əvvəl</p>
              <div className="flex flex-col gap-3">
                <Rule icon={<Repeat size={15} />} text="İmtahan yalnız bir dəfə verilə bilər — başladıqdan sonra dayandırıla bilməz." />
                <Rule icon={<Save size={15} />} text="Cavablarınız avtomatik yadda saxlanılır; səhv olsa qaldığınız yerdən davam edə bilərsiniz." />
                {proctoring && (
                  <Rule icon={<Eye size={15} />} text="Səhifədən çıxış və tab dəyişikliyi izlənilir; təkrarlanarsa imtahan avtomatik bitə bilər." />
                )}
                {info.durationMinutes && (
                  <Rule icon={<Timer size={15} />} text={`Vaxt ${info.durationMinutes} dəqiqədir; bitdikdə cavablar avtomatik təhvil verilir.`} />
                )}
              </div>
            </div>
          )}

          {info.status === "PENDING" && !info.candidateName && (
            <div className="mb-4">
              <label className="mb-1.5 block text-[13px] font-semibold text-fg-soft">Adınız (ixtiyari)</label>
              <input className="field w-full" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ad Soyad" />
            </div>
          )}

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

function Rule({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[7px] bg-blue-50 text-blue-600 dark:bg-blue-600/10">{icon}</span>
      <span className="text-[13px] leading-relaxed text-fg-soft">{text}</span>
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
