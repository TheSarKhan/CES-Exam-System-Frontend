"use client";

import React from "react";
import { Check, X, Minus, CheckCircle2 } from "lucide-react";
import type { SessionResult } from "@/lib/types";
import { Gauge } from "@/components/ui/DataViz";
import { ResultPill } from "@/components/ui/Badge";
import { questionTypeLabel } from "./QuestionInput";
import { cn } from "@/lib/cn";

export function ResultView({ result }: { result: SessionResult }) {
  const isSurvey = result.passed == null && result.passMark == null;
  const correct = result.answers.filter((a) => a.isCorrect === true).length;
  const wrong = result.answers.filter((a) => a.isCorrect === false).length;
  const blank = result.answers.filter(
    (a) => a.selectedOptionId == null && (!a.textAnswer || !a.textAnswer.trim()),
  ).length;

  return (
    <div className="mx-auto flex max-w-[860px] flex-col gap-5">
      {/* Summary */}
      <div className="card p-6 sm:p-8">
        <h2 className="text-[20px] font-bold tracking-[-0.3px] text-fg">{result.examTitle}</h2>

        {isSurvey ? (
          <div className="mt-6 flex flex-col items-center gap-3 py-6 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success-bg text-success-fg">
              <CheckCircle2 size={32} />
            </span>
            <h3 className="text-[18px] font-semibold text-fg">Cavablarınız uğurla göndərildi</h3>
            <p className="max-w-[360px] text-[13.5px] text-fg-muted">
              Sorğudakı iştirakınız üçün təşəkkür edirik. Cavablarınız statistik analiz üçün saxlanıldı.
            </p>
          </div>
        ) : (
          <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row sm:justify-between">
            <div className="flex items-center gap-6">
              <Gauge value={result.score ?? 0} label="nəticə" />
              <div className="flex flex-col gap-2">
                {result.passed ? <ResultPill result="pass" /> : <ResultPill result="fail" />}
                {result.passMark != null && (
                  <span className="text-[13px] text-fg-muted">
                    Keçid balı: <span className="num font-semibold text-fg">{result.passMark}%</span>
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Stat icon={<Check size={16} />} tone="green" value={correct} label="Düzgün" />
              <Stat icon={<X size={16} />} tone="red" value={wrong} label="Səhv" />
              <Stat icon={<Minus size={16} />} tone="slate" value={blank} label="Boş" />
            </div>
          </div>
        )}
      </div>

      {/* Answer review */}
      <div className="flex flex-col gap-2.5">
        <h3 className="text-[15px] font-semibold text-fg">Cavabların təhlili</h3>
        {result.answers.map((a, i) => {
          const answered = a.selectedOptionText || a.textAnswer;
          return (
            <div key={a.questionId} className="card p-4">
              <div className="flex items-start gap-3">
                {!isSurvey && (
                  <span
                    className={cn(
                      "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                      a.isCorrect === true
                        ? "bg-success-bg text-success-fg"
                        : a.isCorrect === false
                          ? "bg-danger-bg text-danger-fg"
                          : "bg-slate-100 text-slate-500 dark:bg-surface-2",
                    )}
                  >
                    {a.isCorrect === true ? <Check size={14} strokeWidth={3} /> : a.isCorrect === false ? <X size={14} strokeWidth={3} /> : "?"}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="num text-[11.5px] font-semibold text-fg-faint">#{i + 1}</span>
                    <span className="text-[11px] text-fg-faint">{questionTypeLabel(a.type)}</span>
                  </div>
                  <p className="mt-1 text-[14px] font-medium text-fg">{a.questionText}</p>
                  <p className="mt-1.5 text-[13px] text-fg-muted">
                    Cavabınız:{" "}
                    <span className="text-fg-soft">{answered || <em className="text-fg-faint">boş</em>}</span>
                  </p>
                </div>
                {!isSurvey && a.score > 0 && (
                  <span className="num shrink-0 text-[13px] font-semibold text-fg">{a.score} bal</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Stat({
  icon,
  tone,
  value,
  label,
}: {
  icon: React.ReactNode;
  tone: "green" | "red" | "slate";
  value: number;
  label: string;
}) {
  const tones = {
    green: { bg: "#DCFCE7", fg: "#15803D" },
    red: { bg: "#FEE2E2", fg: "#B91C1C" },
    slate: { bg: "#F1F5F9", fg: "#475569" },
  } as const;
  const t = tones[tone];
  return (
    <div className="flex flex-col items-center gap-1 rounded-[11px] border border-line px-3 py-3">
      <span className="flex h-8 w-8 items-center justify-center rounded-[9px]" style={{ background: t.bg, color: t.fg }}>
        {icon}
      </span>
      <span className="num text-[18px] font-semibold text-fg">{value}</span>
      <span className="text-[11px] text-fg-muted">{label}</span>
    </div>
  );
}
