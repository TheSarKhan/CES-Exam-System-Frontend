"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Library, PencilLine, Trash2, Pencil, ListChecks, GripVertical,
  ChevronDown, ChevronRight, Copy, Check, Settings, X,
} from "lucide-react";
import type { Question } from "@/lib/types";
import { apiFetch } from "@/lib/api";
import { humanizeError } from "@/lib/errors";
import { Card } from "@/components/ui/Card";
import { FieldGroup, Input, Select, Textarea } from "@/components/ui/Field";
import { Button, buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/Feedback";
import { BankPickerModal } from "@/components/exam/BankPickerModal";
import { ExamQuestionModal, type DraftValue } from "@/components/exam/ExamQuestionModal";
import { questionTypeLabel } from "@/components/exam/QuestionInput";
import { cn } from "@/lib/cn";
import { hasMeaningfulText, MEANINGFUL_TEXT_MSG } from "@/lib/validate";

const CHOICE_TYPES = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE"];
const TITLE_REQUIRED_MSG = "İmtahanın adını daxil edin";
const TITLE_INVALID_MSG = `İmtahanın adı: ${MEANINGFUL_TEXT_MSG}`;
const DESC_INVALID_MSG = `Təsvir: ${MEANINGFUL_TEXT_MSG}`;
const NO_QUESTIONS_MSG = "Ən azı bir sual əlavə edin";

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
  mode: "create" | "edit";
  /** Present in edit mode: the exam being edited. */
  examId?: number;
  /** The exam's current status in edit mode ("DRAFT" resumes a draft, "PUBLISHED" edits a live exam). */
  initialStatus?: "DRAFT" | "PUBLISHED";
}

const MAX_TOTAL_SCORE = 100;
const AUTOSAVE_DEBOUNCE_MS = 800;

