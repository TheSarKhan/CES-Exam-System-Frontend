"use client";

import React from "react";
import { Check, Calendar, Minus, Plus, Star, ImageIcon, Clock } from "lucide-react";
import type { SessionQuestion } from "@/lib/types";
import { cn } from "@/lib/cn";

export interface AnswerValue {
  selectedOptionId?: number | null;
  optionIds?: number[];
  textAnswer?: string | null;
}

/** Whether the question has a non-empty answer (for navigator/progress). */
export function isAnswered(type: string, a?: AnswerValue): boolean {
  if (!a) return false;
  switch (type) {
    case "MULTIPLE_CHOICE":
      return (a.optionIds?.length ?? 0) > 0;
    case "SINGLE_CHOICE":
    case "TRUE_FALSE":
    case "IMAGE_CHOICE":
    case "LIKERT_SCALE":
      return a.selectedOptionId != null || !!a.textAnswer;
    default:
      return !!a.textAnswer && a.textAnswer.trim().length > 0;
  }
}

/** Map UI answer to the backend's {selectedOptionId, textAnswer} contract. */
export function toSubmitPayload(q: SessionQuestion, a?: AnswerValue) {
  if (!a) return { questionId: q.id, selectedOptionId: null, textAnswer: null };
  if (q.type === "MULTIPLE_CHOICE") {
    // Backend stores a single field — encode chosen ids as a comma list in textAnswer.
    return {
      questionId: q.id,
      selectedOptionId: null,
      textAnswer: a.optionIds && a.optionIds.length ? a.optionIds.join(",") : null,
    };
  }
  return {
    questionId: q.id,
    selectedOptionId: a.selectedOptionId ?? null,
    textAnswer: a.textAnswer ?? null,
  };
}

const MANUAL_TYPES = new Set(["SHORT_TEXT", "LONG_TEXT", "IMAGE_QUESTION"]);

function ReviewChip() {
  return (
    <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-info-bg px-3 py-1.5 text-[12.5px] font-semibold text-info-fg">
      <Clock size={13} /> HR tərəfindən yoxlanılacaq
    </span>
  );
}

const LIKERT_LABELS = ["Tam yox", "Yox", "Neytral", "Bəli", "Tam bəli"];
const LIKERT_EMOJI = ["😠", "🙁", "😐", "🙂", "😀"];

