"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Clock,
  Flag,
  ArrowLeft,
  ArrowRight,
  Check,
  ShieldAlert,
  Maximize,
  AlertTriangle,
  ListChecks,
  X,
  Loader2,
} from "lucide-react";
import type { SessionStart, SessionQuestion } from "@/lib/types";
import { useTheme } from "@/lib/theme";
import {
  QuestionInput,
  isAnswered,
  toSubmitPayload,
  questionTypeLabel,
  type AnswerValue,
} from "./QuestionInput";
import { useAntiCheat, type ACViolation } from "./useAntiCheat";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type AnswerState = Record<number, AnswerValue>;

export interface SubmitPayload {
  answers: { questionId: number; selectedOptionId: number | null; textAnswer: string | null }[];
  violations?: { type: string; label: string; severity: string; at: number }[];
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
  const { theme } = useTheme();
  const markSrc = theme === "dark" ? "/logo-mark.png" : "/logo-mark-light.png";

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [flagged, setFlagged] = useState<Set<number>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [restored, setRestored] = useState(false);
  const [timeNotice, setTimeNotice] = useState<string | null>(null);
  const [timeUp, setTimeUp] = useState(false);
  const submittedRef = useRef(false);
  const warned5Ref = useRef(false);
  const warned1Ref = useRef(false);
  const firstPersistRef = useRef(true);
  const violationsRef = useRef<ACViolation[]>([]);

  /* ---- restore autosave ---- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        let any = false;
        if (parsed.answers && Object.keys(parsed.answers).length) {
          setAnswers(parsed.answers);
          any = true;
        }
        if (parsed.flagged) setFlagged(new Set(parsed.flagged));
        if (any) setRestored(true);
      }
    } catch {
      /* ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  /* ---- persist autosave (skip the mount run so we never overwrite restored data with {}) ---- */
  useEffect(() => {
    if (firstPersistRef.current) {
      firstPersistRef.current = false;
      return;
    }
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
    setSubmitError(null);
    try {
      await onSubmit({
        answers: questions.map((q) => toSubmitPayload(q, answers[q.id])),
        violations: violationsRef.current.map((v) => ({
          type: v.type,
          label: v.label,
          severity: v.severity,
          at: v.at,
        })),
      });
      localStorage.removeItem(storageKey);
    } catch (e) {
      submittedRef.current = false;
      setSubmitting(false);
      setTimeUp(false);
      setSubmitError(e instanceof Error ? e.message : "Göndərmə alınmadı. Yenidən cəhd edin.");
    }
  }, [answers, questions, onSubmit, storageKey]);

  const anti = useAntiCheat({
    enabled: true,
    limit: antiCheatLimit,
    onTerminate: (vios) => {
      // Use the list passed in (includes the terminating strike) — the synced ref may lag a tick.
      violationsRef.current = vios;
      void doSubmit();
    },
  });

  /* keep the latest violations in a ref so doSubmit always sends the freshest list */
  useEffect(() => {
    violationsRef.current = anti.violations;
  }, [anti.violations]);

