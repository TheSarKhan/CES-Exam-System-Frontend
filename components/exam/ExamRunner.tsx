"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CheckSquare,
  Clock,
  Flag,
  ArrowLeft,
  ArrowRight,
  Check,
  ShieldAlert,
  Maximize,
} from "lucide-react";
import type { SessionStart, SessionQuestion } from "@/lib/types";
import {
  QuestionInput,
  isAnswered,
  toSubmitPayload,
  questionTypeLabel,
  type AnswerValue,
} from "./QuestionInput";
import { useAntiCheat } from "./useAntiCheat";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Feedback";
import { cn } from "@/lib/cn";

type AnswerState = Record<number, AnswerValue>;

export interface SubmitPayload {
  answers: { questionId: number; selectedOptionId: number | null; textAnswer: string | null }[];
}

export function ExamRunner({
  session,
  takerName,
  antiCheatLimit = 3,
  onSubmit,
}: {
  session: SessionStart;
  takerName?: string;
  antiCheatLimit?: number;
  onSubmit: (payload: SubmitPayload) => Promise<void>;
}) {
  const questions = session.questions;
  const storageKey = `ces_exam_${session.sessionId}`;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const submittedRef = useRef(false);

  /* ---- restore autosave ---- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.answers) setAnswers(parsed.answers);
        if (parsed.flagged) setFlagged(new Set(parsed.flagged));
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  /* ---- persist autosave ---- */
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify({ answers, flagged: [...flagged] }));
      setSavedAt(Date.now());
    } catch {
      /* ignore */
    }
  }, [answers, flagged, storageKey]);

  const doSubmit = useCallback(async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    try {
      await onSubmit({ answers: questions.map((q) => toSubmitPayload(q, answers[q.id])) });
      localStorage.removeItem(storageKey);
    } catch (e) {
      submittedRef.current = false;
      setSubmitting(false);
      alert(e instanceof Error ? e.message : "Göndərmə alınmadı");
    }
  }, [answers, questions, onSubmit, storageKey]);

  const anti = useAntiCheat({
    enabled: true,
    limit: antiCheatLimit,
    onTerminate: () => {
      void doSubmit();
    },
  });

  /* ---- timer ---- */
  const endMs = useMemo(
    () => (session.durationMinutes ? new Date(session.startTime).getTime() + session.durationMinutes * 60000 : null),
    [session.startTime, session.durationMinutes],
  );
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    if (!endMs) return;
    const tick = () => {
      const left = Math.max(0, endMs - Date.now());
      setRemaining(left);
      if (left === 0) void doSubmit();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endMs, doSubmit]);

  const answeredCount = questions.filter((q) => isAnswered(q.type, answers[q.id])).length;
  const progress = Math.round((answeredCount / questions.length) * 100);
  const current = questions[currentIndex];

  const setAnswer = (q: SessionQuestion, a: AnswerValue) =>
    setAnswers((prev) => ({ ...prev, [q.id]: a }));

  const toggleFlag = (id: number) =>
    setFlagged((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const requestFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
  };

  const mins = remaining != null ? Math.floor(remaining / 60000) : 0;
  const secs = remaining != null ? Math.floor((remaining % 60000) / 1000) : 0;
  const lowTime = remaining != null && remaining < 60000;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-app">
      {/* Top bar */}
      <header className="flex h-16 flex-none items-center justify-between border-b border-line bg-surface px-5">
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-gradient-to-br from-blue-500 to-blue-700">
            <CheckSquare size={18} className="text-white" />
          </span>
          <div className="min-w-0">
            <div className="truncate text-[15px] font-bold tracking-[-0.2px] text-fg">{session.examTitle}</div>
            {takerName && <div className="truncate text-[12px] text-fg-muted">{takerName}</div>}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold",
              anti.count > 0 ? "bg-warning-bg text-warning-fg" : "bg-slate-100 text-slate-500 dark:bg-surface-2",
            )}
            title="Anti-cheat xəbərdarlıqları"
          >
            <ShieldAlert size={14} />
            <span className="num">{anti.count}/{anti.limit}</span> xəbərdarlıq
          </span>

          <button
            onClick={requestFullscreen}
            title="Tam ekran"
            className="flex h-9 w-9 items-center justify-center rounded-[9px] text-fg-muted hover:bg-slate-100 dark:hover:bg-surface-2"
          >
            <Maximize size={17} />
          </button>

          {endMs && (
            <span
              className={cn(
                "flex items-center gap-2 rounded-full px-3.5 py-2 text-white",
                lowTime ? "bg-danger animate-[pulse-dot_1.2s_ease_infinite]" : "bg-sidebar",
              )}
            >
              <Clock size={15} className={lowTime ? "text-white" : "text-blue-400"} />
              <span className="num text-[16px] font-semibold tracking-wide">
                {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
              </span>
            </span>
          )}
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-[5px] flex-none bg-line">
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-700 transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Anti-cheat warning */}
      {anti.warning && (
        <div
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 text-[13px] font-medium text-white",
            anti.warning.severity === "CRITICAL" ? "bg-danger" : "bg-warning",
          )}
        >
          <ShieldAlert size={16} /> {anti.warning.label}
        </div>
      )}

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-6 p-5 lg:flex-row lg:p-6">
          {/* Question card */}
          <div className="card flex-1 p-6 sm:p-8">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="num text-[13px] font-semibold text-blue-600">
                  Sual {currentIndex + 1}/{questions.length}
                </span>
                <span className="text-fg-faint">·</span>
                <span className="text-[13px] text-fg-muted">{questionTypeLabel(current.type)}</span>
                {current.score > 0 && (
                  <>
                    <span className="text-fg-faint">·</span>
                    <span className="num text-[13px] text-fg-muted">{current.score} bal</span>
                  </>
                )}
              </div>
              <button
                onClick={() => toggleFlag(current.id)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-[12.5px] font-medium transition-colors",
                  flagged.has(current.id)
                    ? "bg-warning-bg text-warning-fg"
                    : "text-fg-muted hover:bg-slate-100 dark:hover:bg-surface-2",
                )}
              >
                <Flag size={14} className={flagged.has(current.id) ? "fill-current" : ""} />
                İşarələ
              </button>
            </div>

            <p className="mb-6 text-[20px] font-semibold leading-[1.4] tracking-[-0.2px] text-fg">
              {current.text}
            </p>

            <QuestionInput
              question={current}
              answer={answers[current.id]}
              onChange={(a) => setAnswer(current, a)}
            />

            {/* Footer */}
            <div className="mt-7 flex items-center justify-between border-t border-line pt-5">
              <Button
                variant="outline"
                icon={<ArrowLeft size={16} />}
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex((i) => i - 1)}
              >
                Əvvəlki
              </Button>

              {savedAt && (
                <span className="hidden items-center gap-1.5 text-[12.5px] text-success-fg sm:flex">
                  <Check size={14} /> Avtomatik yadda saxlanıldı
                </span>
              )}

              {currentIndex < questions.length - 1 ? (
                <Button iconRight={<ArrowRight size={16} />} onClick={() => setCurrentIndex((i) => i + 1)}>
                  Növbəti
                </Button>
              ) : (
                <Button variant="success" onClick={() => setConfirmOpen(true)}>
                  İmtahanı bitir
                </Button>
              )}
            </div>
          </div>

          {/* Navigator */}
          <aside className="card h-fit w-full flex-none p-5 lg:w-[268px]">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[13px] font-semibold text-fg">Suallar</span>
              <span className="num text-[13px] text-fg-muted">{answeredCount}/{questions.length}</span>
            </div>
            <div className="grid grid-cols-6 gap-2">
              {questions.map((q, i) => {
                const ans = isAnswered(q.type, answers[q.id]);
                const isFlag = flagged.has(q.id);
                const isCur = i === currentIndex;
                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(i)}
                    className={cn(
                      "num flex aspect-square items-center justify-center rounded-[8px] text-[13px] font-semibold transition-colors",
                      isCur
                        ? "border-2 border-blue-600 bg-surface text-blue-600"
                        : isFlag
                          ? "border-[1.5px] border-[#FCD34D] bg-warning-bg text-warning-fg"
                          : ans
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-400 hover:bg-slate-200 dark:bg-surface-2",
                    )}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex flex-col gap-1.5 text-[11.5px] text-fg-muted">
              <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-[4px] bg-blue-600" /> Cavablanıb</span>
              <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-[4px] border-[1.5px] border-[#FCD34D] bg-warning-bg" /> İşarələnib</span>
              <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-[4px] bg-slate-100 dark:bg-surface-2" /> Boş</span>
            </div>

            <Button variant="success" className="mt-5 w-full" onClick={() => setConfirmOpen(true)}>
              İmtahanı bitir
            </Button>
          </aside>
        </div>
      </div>

      {/* Confirm */}
      <Modal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        icon={<Check size={20} />}
        iconTone="green"
        title="İmtahanı bitirmək istəyirsiniz?"
        footer={
          <>
            <Button variant="secondary" className="flex-1" onClick={() => setConfirmOpen(false)}>
              Ləğv et
            </Button>
            <Button variant="success" className="flex-1" loading={submitting} onClick={doSubmit}>
              Bəli, bitir
            </Button>
          </>
        }
      >
        {answeredCount < questions.length ? (
          <>
            <span className="num font-semibold text-warning-fg">{questions.length - answeredCount}</span> sual cavabsızdır.
            Bitirdikdən sonra cavabları dəyişə bilməyəcəksiniz.
          </>
        ) : (
          <>Bütün suallar cavablanıb. Bitirdikdən sonra cavabları dəyişə bilməyəcəksiniz.</>
        )}
      </Modal>
    </div>
  );
}