export function ExamBuilder({ initial, submitLabel, mode, examId, initialStatus }: ExamBuilderProps) {
  const router = useRouter();
  const keyRef = useRef(0);
  const nextKey = () => `q${keyRef.current++}`;

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [examType, setExamType] = useState(initial?.examType ?? "EXAM");
  const [passMark, setPassMark] = useState(initial?.passMark ?? 70);
  const [duration, setDuration] = useState(initial?.duration ?? 60);
  const [drafts, setDrafts] = useState<Draft[]>(() =>
    (initial?.questions ?? []).map((q) => ({
      key: `q${keyRef.current++}`,
      fromBank: q.fromBank,
      questionId: q.questionId,
      type: q.type,
      text: q.text,
      imageUrl: q.imageUrl ?? null,
      score: q.score,
      options: q.options,
    })),
  );

  const [metaOpen, setMetaOpen] = useState(false);
  const [bankOpen, setBankOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ---- backend draft persistence ----
  // A create session (or a resumed DRAFT) auto-saves to the backend as a DRAFT
  // exam while the admin works, so leaving the page keeps an editable "draft card"
  // in the exam list. Publishing (submit) flips the same record to PUBLISHED.
  const autoDraft = mode === "create" || initialStatus === "DRAFT";
  const savedIdRef = useRef<number | null>(examId ?? null);
  // Serializes writes so a POST and a following PUT never race into two records.
  const savingRef = useRef<Promise<unknown>>(Promise.resolve());
  // Set once the user publishes/cancels, to stop further background autosaves.
  const stoppedRef = useRef(false);
  // Skip the autosave that would otherwise fire on the initial mount.
  const firstAutosaveRef = useRef(true);

  const buildBody = (status: "DRAFT" | "PUBLISHED") => ({
    title,
    description: description.trim() || null,
    type: examType,
    status,
    passMark: examType === "EXAM" ? passMark : null,
    durationMinutes: duration,
    questions: drafts.map((d) =>
      d.questionId != null
        ? { questionId: d.questionId }
        : {
            type: d.type,
            text: d.text,
            imageUrl: d.imageUrl ?? null,
            score: d.score,
            options: d.options.length
              ? d.options.map((o, i) => ({ text: o.text, isCorrect: o.isCorrect, imageUrl: o.imageUrl ?? null, sortOrder: i }))
              : undefined,
          },
    ),
  });

  const persist = async (status: "DRAFT" | "PUBLISHED") => {
    const body = buildBody(status);
    const run = async () => {
      if (savedIdRef.current == null) {
        const res = await apiFetch<{ id: number }>("/api/v1/exams", { method: "POST", body: JSON.stringify(body) });
        savedIdRef.current = res.id;
      } else {
        await apiFetch(`/api/v1/exams/${savedIdRef.current}`, { method: "PUT", body: JSON.stringify(body) });
      }
    };
    const next = savingRef.current.then(run, run);
    savingRef.current = next.catch(() => {});
    return next;
  };

  // Debounced background autosave. Skips empty content so we never create a blank draft.
  useEffect(() => {
    if (!autoDraft) return;
    if (firstAutosaveRef.current) { firstAutosaveRef.current = false; return; }
    if (stoppedRef.current) return;
    if (!(title.trim() || drafts.length > 0)) return;
    const t = setTimeout(() => { if (!stoppedRef.current) void persist("DRAFT"); }, AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDraft, title, description, examType, passMark, duration, drafts]);

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
  const saveInline = (value: DraftValue) => {
    setDrafts((prev) => {
      if (editingKey) return prev.map((d) => (d.key === editingKey ? { ...d, ...value, fromBank: false, questionId: undefined } : d));
      return [...prev, { key: nextKey(), fromBank: false, ...value }];
    });
    setEditorOpen(false);
    setEditingKey(null);
  };

  const openNewInline = () => { setEditingKey(null); setEditorOpen(true); };
  const openEditInline = (key: string) => { setEditingKey(key); setEditorOpen(true); };
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

  const toggleExpand = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
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

  const editingDraft = editingKey ? drafts.find((d) => d.key === editingKey) : undefined;

  // Flagged only once something has been typed, so an untouched field never
  // shows an error. Empty title is still caught on submit.
  const titleInvalid = !!title.trim() && !hasMeaningfulText(title);
  const descInvalid = !!description.trim() && !hasMeaningfulText(description);

  // Each validation banner clears itself the moment its own condition is fixed, instead of
  // lingering on screen (stale) until the next submit attempt re-evaluates it.
  useEffect(() => {
    if (error === TITLE_REQUIRED_MSG && title.trim()) setError("");
    if (error === TITLE_INVALID_MSG && hasMeaningfulText(title)) setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [title]);
  useEffect(() => {
    if (error === DESC_INVALID_MSG && (!description.trim() || hasMeaningfulText(description))) setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [description]);
  useEffect(() => {
    if (error === NO_QUESTIONS_MSG && drafts.length > 0) setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [drafts.length]);
  useEffect(() => {
    if (error.startsWith("Ümumi bal") && (examType !== "EXAM" || totalScore <= MAX_TOTAL_SCORE)) setError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalScore, examType]);

  // Publish: flip the (possibly already auto-saved) draft to a live PUBLISHED exam.
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError(TITLE_REQUIRED_MSG); setMetaOpen(true); return; }
    if (!hasMeaningfulText(title)) { setError(TITLE_INVALID_MSG); setMetaOpen(true); return; }
    // Description is optional, but when filled it must not be symbols alone.
    if (description.trim() && !hasMeaningfulText(description)) { setError(DESC_INVALID_MSG); setMetaOpen(true); return; }
    if (drafts.length === 0) return setError(NO_QUESTIONS_MSG);
    if (examType === "EXAM" && totalScore > MAX_TOTAL_SCORE) {
      return setError(`Ümumi bal ${totalScore} xaldır — maksimum ${MAX_TOTAL_SCORE} bal ola bilər. Sualların ballarını azaldın.`);
    }
    setSubmitting(true);
    setError("");
    stoppedRef.current = true;
    try {
      await savingRef.current;        // let any in-flight autosave settle so we reuse its id
      await persist("PUBLISHED");
      router.push("/exams");
    } catch (e) {
      setError(humanizeError(e, "Yadda saxlanmadı"));
      setSubmitting(false);
      stoppedRef.current = false;     // re-enable autosave so the user can fix and retry
    }
  };

  // Cancel: a create session discards its auto-saved draft; editing just leaves.
  const cancel = async () => {
    stoppedRef.current = true;
    try { await savingRef.current; } catch { /* ignore */ }
    if (mode === "create" && savedIdRef.current != null) {
      try { await apiFetch(`/api/v1/exams/${savedIdRef.current}`, { method: "DELETE" }); } catch { /* best-effort */ }
    }
    router.push("/exams");
  };

  return (
    <>
      {error && <div className="mb-4 rounded-[11px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-danger-fg">{error}</div>}

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

          <Card className="p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-[15px] font-semibold text-fg">Suallar</h3>
              <div className="flex flex-wrap gap-2.5">
                <Button type="button" variant="outline" size="sm" icon={<Library size={15} />} onClick={() => setBankOpen(true)}>Bankdan seç</Button>
                <Button type="button" variant="outline" size="sm" icon={<PencilLine size={15} />} onClick={openNewInline}>Yeni sual yaz</Button>
              </div>
            </div>

            {drafts.length === 0 ? (
              <EmptyState icon={<ListChecks size={22} />} title="Hələ sual yoxdur" description="Yuxarıdakı düymələrlə bankdan seçin və ya yeni sual yazın." />
            ) : (
              <div className="flex flex-col gap-2.5">
                {drafts.map((d, i) => {
                  const isOpen = expanded.has(d.key);
                  const isChoice = CHOICE_TYPES.includes(d.type);
                  return (
                    <div
                      key={d.key}
                      draggable
                      onDragStart={() => setDragIndex(i)}
                      onDragOver={(e) => onDragOver(e, i)}
                      onDragEnd={() => setDragIndex(null)}
                      onDrop={() => setDragIndex(null)}
                      className={cn(
                        "rounded-[11px] border border-line bg-surface transition-shadow",
                        dragIndex === i && "opacity-60 shadow-md",
                      )}
                    >
                      <div className="flex items-start gap-2.5 p-3.5">
                        <span className="mt-0.5 flex cursor-grab items-center text-fg-faint active:cursor-grabbing" title="Sürüşdürərək sırala">
                          <GripVertical size={16} />
                        </span>
                        <span className="num mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[12px] font-semibold text-fg-muted">{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-1.5">
                            <span className="rounded-[6px] bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-600/10">{questionTypeLabel(d.type)}</span>
                            {examType === "EXAM" && <span className="num rounded-[6px] bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-surface-2">{d.score} bal</span>}
                            <span className={cn("rounded-[6px] px-1.5 py-0.5 text-[11px] font-medium", d.fromBank ? "bg-purple-50 text-purple-700 dark:bg-purple-500/10" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10")}>
                              {d.fromBank ? "Bankdan" : "Yeni"}
                            </span>
                          </div>
                          <p className="text-[13.5px] text-fg">{d.text}</p>

                          {isOpen && (
                            <div className="mt-2.5 border-t border-line pt-2.5">
                              {isChoice ? (
                                <ul className="flex flex-col gap-1.5">
                                  {d.options.map((o, oi) => (
                                    <li key={oi} className={cn("flex items-center gap-2 text-[12.5px]", o.isCorrect ? "font-medium text-success-fg" : "text-fg-muted")}>
                                      <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border", o.isCorrect ? "border-success bg-success-bg" : "border-line")}>
                                        {o.isCorrect && <Check size={11} />}
                                      </span>
                                      {o.text}
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <p className="text-[12.5px] italic text-fg-muted">Açıq mətn cavabı — əl ilə qiymətləndirilir.</p>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center gap-0.5">
                          <button type="button" onClick={() => toggleExpand(d.key)} className="p-1 text-fg-faint hover:text-fg" title="Önizləmə">
                            {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                          <button type="button" onClick={() => duplicate(d.key)} className="p-1 text-fg-faint hover:text-fg" title="Dublikat"><Copy size={14} /></button>
                          {!d.fromBank && (
                            <button type="button" onClick={() => openEditInline(d.key)} className="p-1 text-fg-faint hover:text-fg" title="Redaktə"><Pencil size={14} /></button>
                          )}
                          <button type="button" onClick={() => remove(d.key)} className="p-1 text-fg-faint hover:text-danger" title="Sil"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* ---------- right: sticky summary ---------- */}
        <aside className="lg:sticky lg:top-4">
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
              onClick={cancel}
              disabled={submitting}
              className={buttonClasses("ghost", "md", "mt-2 w-full")}
            >
              Ləğv et
            </button>
          </Card>
        </aside>
      </form>

      {/* general info popup */}
      {metaOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]" onClick={() => setMetaOpen(false)}>
          <div className="w-full max-w-[560px] rounded-[16px] bg-surface p-6 shadow-[0_12px_32px_rgba(15,23,42,0.18)]" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[16px] font-semibold text-fg">Ümumi məlumat</h3>
              <button type="button" onClick={() => setMetaOpen(false)} className="rounded-md p-1 text-fg-muted hover:text-fg"><X size={18} /></button>
            </div>
            <div className="flex flex-col gap-5">
              <FieldGroup label="İmtahanın adı" error={titleInvalid ? MEANINGFUL_TEXT_MSG : undefined}>
                <Input autoFocus value={title} onChange={(e) => setTitle(e.target.value)} placeholder="məs. Q1 Bilik Yoxlaması" invalid={titleInvalid} />
              </FieldGroup>
              <FieldGroup label="Təsvir" error={descInvalid ? MEANINGFUL_TEXT_MSG : undefined}>
                <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="İmtahan haqqında qısa məlumat…" invalid={descInvalid} />
              </FieldGroup>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                <FieldGroup label="Növ">
                  <Select value={examType} onChange={(e) => setExamType(e.target.value)}>
                    <option value="EXAM">İmtahan (ballı)</option>
                    <option value="SURVEY">Sorğu (balsız)</option>
                  </Select>
                </FieldGroup>
                {examType === "EXAM" && (
                  <FieldGroup label="Keçid balı (%)"><Input type="number" value={String(passMark)} onChange={(e) => { const d = e.target.value.replace(/\D/g, ""); setPassMark(d === "" ? 0 : Math.min(100, Number(d))); }} min={0} max={100} /></FieldGroup>
                )}
                <FieldGroup label="Müddət (dəqiqə)"><Input type="number" value={String(duration)} onChange={(e) => { const d = e.target.value.replace(/\D/g, ""); setDuration(d === "" ? 0 : Number(d)); }} min={1} /></FieldGroup>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <Button type="button" onClick={() => setMetaOpen(false)} disabled={titleInvalid || descInvalid}>Hazır</Button>
            </div>
          </div>
        </div>
      )}

      <BankPickerModal open={bankOpen} onClose={() => setBankOpen(false)} onAdd={addFromBank} excludeIds={bankIds} />
      {editorOpen && (
        <ExamQuestionModal
          open
          initial={editingDraft ? { type: editingDraft.type, text: editingDraft.text, imageUrl: editingDraft.imageUrl, score: editingDraft.score, options: editingDraft.options } : undefined}
          onClose={() => { setEditorOpen(false); setEditingKey(null); }}
          onSave={saveInline}
        />
      )}
    </>
  );
}