export function QuestionInput({
  question,
  answer,
  onChange,
}: {
  question: SessionQuestion;
  answer?: AnswerValue;
  onChange: (a: AnswerValue) => void;
}) {
  const type = question.type;
  const options = question.options ?? [];

  /* ---- Choice rows with letter chips (single) ---- */
  if (type === "SINGLE_CHOICE") {
    return (
      <div className="flex flex-col gap-2.5">
        {options.map((opt, i) => {
          const selected = answer?.selectedOptionId === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange({ selectedOptionId: opt.id })}
              className={cn(
                "flex items-center gap-3.5 rounded-[12px] border p-4 text-left transition-colors",
                selected
                  ? "border-blue-600 bg-blue-50 dark:bg-blue-600/10"
                  : "border-line bg-surface hover:border-blue-300 hover:bg-surface-2",
              )}
              style={selected ? { borderWidth: 1.5 } : undefined}
            >
              <span
                className={cn(
                  "flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-[8px] text-[13px] font-bold",
                  selected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-500 dark:bg-surface-2",
                )}
              >
                {String.fromCharCode(65 + i)}
              </span>
              <span className={cn("text-[14.5px]", selected ? "font-medium text-blue-800 dark:text-blue-300" : "text-fg-soft")}>
                {opt.text}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  /* ---- Multiple choice (checkboxes) ---- */
  if (type === "MULTIPLE_CHOICE") {
    const ids = answer?.optionIds ?? [];
    const toggle = (id: number) => {
      const next = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
      onChange({ optionIds: next });
    };
    return (
      <div className="flex flex-col gap-2.5">
        {options.map((opt) => {
          const selected = ids.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => toggle(opt.id)}
              className={cn(
                "flex items-center gap-3.5 rounded-[12px] border p-4 text-left transition-colors",
                selected ? "border-blue-600 bg-blue-50 dark:bg-blue-600/10" : "border-line bg-surface hover:border-blue-300 hover:bg-surface-2",
              )}
              style={selected ? { borderWidth: 1.5 } : undefined}
            >
              <span
                className={cn(
                  "flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[6px] border transition-colors",
                  selected ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300",
                )}
              >
                {selected && <Check size={15} strokeWidth={3} />}
              </span>
              <span className={cn("text-[14.5px]", selected ? "font-medium text-blue-800 dark:text-blue-300" : "text-fg-soft")}>
                {opt.text}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  /* ---- True / False ---- */
  if (type === "TRUE_FALSE") {
    const opts = options.length === 2 ? options : null;
    const choices = opts
      ? opts.map((o) => ({ id: o.id, label: o.text }))
      : [
          { id: -1, label: "Doğru" },
          { id: -2, label: "Yanlış" },
        ];
    return (
      <div className="grid grid-cols-2 gap-3">
        {choices.map((c) => {
          const selected = opts ? answer?.selectedOptionId === c.id : answer?.textAnswer === c.label;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => (opts ? onChange({ selectedOptionId: c.id }) : onChange({ textAnswer: c.label }))}
              className={cn(
                "flex items-center justify-center gap-2 rounded-[12px] border py-4 text-[15px] font-semibold transition-colors",
                selected ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-600/10" : "border-line bg-surface text-fg-soft hover:border-blue-300 hover:bg-surface-2",
              )}
              style={selected ? { borderWidth: 1.5 } : undefined}
            >
              {selected && <Check size={17} strokeWidth={2.6} />}
              {c.label}
            </button>
          );
        })}
      </div>
    );
  }

  /* ---- Short / Long text (manual review) ---- */
  if (type === "SHORT_TEXT") {
    return (
      <div>
        <input
          className="field"
          value={answer?.textAnswer ?? ""}
          onChange={(e) => onChange({ textAnswer: e.target.value })}
          placeholder="Cavabınızı yazın…"
        />
        <ReviewChip />
      </div>
    );
  }
  if (type === "LONG_TEXT") {
    const val = answer?.textAnswer ?? "";
    return (
      <div>
        <textarea
          className="field"
          rows={5}
          maxLength={1000}
          value={val}
          onChange={(e) => onChange({ textAnswer: e.target.value })}
          placeholder="Ətraflı cavabınızı yazın…"
        />
        <div className="mt-1 flex items-center justify-between">
          <ReviewChip />
          <span className="num text-[11.5px] text-fg-faint">{val.length}/1000</span>
        </div>
      </div>
    );
  }

  /* ---- Image question (media + text answer) ---- */
  if (type === "IMAGE_QUESTION") {
    return (
      <div>
        <div className="mb-3 flex h-[150px] items-center justify-center rounded-[12px] bg-gradient-to-br from-slate-800 to-slate-700 text-slate-400">
          <ImageIcon size={32} />
        </div>
        <input
          className="field"
          value={answer?.textAnswer ?? ""}
          onChange={(e) => onChange({ textAnswer: e.target.value })}
          placeholder="Şəklə əsasən cavabınızı yazın…"
        />
        <ReviewChip />
      </div>
    );
  }

  /* ---- Image choice (grid of tiles) ---- */
  if (type === "IMAGE_CHOICE") {
    return (
      <div className="grid grid-cols-2 gap-3">
        {options.map((opt) => {
          const selected = answer?.selectedOptionId === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onChange({ selectedOptionId: opt.id })}
              className={cn(
                "relative overflow-hidden rounded-[12px] border p-0 transition-colors",
                selected ? "border-blue-600" : "border-line hover:border-blue-300",
              )}
              style={selected ? { borderWidth: 2 } : undefined}
            >
              <div className="flex h-[110px] items-center justify-center bg-gradient-to-br from-slate-800 to-slate-700 text-slate-400">
                <ImageIcon size={26} />
              </div>
              {selected && (
                <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white">
                  <Check size={14} strokeWidth={3} />
                </span>
              )}
              <div className="px-3 py-2 text-left text-[13px] font-medium text-fg-soft">{opt.text}</div>
            </button>
          );
        })}
      </div>
    );
  }

  /* ---- Date picker ---- */
  if (type === "DATE_PICKER") {
    return (
      <div className="relative max-w-[280px]">
        <Calendar size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="date"
          className="field num pl-10"
          value={answer?.textAnswer ?? ""}
          onChange={(e) => onChange({ textAnswer: e.target.value })}
        />
      </div>
    );
  }

  /* ---- Number stepper ---- */
  if (type === "NUMBER_INPUT") {
    const n = answer?.textAnswer ? Number(answer.textAnswer) : 0;
    const set = (v: number) => onChange({ textAnswer: String(v) });
    return (
      <div className="inline-flex items-stretch overflow-hidden rounded-[9px] border border-line-strong">
        <button type="button" onClick={() => set(n - 1)} className="flex h-[42px] w-[42px] items-center justify-center text-fg-muted hover:bg-surface-2">
          <Minus size={16} />
        </button>
        <input
          type="number"
          className="num w-20 border-x border-line-strong bg-surface text-center text-[15px] font-semibold text-fg outline-none"
          value={answer?.textAnswer ?? ""}
          onChange={(e) => onChange({ textAnswer: e.target.value })}
        />
        <button type="button" onClick={() => set(n + 1)} className="flex h-[42px] w-[42px] items-center justify-center text-fg-muted hover:bg-surface-2">
          <Plus size={16} />
        </button>
      </div>
    );
  }

  /* ---- Rating (stars) ---- */
  if (type === "RATING") {
    const rating = answer?.textAnswer ? Number(answer.textAnswer) : 0;
    return (
      <div className="flex items-center gap-3">
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((v) => (
            <button key={v} type="button" onClick={() => onChange({ textAnswer: String(v) })} aria-label={`${v} ulduz`}>
              <Star
                size={32}
                strokeWidth={1.8}
                className={v <= rating ? "fill-[#F59E0B] text-[#F59E0B]" : "text-slate-300"}
              />
            </button>
          ))}
        </div>
        {rating > 0 && <span className="num text-[13px] text-fg-muted">{rating}/5 ulduz</span>}
      </div>
    );
  }

  /* ---- Likert scale ---- */
  if (type === "LIKERT_SCALE") {
    const useOpts = options.length === 5;
    return (
      <div className="grid grid-cols-5 gap-2.5">
        {(useOpts ? options : LIKERT_LABELS.map((_, i) => ({ id: i, text: "" }))).map((opt, i) => {
          const selected = useOpts ? answer?.selectedOptionId === (opt as any).id : answer?.textAnswer === String(i);
          return (
            <button
              key={i}
              type="button"
              onClick={() => (useOpts ? onChange({ selectedOptionId: (opt as any).id }) : onChange({ textAnswer: String(i) }))}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-[12px] border py-3 transition-colors",
                selected ? "border-blue-600 bg-blue-50 dark:bg-blue-600/10" : "border-line bg-surface hover:border-blue-300 hover:bg-surface-2",
              )}
              style={selected ? { borderWidth: 2 } : undefined}
            >
              <span className="text-[24px] leading-none">{LIKERT_EMOJI[i]}</span>
              <span className="text-[10.5px] font-medium text-fg-muted">{useOpts ? (opt as any).text : LIKERT_LABELS[i]}</span>
            </button>
          );
        })}
      </div>
    );
  }

  /* ---- Fallback ---- */
  return (
    <input
      className="field"
      value={answer?.textAnswer ?? ""}
      onChange={(e) => onChange({ textAnswer: e.target.value })}
      placeholder="Cavabınız…"
    />
  );
}

export function questionTypeLabel(type: string): string {
  const map: Record<string, string> = {
    SINGLE_CHOICE: "Tək seçim",
    MULTIPLE_CHOICE: "Çox seçim",
    TRUE_FALSE: "Doğru / Yanlış",
    SHORT_TEXT: "Qısa mətn",
    LONG_TEXT: "Uzun mətn",
    IMAGE_QUESTION: "Şəkilli sual",
    IMAGE_CHOICE: "Şəkil seçimi",
    DATE_PICKER: "Tarix",
    NUMBER_INPUT: "Ədəd",
    RATING: "Reytinq",
    LIKERT_SCALE: "Likert",
  };
  return map[type] ?? type;
}

export { MANUAL_TYPES };
