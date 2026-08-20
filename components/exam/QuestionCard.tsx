"use client";

import React from "react";
import { GripVertical, Trash2, Copy, Plus, Check, Library } from "lucide-react";
import { Input, Select, Textarea } from "@/components/ui/Field";
import { ImageUploader } from "@/components/exam/ImageUploader";
import { cn } from "@/lib/cn";

const TYPE_OPTIONS = [
  { value: "SINGLE_CHOICE", label: "Tək seçim" },
  { value: "MULTIPLE_CHOICE", label: "Çox seçim" },
  { value: "TRUE_FALSE", label: "Doğru / Yanlış" },
  { value: "SHORT_TEXT", label: "Qısa mətn" },
  { value: "LONG_TEXT", label: "Uzun mətn" },
  { value: "IMAGE_QUESTION", label: "Şəkilli sual" },
  { value: "IMAGE_CHOICE", label: "Şəkil seçimi" },
];

export interface QuestionCardValue {
  type: string;
  text: string;
  imageUrl?: string | null;
  score: number;
  options: { text: string; isCorrect: boolean; imageUrl?: string | null }[];
}

interface QuestionCardProps {
  index: number;
  value: QuestionCardValue;
  fromBank: boolean;
  showScore: boolean;
  onChange: (patch: Partial<QuestionCardValue>) => void;
  onRemove: () => void;
  onDuplicate: () => void;
  draggable?: boolean;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  onDrop?: () => void;
  dragging?: boolean;
}

/** Default correct-answer text for TRUE_FALSE, kept in sync with option order below. */
const TF_TRUE = "Doğru";
const TF_FALSE = "Yanlış";