  /* ---- timer ---- */
  const endMs = useMemo(
    () => (session.durationMinutes ? new Date(session.startTime).getTime() + session.durationMinutes * 60000 : null),
    [session.startTime, session.durationMinutes],
  );
  // Offset (server − client) captured once at mount. Both startTime and serverTime are
  // server wall-clock, so any client timezone/clock skew cancels out → the countdown
  // ends at the true server deadline even if the device clock is wrong.
  const clockOffset = useMemo(() => {
    if (!session.serverTime) return 0;
    const serverMs = new Date(session.serverTime).getTime();
    return Number.isNaN(serverMs) ? 0 : serverMs - Date.now();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session.serverTime]);
  const [remaining, setRemaining] = useState<number | null>(null);
  useEffect(() => {
    if (!endMs) return;
    const tick = () => {
      const left = Math.max(0, endMs - (Date.now() + clockOffset));
      setRemaining(left);
      if (left <= 60000 && left > 0 && !warned1Ref.current) {
        warned1Ref.current = true;
        setTimeNotice("Son 1 dəqiqə! İmtahan tezliklə avtomatik təhvil veriləcək.");
      } else if (left <= 300000 && left > 60000 && !warned5Ref.current) {
        warned5Ref.current = true;
        setTimeNotice("5 dəqiqə qaldı.");
      }
      if (left === 0) {
        setTimeUp(true);
        void doSubmit();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endMs, clockOffset, doSubmit]);

  /* ---- auto-hide the timer notice (but keep the final-minute warning pinned) ---- */
  useEffect(() => {
    if (!timeNotice) return;
    if (remaining != null && remaining <= 60000) return; // final warning stays visible
    const id = setTimeout(() => setTimeNotice(null), 6000);
    return () => clearTimeout(id);
  }, [timeNotice, remaining]);

  /* ---- arrow-key navigation (ignored while typing or reviewing) ---- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (reviewOpen) return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if (e.key === "ArrowLeft") setCurrentIndex((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setCurrentIndex((i) => Math.min(questions.length - 1, i + 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [reviewOpen, questions.length]);

  const answeredCount = questions.filter((q) => isAnswered(q.type, answers[q.id])).length;
  const progress = Math.round((answeredCount / questions.length) * 100);
  const current = questions[currentIndex];
  const blanks = questions.map((q, i) => ({ q, i })).filter(({ q }) => !isAnswered(q.type, answers[q.id]));

  const setAnswer = (q: SessionQuestion, a: AnswerValue) =>
    setAnswers((prev) => ({ ...prev, [q.id]: a }));

  const toggleFlag = (id: number) =>
    setFlagged((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const jumpTo = (i: number) => {
    setCurrentIndex(i);
    setReviewOpen(false);
  };

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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={markSrc} alt="CES" className="h-9 w-9 shrink-0 object-contain" />
          <div className="min-w-0">
            <div className="truncate text-[15px] font-bold tracking-[-0.2px] text-fg">{session.examTitle}</div>
            {takerName && <div className="truncate text-[12px] text-fg-muted">{takerName}</div>}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span
            className={cn(
              "hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-semibold sm:flex",
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
            aria-label="Tam ekran rejimi"
            className="flex h-9 w-9 items-center justify-center rounded-[9px] text-fg-muted hover:bg-slate-100 dark:hover:bg-surface-2"
          >
            <Maximize size={17} />
          </button>

          {endMs && (
            <span
              role="timer"
              aria-label={`Qalan vaxt: ${mins} dəqiqə ${secs} saniyə`}
              className={cn(
                "flex items-center gap-2 rounded-full px-3.5 py-2 text-white",
                lowTime ? "bg-danger animate-[pulse-dot_1.2s_ease_infinite]" : "bg-sidebar",
              )}
            >
              <Clock size={15} className={lowTime ? "text-white" : "text-blue-400"} aria-hidden />
              <span className="num text-[16px] font-semibold tracking-wide">
                {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
              </span>
            </span>
          )}
        </div>
      </header>

      {/* Progress bar */}
      <div
        className="h-[5px] flex-none bg-line"
        role="progressbar"
        aria-label="İmtahan gedişatı"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progress}
      >
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-blue-700 transition-[width] duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Anti-cheat warning */}
      {anti.warning && (
        <div
          role="alert"
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 text-[13px] font-medium text-white",
            anti.warning.severity === "CRITICAL" ? "bg-danger" : "bg-warning",
          )}
        >
          <ShieldAlert size={16} aria-hidden /> {anti.warning.label}
        </div>
      )}

      {/* Restored-answers notice */}
      {restored && (
        <div className="flex items-center gap-2 bg-info-bg px-5 py-2 text-[12.5px] font-medium text-info-fg">
          <Check size={14} /> Əvvəlki cavablarınız bərpa olundu — qaldığınız yerdən davam edə bilərsiniz.
          <button onClick={() => setRestored(false)} className="ml-auto opacity-70 hover:opacity-100"><X size={14} /></button>
        </div>
      )}

      {/* Time threshold notice */}
      {timeNotice && (
        <div
          role="alert"
          aria-live="assertive"
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 text-[13px] font-semibold",
            warned1Ref.current && remaining != null && remaining <= 60000 ? "bg-danger text-white" : "bg-warning-bg text-warning-fg",
          )}
        >
          <AlertTriangle size={15} aria-hidden /> {timeNotice}
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
                aria-pressed={flagged.has(current.id)}
                aria-label="Bu sualı sonra üçün işarələ"
                className={cn(
                  "flex shrink-0 items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-[12.5px] font-medium transition-colors",
                  flagged.has(current.id)
                    ? "bg-warning-bg text-warning-fg"
                    : "text-fg-muted hover:bg-slate-100 dark:hover:bg-surface-2",
                )}
              >
                <Flag size={14} className={flagged.has(current.id) ? "fill-current" : ""} aria-hidden />
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
                <Button variant="success" icon={<ListChecks size={16} />} onClick={() => setReviewOpen(true)}>
                  Yoxla və bitir
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
                    aria-current={isCur ? "true" : undefined}
                    aria-label={`Sual ${i + 1}: ${ans ? "cavablanıb" : "boş"}${isFlag ? ", işarələnib" : ""}`}
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

            <Button variant="success" icon={<ListChecks size={16} />} className="mt-5 w-full" onClick={() => setReviewOpen(true)}>
              Yoxla və bitir
            </Button>
          </aside>
        </div>
      </div>

      {/* Review-before-submit overlay */}
      {reviewOpen && (
        <div className="absolute inset-0 z-[60] flex flex-col bg-app/95 backdrop-blur-sm">
          <div className="flex h-16 flex-none items-center justify-between border-b border-line bg-surface px-5">
            <div className="flex items-center gap-2.5">
              <ListChecks size={20} className="text-blue-600" />
              <h3 className="text-[16px] font-bold tracking-[-0.2px] text-fg">İmtahanı yoxlayın</h3>
            </div>
            <button onClick={() => setReviewOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-[9px] text-fg-muted hover:bg-slate-100 dark:hover:bg-surface-2">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="mx-auto max-w-[680px] p-5 sm:p-7">
              {/* summary chips */}
              <div className="mb-5 grid grid-cols-3 gap-3">
                <ReviewStat tone="green" value={answeredCount} label="Cavablanıb" />
                <ReviewStat tone="slate" value={blanks.length} label="Boş" />
                <ReviewStat tone="amber" value={flagged.size} label="İşarələnib" />
              </div>

              {blanks.length > 0 && (
                <div className="mb-4 rounded-[13px] border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/20 dark:bg-amber-500/10">
                  <p className="mb-2.5 flex items-center gap-1.5 text-[13px] font-semibold text-amber-800 dark:text-amber-300">
                    <AlertTriangle size={15} /> {blanks.length} sual cavabsızdır
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {blanks.map(({ i }) => (
                      <button
                        key={i}
                        onClick={() => jumpTo(i)}
                        className="num flex h-9 w-9 items-center justify-center rounded-[8px] border border-amber-300 bg-surface text-[13px] font-semibold text-amber-700 hover:bg-amber-100 dark:text-amber-300"
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {flagged.size > 0 && (
                <div className="mb-4 rounded-[13px] border border-line bg-surface p-4">
                  <p className="mb-2.5 flex items-center gap-1.5 text-[13px] font-semibold text-fg">
                    <Flag size={15} className="fill-current text-warning-fg" /> İşarələnmiş suallar
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {questions.map((q, i) => flagged.has(q.id) && (
                      <button
                        key={q.id}
                        onClick={() => jumpTo(i)}
                        className="num flex h-9 w-9 items-center justify-center rounded-[8px] border-[1.5px] border-[#FCD34D] bg-warning-bg text-[13px] font-semibold text-warning-fg"
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* all questions */}
              <div className="rounded-[13px] border border-line bg-surface p-4">
                <p className="mb-3 text-[13px] font-semibold text-fg">Bütün suallar</p>
                <div className="grid grid-cols-8 gap-2 sm:grid-cols-10">
                  {questions.map((q, i) => {
                    const ans = isAnswered(q.type, answers[q.id]);
                    const isFlag = flagged.has(q.id);
                    return (
                      <button
                        key={q.id}
                        onClick={() => jumpTo(i)}
                        className={cn(
                          "num flex aspect-square items-center justify-center rounded-[8px] text-[12.5px] font-semibold transition-colors",
                          isFlag
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
              </div>

              <p className="mt-5 text-center text-[12.5px] text-fg-muted">
                Bitirdikdən sonra cavablarınızı dəyişə bilməyəcəksiniz.
              </p>

              {submitError && (
                <div className="mt-4 flex items-center gap-2 rounded-[11px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-danger-fg">
                  <AlertTriangle size={15} className="shrink-0" /> {submitError}
                </div>
              )}
            </div>
          </div>

          <div className="flex-none border-t border-line bg-surface px-5 py-4">
            <div className="mx-auto flex max-w-[680px] gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setReviewOpen(false)}>
                Suallara qayıt
              </Button>
              <Button variant="success" className="flex-1" loading={submitting} onClick={doSubmit}>
                Təsdiqlə və bitir
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Inline submit error when not reviewing (e.g. anti-cheat / timer auto-submit failed) */}
      {submitError && !reviewOpen && !timeUp && (
        <div className="absolute bottom-5 left-1/2 z-[70] flex -translate-x-1/2 items-center gap-2 rounded-[11px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-danger-fg shadow-lg">
          <AlertTriangle size={15} className="shrink-0" /> {submitError}
          <button onClick={() => setReviewOpen(true)} className="ml-1 font-semibold underline">Yenidən cəhd et</button>
        </div>
      )}

      {/* Time's up blocking overlay */}
      {timeUp && (
        <div className="absolute inset-0 z-[80] flex flex-col items-center justify-center gap-4 bg-app/95 backdrop-blur-sm">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-danger/10 text-danger">
            <Clock size={32} />
          </span>
          <h3 className="text-[18px] font-bold text-fg">Vaxt bitdi</h3>
          <p className="flex items-center gap-2 text-[13.5px] text-fg-muted">
            <Loader2 size={15} className="animate-spin" /> Cavablarınız avtomatik göndərilir…
          </p>
        </div>
      )}
    </div>
  );
}

function ReviewStat({ tone, value, label }: { tone: "green" | "amber" | "slate"; value: number; label: string }) {
  const tones = {
    green: "text-success-fg",
    amber: "text-warning-fg",
    slate: "text-fg-muted",
  } as const;
  return (
    <div className="flex flex-col items-center gap-0.5 rounded-[12px] border border-line bg-surface py-4">
      <span className={cn("num text-[26px] font-bold", tones[tone])}>{value}</span>
      <span className="text-[12px] text-fg-muted">{label}</span>
    </div>
  );
}
