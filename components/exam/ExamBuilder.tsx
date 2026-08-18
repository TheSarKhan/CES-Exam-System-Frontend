"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Library, Plus, ListChecks, RotateCcw, Settings, X, Check,
} from "lucide-react";
import type { Question } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { FieldGroup, Input, Select, Textarea } from "@/components/ui/Field";
import { Button, buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Feedback";
import { BankPickerModal } from "@/components/exam/BankPickerModal";
import { QuestionCard, QuestionPreview, defaultOptionsFor } from "@/components/exam/QuestionCard";
import { questionTypeLabel } from "@/components/exam/QuestionInput";
import { cn } from "@/lib/cn";

const CHOICE_TYPES = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE"];

interface Draft {
  key: string;
  fromBank: boolean;
  questionId?: number;
  type: string;
  text: string;
  imageUrl?: string | null;
  score: number;
  options: { text: string; isCorrect: boolean; imageUrl?: string | null }[];
}

export interface ExamBuilderInitial {
  title?: string;
  description?: string;
  examType?: string;
  passMark?: number;
  duration?: number;
  questions?: {
    questionId?: number;
    fromBank: boolean;
    type: string;
    text: string;
    imageUrl?: string | null;
    score: number;
    options: { text: string; isCorrect: boolean; imageUrl?: string | null }[];
  }[];
}

interface ExamBuilderProps {
  initial?: ExamBuilderInitial;
  submitLabel: string;
  onSubmit: (body: Record<string, unknown>) => Promise<void>;
  /** When set, the draft auto-saves to localStorage under this key (create mode). Also switches the builder into the 3-step wizard. */
  draftKey?: string;
}

const MAX_TOTAL_SCORE = 100;

type WizardStep = 1 | 2 | 3;
const WIZARD_STEPS: { n: WizardStep; label: string }[] = [
  { n: 1, label: "Ümumi məlumat" },
  { n: 2, label: "Suallar" },
  { n: 3, label: "Önizləmə" },
];

function Stepper({ step, maxStep, onJump }: { step: WizardStep; maxStep: WizardStep; onJump: (s: WizardStep) => void }) {
  return (
    <div className="mb-6 flex items-center">
      {WIZARD_STEPS.map((s, i) => (
        <React.Fragment key={s.n}>
          <button
            type="button"
            onClick={() => s.n <= maxStep && onJump(s.n)}
            disabled={s.n > maxStep}
            className="flex items-center gap-2.5 disabled:cursor-not-allowed"
          >
            <span
              className={cn(
                "num flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold transition-colors",
                step === s.n
                  ? "bg-blue-600 text-white"
                  : s.n < step
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-600/15 dark:text-blue-400"
                    : "bg-surface-2 text-fg-faint",
              )}
            >
              {s.n < step ? <Check size={15} /> : s.n}
            </span>
            <span className={cn("hidden text-[13.5px] font-medium sm:inline", step === s.n ? "text-fg" : "text-fg-muted")}>{s.label}</span>
          </button>
          {i < WIZARD_STEPS.length - 1 && (
            <div className={cn("mx-3 h-px flex-1", s.n < step ? "bg-blue-300 dark:bg-blue-600/40" : "bg-line")} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

export function ExamBuilder({ initial, submitLabel, onSubmit, draftKey }: ExamBuilderProps) {
  const router = useRouter();
  const isWizard = !!draftKey;
  const keyRef = useRef(0);
  const nextKey = () => `q${keyRef.current++}`;

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [examType, setExamType] = useState(initial?.examType ?? "EXAM");
  const [passMark, setPassMark] = useState(initial?.passMark ?? 70);
  const [duration, setDuration] = useState(initial?.duration ?? 60);
  const [drafts, setDrafts] = useState<Draft[]>(() => {
    if (initial?.questions && initial.questions.length > 0) {
      return initial.questions.map((q) => ({
        key: `q${keyRef.current++}`,
        fromBank: q.fromBank,
        questionId: q.questionId,
        type: q.type,
        text: q.text,
        imageUrl: q.imageUrl ?? null,
        score: q.score,
        options: q.options,
      }));
    }
    // Fresh exam: start with one blank question instead of an empty list.
    return [{
      key: `q${keyRef.current++}`, fromBank: false, type: "SINGLE_CHOICE", text: "", imageUrl: null, score: 1,
      options: defaultOptionsFor("SINGLE_CHOICE"),
    }];
  });

  const [metaOpen, setMetaOpen] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [step, setStep] = useState<WizardStep>(1);
  const [maxStep, setMaxStep] = useState<WizardStep>(1);

  const [hydrated, setHydrated] = useState(false);
  const [restored, setRestored] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ---- draft autosave (create mode only) ----
  useEffect(() => {
    if (!draftKey) { setHydrated(true); return; }
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const d = JSON.parse(raw);
        setTitle(d.title ?? "");
        setDescription(d.description ?? "");
        setExamType(d.examType ?? "EXAM");
        setPassMark(d.passMark ?? 70);
        setDuration(d.duration ?? 60);
        const ds: Draft[] = Array.isArray(d.drafts) ? d.drafts : [];
        setDrafts(ds);
        keyRef.current = ds.reduce((m, x) => {
          const n = parseInt(String(x.key).replace(/\D/g, ""), 10);
          return isNaN(n) ? m : Math.max(m, n + 1);
        }, 0);
        if (ds.length > 0 || d.title) setRestored(true);
      }
    } catch { /* ignore corrupt draft */ }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!hydrated || !draftKey) return;
    try {
      localStorage.setItem(draftKey, JSON.stringify({ title, description, examType, passMark, duration, drafts }));
    } catch { /* quota / unavailable */ }
  }, [hydrated, draftKey, title, description, examType, passMark, duration, drafts]);

  const clearDraft = () => {
    if (draftKey) localStorage.removeItem(draftKey);
    setTitle(""); setDescription(""); setExamType("EXAM"); setPassMark(70); setDuration(60);
    setDrafts([{
      key: nextKey(), fromBank: false, type: "SINGLE_CHOICE", text: "", imageUrl: null, score: 1,
      options: defaultOptionsFor("SINGLE_CHOICE"),
    }]);
    setRestored(false); setStep(1); setMaxStep(1);
  };

  // ---- summary ----
  const totalScore = useMemo(() => drafts.reduce((s, d) => s + (d.score || 0), 0), [drafts]);
  const byType = useMemo(() => {
    const m = new Map<string, number>();
    drafts.forEach((d) => m.set(d.type, (m.get(d.type) ?? 0) + 1));
    return [...m.entries()];
  }, [drafts]);

  const bankIds = useMemo(() => drafts.filter((d) => d.fromBank && d.questionId).map((d) => d.questionId!), [drafts]);

  // ---- mutations ----
  const addFromBank = (questions: Question[]) => {
    setDrafts((prev) => {
      const existing = new Set(prev.filter((d) => d.fromBank).map((d) => d.questionId));
      const additions = questions
        .filter((q) => !existing.has(q.id))
        .map<Draft>((q) => ({
          key: nextKey(),
          fromBank: true,
          questionId: q.id,
          type: q.type,
          text: q.text,
          imageUrl: q.imageUrl ?? null,
          score: q.score,
          options: (q.options ?? []).map((o) => ({ text: o.text, isCorrect: o.isCorrect, imageUrl: o.imageUrl ?? null })),
        }));
      return [...prev, ...additions];
    });
  };

  // Editing an inline question drops its questionId so it is re-created (keeps any
  // already-taken sessions' snapshot intact).
  const updateDraft = (key: string, patch: Partial<Draft>) =>
    setDrafts((prev) => prev.map((d) => (d.key === key ? { ...d, ...patch, fromBank: false, questionId: undefined } : d)));

  const addNewInline = () =>
    setDrafts((prev) => [...prev, {
      key: nextKey(), fromBank: false, type: "SINGLE_CHOICE", text: "", imageUrl: null, score: 1,
      options: defaultOptionsFor("SINGLE_CHOICE"),
    }]);

  const remove = (key: string) => setDrafts((prev) => prev.filter((d) => d.key !== key));

  const duplicate = (key: string) =>
    setDrafts((prev) => {
      const i = prev.findIndex((d) => d.key === key);
      if (i < 0) return prev;
      const copy: Draft = { ...prev[i], key: nextKey(), fromBank: false, questionId: undefined };
      const next = [...prev];
      next.splice(i + 1, 0, copy);
      return next;
    });

  const onDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === i) return;
    setDrafts((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(i, 0, moved);
      return next;
    });
    setDragIndex(i);
  };

  /** Mirrors the old per-question modal's validation, checked before advancing / at submit time. */
  const draftError = (d: Draft): string | null => {
    if (d.fromBank) return null;
    if (!d.text.trim()) return "sual mətni boş ola bilməz";
    if (CHOICE_TYPES.includes(d.type) && d.type !== "TRUE_FALSE") {
      if (d.options.filter((o) => o.text.trim()).length < 2) return "ən azı 2 variant daxil edin";
      if (!d.options.some((o) => o.isCorrect)) return "düzgün variantı işarələyin";
    }
    if (d.type === "IMAGE_QUESTION" && !d.imageUrl) return "sual üçün şəkil yükləyin";
    if (d.type === "IMAGE_CHOICE") {
      if (d.options.filter((o) => o.imageUrl).length < 2) return "ən azı 2 variant şəkli yükləyin";
      if (!d.options.some((o) => o.isCorrect)) return "düzgün variantı işarələyin";
    }
    return null;
  };

  const questionsError = (): string | null => {
    if (drafts.length === 0) return "Ən azı bir sual əlavə edin";
    for (let i = 0; i < drafts.length; i++) {
      const err = draftError(drafts[i]);
      if (err) return `Sual ${i + 1}: ${err}`;
    }
    if (examType === "EXAM" && totalScore > MAX_TOTAL_SCORE) {
      return `Ümumi bal ${totalScore} xaldır — maksimum ${MAX_TOTAL_SCORE} bal ola bilər. Sualların ballarını azaldın.`;
    }
    return null;
  };

  const goNext = () => {
    if (step === 1) {
      if (!title.trim()) return setError("İmtahanın adını daxil edin");
      setError("");
      setStep(2);
      setMaxStep((m) => (m < 2 ? 2 : m));
    } else if (step === 2) {
      const err = questionsError();
      if (err) return setError(err);
      setError("");
      setStep(3);
      setMaxStep((m) => (m < 3 ? 3 : m));
    }
  };

  const goBack = () => { setError(""); setStep((s) => (s > 1 ? ((s - 1) as WizardStep) : s)); };

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!title.trim()) {
      setError("İmtahanın adını daxil edin");
      if (!isWizard) setMetaOpen(true); else setStep(1);
      return;
    }
    const err = questionsError();
    if (err) {
      setError(err);
      if (isWizard) setStep(2);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await onSubmit({
        title,
        description: description || null,
        type: examType,
        passMark: examType === "EXAM" ? passMark : null,
        durationMinutes: duration,
        questions: drafts.map((d) => {
          if (d.questionId != null) return { questionId: d.questionId };
          const finalOptions = d.type === "IMAGE_CHOICE"
            ? d.options.filter((o) => o.imageUrl)
            : d.options.filter((o) => o.text.trim());
          return {
            type: d.type,
            text: d.text.trim(),
            imageUrl: d.imageUrl ?? null,
            score: d.score,
            options: finalOptions.length
              ? finalOptions.map((o, i) => ({ text: o.text.trim() || `Variant ${i + 1}`, isCorrect: o.isCorrect, imageUrl: o.imageUrl ?? null, sortOrder: i }))
              : undefined,
          };
        }),
      });
      if (draftKey) localStorage.removeItem(draftKey);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yadda saxlanmadı");
      setSubmitting(false);
    }
  };

  // ---- shared fragments (used by both the wizard and the single-page edit layout) ----
  const metaFieldsJsx = (
    <div className="flex flex-col gap-5">
      <FieldGroup label="İmtahanın adı"><Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="məs. Q1 Bilik Yoxlaması" /></FieldGroup>
      <FieldGroup label="Təsvir"><Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="İmtahan haqqında qısa məlumat…" /></FieldGroup>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <FieldGroup label="Növ">
          <Select value={examType} onChange={(e) => setExamType(e.target.value)}>
            <option value="EXAM">İmtahan (ballı)</option>
            <option value="SURVEY">Sorğu (balsız)</option>
          </Select>
        </FieldGroup>
        {examType === "EXAM" && (
          <FieldGroup label="Keçid balı (%)"><Input type="number" value={passMark} onChange={(e) => setPassMark(Number(e.target.value))} min={0} max={100} /></FieldGroup>
        )}
        <FieldGroup label="Müddət (dəqiqə)"><Input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} min={1} /></FieldGroup>
      </div>
    </div>
  );

  const questionsListJsx = drafts.length === 0 ? (
    <Card className="p-6">
      <EmptyState icon={<ListChecks size={22} />} title="Hələ sual yoxdur" description="Aşağıdakı düymələrlə bankdan seçin və ya yeni sual yazın." />
    </Card>
  ) : (
    <div className="flex flex-col gap-4">
      {drafts.map((d, i) => (
        <QuestionCard
          key={d.key}
          index={i}
          fromBank={d.fromBank}
          showScore={examType === "EXAM"}
          value={{ type: d.type, text: d.text, imageUrl: d.imageUrl, score: d.score, options: d.options }}
          onChange={(patch) => updateDraft(d.key, patch)}
          onRemove={() => remove(d.key)}
          onDuplicate={() => duplicate(d.key)}
          draggable
          onDragStart={() => setDragIndex(i)}
          onDragOver={(e) => onDragOver(e, i)}
          onDragEnd={() => setDragIndex(null)}
          onDrop={() => setDragIndex(null)}
          dragging={dragIndex === i}
        />
      ))}
    </div>
  );

  const actionBarJsx = (
    <div className="flex flex-wrap gap-2.5">
      <Button type="button" variant="outline" size="sm" icon={<Plus size={15} />} onClick={addNewInline}>Sual əlavə et</Button>
      <Button type="button" variant="outline" size="sm" icon={<Library size={15} />} onClick={() => setBankOpen(true)}>Bazadan əlavə et</Button>
    </div>
  );

  const summaryCardJsx = (
    <Card className="p-5">
      <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-wider text-fg-faint">Xülasə</h3>

      <div className="mb-4 flex items-end justify-between">
        <div>
          <div className="num text-[30px] font-bold leading-none text-blue-600">{drafts.length}</div>
          <div className="text-[11.5px] text-fg-muted">ümumi sual</div>
        </div>
        {examType === "EXAM" && (
          <div className="text-right">
            <div className={cn("num text-[22px] font-bold leading-none", totalScore > MAX_TOTAL_SCORE ? "text-danger-fg" : "text-fg")}>
              {totalScore}{totalScore > MAX_TOTAL_SCORE && <span className="ml-1 text-[13px]">/ {MAX_TOTAL_SCORE}</span>}
            </div>
            <div className="text-[11.5px] text-fg-muted">ümumi bal</div>
          </div>
        )}
      </div>

      {drafts.length > 0 && (
        <>
          <div className="mb-3 flex flex-col gap-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-fg-faint">Tip üzrə</p>
            {byType.map(([type, n]) => (
              <div key={type} className="flex items-center justify-between text-[12.5px]">
                <span className="text-fg-muted">{questionTypeLabel(type)}</span>
                <span className="num font-semibold text-fg">{n}</span>
              </div>
            ))}
          </div>

          <div className="mb-4 flex items-center justify-between rounded-[9px] bg-surface-2 px-3 py-2 text-[12.5px]">
            <span className="text-fg-muted">Müddət</span>
            <span className="num font-semibold text-fg">{duration} dəq</span>
          </div>
        </>
      )}

      <Button type="submit" loading={submitting} className="w-full">{submitLabel}</Button>
      <button
        type="button"
        onClick={() => { clearDraft(); router.push("/exams"); }}
        className={buttonClasses("ghost", "md", "mt-2 w-full")}
      >
        Ləğv et
      </button>
    </Card>
  );

  return (
    <>
      {restored && (
        <div className="mb-4 flex items-center justify-between gap-3 rounded-[11px] border border-blue-200 bg-blue-50/60 px-4 py-2.5 text-[13px] text-blue-800 dark:bg-blue-600/10 dark:text-blue-200">
          <span className="flex items-center gap-2"><RotateCcw size={15} /> Yarımçıq qalmış layihə bərpa edildi.</span>
          <button type="button" onClick={clearDraft} className="font-medium text-blue-700 hover:underline dark:text-blue-300">Təmizlə</button>
        </div>
      )}

      {error && <div className="mb-4 rounded-[11px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-danger-fg">{error}</div>}

      {isWizard ? (
        <>
          <Stepper step={step} maxStep={maxStep} onJump={(s) => setStep(s)} />

          {step === 1 && (
            <Card className="p-6">
              <h3 className="mb-5 text-[15px] font-semibold text-fg">Ümumi məlumat</h3>
              {metaFieldsJsx}
            </Card>
          )}

          {step === 2 && (
            <div className="flex min-w-0 flex-col gap-4">
              {questionsListJsx}
              {actionBarJsx}
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-5">
              <Card className="p-6">
                <h3 className="mb-4 text-[15px] font-semibold text-fg">İmtahan məlumatları</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-x-8">
                  <div>
                    <p className="text-[12px] font-medium uppercase tracking-wider text-fg-faint">Ad</p>
                    <p className="mt-0.5 text-[14px] font-medium text-fg">{title || "—"}</p>
                  </div>
                  <div>
                    <p className="text-[12px] font-medium uppercase tracking-wider text-fg-faint">Növ</p>
                    <p className="mt-0.5 text-[14px] text-fg">{examType === "EXAM" ? "İmtahan (ballı)" : "Sorğu (balsız)"}</p>
                  </div>
                  {examType === "EXAM" && (
                    <div>
                      <p className="text-[12px] font-medium uppercase tracking-wider text-fg-faint">Keçid balı</p>
                      <p className="num mt-0.5 text-[14px] text-fg">{passMark}%</p>
                    </div>
                  )}
                  <div>
                    <p className="text-[12px] font-medium uppercase tracking-wider text-fg-faint">Müddət</p>
                    <p className="num mt-0.5 text-[14px] text-fg">{duration} dəqiqə</p>
                  </div>
                  {description && (
                    <div className="sm:col-span-2">
                      <p className="text-[12px] font-medium uppercase tracking-wider text-fg-faint">Təsvir</p>
                      <p className="mt-0.5 text-[13.5px] text-fg-muted">{description}</p>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-[15px] font-semibold text-fg">Suallar</h3>
                  <span className="num text-[13px] text-fg-muted">
                    {drafts.length} sual{examType === "EXAM" && <> · {totalScore} bal</>}
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {drafts.map((d, i) => (
                    <QuestionPreview key={d.key} index={i} type={d.type} text={d.text} score={d.score} showScore={examType === "EXAM"} options={d.options} />
                  ))}
                </div>
              </Card>
            </div>
          )}

          <div className="mt-5 flex items-center justify-between">
            <Button type="button" variant="secondary" onClick={goBack} disabled={step === 1}>Geri</Button>
            {step < 3 ? (
              <Button type="button" onClick={goNext}>Növbəti</Button>
            ) : (
              <Button type="button" onClick={() => submit()} loading={submitting}>{submitLabel}</Button>
            )}
          </div>
        </>
      ) : (
        <form onSubmit={submit} className="grid items-start gap-5 lg:grid-cols-[1fr_320px]">
          {/* ---------- left: form ---------- */}
          <div className="flex min-w-0 flex-col gap-5">
            <Card className="flex items-center justify-between gap-3 p-5">
              <div className="min-w-0">
                <div className="flex items-center gap-2.5">
                  <span
                    className="inline-flex shrink-0 rounded-[7px] px-2.5 py-1 text-[11.5px] font-semibold"
                    style={examType === "EXAM" ? { background: "#F7EFD8", color: "#75590F" } : { background: "#F3E8FF", color: "#7E22CE" }}
                  >
                    {examType === "EXAM" ? "İmtahan" : "Sorğu"}
                  </span>
                  <h3 className={cn("truncate text-[16px] font-semibold", title ? "text-fg" : "text-fg-faint")}>
                    {title || "Adsız imtahan"}
                  </h3>
                </div>
                <p className="num mt-1 text-[12.5px] text-fg-muted">
                  {examType === "EXAM" && <>Keçid {passMark}% · </>}Müddət {duration} dəq
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" icon={<Settings size={15} />} onClick={() => setMetaOpen(true)}>
                Tənzimləmələr
              </Button>
            </Card>

            {questionsListJsx}
            {actionBarJsx}
          </div>

          {/* ---------- right: sticky summary ---------- */}
          <aside className="lg:sticky lg:top-4">{summaryCardJsx}</aside>
        </form>
      )}

      {/* general info popup (single-page / edit mode only) */}
      {!isWizard && metaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]" onClick={() => setMetaOpen(false)}>
          <div className="w-full max-w-[560px] rounded-[16px] bg-surface p-6 shadow-[0_12px_32px_rgba(15,23,42,0.18)]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[16px] font-semibold text-fg">Ümumi məlumat</h3>
              <button type="button" onClick={() => setMetaOpen(false)} className="rounded-md p-1 text-fg-muted hover:text-fg"><X size={18} /></button>
            </div>
            {metaFieldsJsx}
            <div className="mt-6 flex justify-end">
              <Button type="button" onClick={() => setMetaOpen(false)}>Hazır</Button>
            </div>
          </div>
        </div>
      )}

      <BankPickerModal open={bankOpen} onClose={() => setBankOpen(false)} onAdd={addFromBank} excludeIds={bankIds} />
    </>
  );
}