/** Sensible blank options when switching to a new question type. */
export function defaultOptionsFor(type: string): { text: string; isCorrect: boolean; imageUrl?: string | null }[] {
  if (type === "TRUE_FALSE") return [{ text: TF_TRUE, isCorrect: true }, { text: TF_FALSE, isCorrect: false }];
  if (type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE") return [{ text: "", isCorrect: false }, { text: "", isCorrect: false }];
  if (type === "IMAGE_CHOICE") return [{ text: "", isCorrect: false, imageUrl: null }, { text: "", isCorrect: false, imageUrl: null }];
  return [];
}

/** Compact read-only row for the wizard's final review step — no editing controls. */
export function QuestionPreview({
  index, type, text, score, showScore, options,
}: {
  index: number;
  type: string;
  text: string;
  score: number;
  showScore: boolean;
  options: { text: string; isCorrect: boolean }[];
}) {
  const hasOptions = options.length > 0;
  return (
    <div className="rounded-[14px] border border-line bg-surface p-4">
      <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
        <span className="num flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface-2 text-[12px] font-semibold text-fg-muted">{index + 1}</span>
        <span className="rounded-[6px] bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-600/10">
          {TYPE_OPTIONS.find((t) => t.value === type)?.label ?? type}
        </span>
        {showScore && <span className="num rounded-[6px] bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-surface-2">{score} bal</span>}
      </div>
      <p className="ml-8 text-[13.5px] text-fg">{text}</p>
      {hasOptions ? (
        <ul className="ml-8 mt-2 flex flex-col gap-1.5">
          {options.map((o, oi) => (
            <li key={oi} className={cn("flex items-center gap-2 text-[12.5px]", o.isCorrect ? "font-medium text-success-fg" : "text-fg-muted")}>
              <span className={cn("flex h-4 w-4 shrink-0 items-center justify-center rounded-[5px] border", o.isCorrect ? "border-success bg-success-bg" : "border-line")}>
                {o.isCorrect && <Check size={11} />}
              </span>
              {o.text}
            </li>
          ))}
        </ul>
      ) : (
        <p className="ml-8 mt-1 text-[12.5px] italic text-fg-muted">Açıq mətn cavabı — əl ilə qiymətləndirilir.</p>
      )}
    </div>
  );
}

export function QuestionCard({
  index, value, fromBank, showScore, onChange, onRemove, onDuplicate,
  draggable, onDragStart, onDragOver, onDragEnd, onDrop, dragging,
}: QuestionCardProps) {
  const { type, text, imageUrl, score, options } = value;
  const hasOptions = type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE";
  const isImageChoice = type === "IMAGE_CHOICE";
  const isImageQuestion = type === "IMAGE_QUESTION";
  const isTrueFalse = type === "TRUE_FALSE";
  const singleCorrect = type === "SINGLE_CHOICE" || type === "IMAGE_CHOICE";

  const setOpt = (i: number, patch: Partial<{ text: string; isCorrect: boolean; imageUrl: string | null }>) => {
    const next = options.map((o, oi) => {
      if (oi === i) return { ...o, ...patch };
      if (patch.isCorrect === true && singleCorrect) return { ...o, isCorrect: false };
      return o;
    });
    onChange({ options: next });
  };

  const addOption = () => onChange({ options: [...options, { text: "", isCorrect: false, imageUrl: isImageChoice ? null : undefined }] });
  const removeOption = (i: number) => onChange({ options: options.filter((_, x) => x !== i) });

  const tfCorrect: "true" | "false" = options.find((o) => o.isCorrect)?.text === TF_FALSE ? "false" : "true";
  const setTf = (v: "true" | "false") =>
    onChange({ options: [{ text: TF_TRUE, isCorrect: v === "true" }, { text: TF_FALSE, isCorrect: v === "false" }] });

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
      className={cn("rounded-[16px] border border-line bg-surface transition-shadow", dragging && "opacity-60 shadow-md")}
    >
      {/* header row */}
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3.5">
        <span className="flex cursor-grab items-center text-fg-faint active:cursor-grabbing" title="Sürüşdürərək sırala">
          <GripVertical size={16} />
        </span>
        <span className="num flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-50 text-[13px] font-semibold text-blue-700 dark:bg-blue-600/15 dark:text-blue-400">
          {index + 1}
        </span>

        {fromBank ? (
          <span className="inline-flex items-center gap-1.5 rounded-[7px] bg-purple-50 px-2.5 py-1.5 text-[12.5px] font-medium text-purple-700 dark:bg-purple-500/10">
            <Library size={13} /> Bankdan · {TYPE_OPTIONS.find((t) => t.value === type)?.label ?? type}
          </span>
        ) : (
          <Select value={type} onChange={(e) => onChange({ type: e.target.value, options: defaultOptionsFor(e.target.value) })} className="w-auto min-w-[160px]">
            {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
        )}

        <div className="ml-auto flex items-center gap-3">
          {showScore && (
            <label className="flex items-center gap-1.5 text-[13px] text-fg-muted">
              Bal:
              <Input
                type="number" step="0.5" min="0" max="100" value={score}
                onChange={(e) => {
                  const raw = parseFloat(e.target.value) || 0;
                  if (raw > 100) e.target.value = "100";
                  onChange({ score: Math.min(100, raw) });
                }}
                disabled={fromBank}
                className="num w-[64px] text-center"
              />
            </label>
          )}
          <button type="button" onClick={onDuplicate} className="p-1 text-fg-faint hover:text-fg" title="Dublikat"><Copy size={15} /></button>
          <button type="button" onClick={onRemove} className="p-1 text-fg-faint hover:text-danger" title="Sil"><Trash2 size={15} /></button>
        </div>
      </div>

      {/* body */}
      <div className="flex flex-col gap-4 p-5">
        {fromBank ? (
          <>
            <p className="text-[14px] text-fg">{text}</p>
            {hasOptions || isImageChoice ? (
              <ul className="flex flex-col gap-1.5">
                {options.map((o, oi) => (
                  <li key={oi} className={cn("flex items-center gap-2 text-[13px]", o.isCorrect ? "font-medium text-success-fg" : "text-fg-muted")}>
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
          </>
        ) : (
          <>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className="text-[13px] font-medium text-fg-muted">Mətn və Şəkil</label>
                {isImageQuestion && <span className="text-[12px] text-fg-faint">Sual üçün şəkil aşağıda yüklənir</span>}
              </div>
              <Textarea rows={3} value={text} onChange={(e) => onChange({ text: e.target.value })} placeholder="Sualın mətnini buraya yazın…" />
            </div>

            <ImageUploader
              value={imageUrl ?? null}
              onChange={(url) => onChange({ imageUrl: url })}
              label={isImageQuestion ? "Şəkil yüklə" : "Şəkil yüklə (opsional)"}
            />

            {isImageChoice && (
              <div className="rounded-[12px] bg-surface-2 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h4 className="text-[13.5px] font-semibold text-fg">Şəkilli variantlar</h4>
                  <button type="button" onClick={addOption} className="flex items-center gap-1 text-[13px] font-medium text-blue-600 hover:underline">
                    <Plus size={14} /> Variant əlavə et
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {options.map((o, i) => (
                    <div key={i} className="rounded-[10px] border border-line bg-surface p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <label className="flex items-center gap-2 text-[13px] font-medium text-fg">
                          <input type="radio" checked={o.isCorrect} onChange={(e) => setOpt(i, { isCorrect: e.target.checked })} className="h-4 w-4 accent-blue-600" />
                          Düzgün
                        </label>
                        {options.length > 2 && (
                          <button type="button" onClick={() => removeOption(i)} className="text-fg-faint hover:text-danger"><Trash2 size={15} /></button>
                        )}
                      </div>
                      <ImageUploader value={o.imageUrl ?? null} onChange={(url) => setOpt(i, { imageUrl: url })} label="Variant şəkli" />
                      <input className="field mt-2" value={o.text} onChange={(e) => setOpt(i, { text: e.target.value })} placeholder={`Etiket (ixtiyari) ${i + 1}`} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {hasOptions && (
              <div>
                <label className="mb-2 block text-[13px] font-medium text-fg-muted">Cavab variantları:</label>
                <div className="flex flex-col gap-2">
                  {options.map((o, i) => (
                    <div key={i} className="flex items-center gap-2.5 rounded-[10px] border border-line px-3 py-1">
                      <input
                        type={type === "SINGLE_CHOICE" ? "radio" : "checkbox"}
                        checked={o.isCorrect}
                        onChange={(e) => setOpt(i, { isCorrect: e.target.checked })}
                        className="h-4 w-4 shrink-0 accent-blue-600"
                        title="Düzgün cavab"
                      />
                      <input
                        className="h-11 flex-1 border-0 bg-transparent text-[13.5px] text-fg outline-none placeholder:text-fg-faint"
                        value={o.text}
                        onChange={(e) => setOpt(i, { text: e.target.value })}
                        placeholder={`${String.fromCharCode(65 + i)} variantı`}
                      />
                      {options.length > 2 && (
                        <button type="button" onClick={() => removeOption(i)} className="shrink-0 text-fg-faint hover:text-danger"><Trash2 size={15} /></button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" onClick={addOption} className="mt-2.5 flex items-center gap-1.5 text-[13px] font-medium text-blue-600 hover:underline">
                  <Plus size={15} /> Variant əlavə et
                </button>
              </div>
            )}

            {isTrueFalse && (
              <div>
                <label className="mb-2 block text-[13px] font-medium text-fg-muted">Düzgün cavab</label>
                <div className="flex gap-3">
                  {(["true", "false"] as const).map((v) => (
                    <button
                      key={v} type="button" onClick={() => setTf(v)}
                      className={cn(
                        "rounded-[9px] border px-5 py-2 text-[13.5px] font-medium transition-colors",
                        tfCorrect === v ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-600/10" : "border-line text-fg-muted hover:bg-surface-2",
                      )}
                    >
                      {v === "true" ? "Doğru" : "Yanlış"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {(type === "SHORT_TEXT" || type === "LONG_TEXT") && (
              <p className="text-[12.5px] italic text-fg-muted">Açıq mətn cavabı — əl ilə qiymətləndirilir.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
