"use client";

import React, { useState } from "react";
import { X, Plus, Trash2, PencilLine } from "lucide-react";
import { FieldGroup, Input, Select, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { ImageUploader } from "@/components/exam/ImageUploader";
import { hasMeaningfulText, MEANINGFUL_TEXT_MSG } from "@/lib/validate";

const TYPE_OPTIONS = [
  { value: "SINGLE_CHOICE", label: "Tək seçim" },
  { value: "MULTIPLE_CHOICE", label: "Çox seçim" },
  { value: "TRUE_FALSE", label: "Doğru / Yanlış" },
  { value: "SHORT_TEXT", label: "Qısa mətn" },
  { value: "LONG_TEXT", label: "Uzun mətn" },
  { value: "IMAGE_QUESTION", label: "Şəkilli sual" },
  { value: "IMAGE_CHOICE", label: "Şəkil seçimi" },
];

export interface DraftValue {
  type: string;
  text: string;
  imageUrl?: string | null;
  score: number;
  /** Final-form options: choice → the variants; TRUE_FALSE → [Doğru, Yanlış]; text types → []. */
  options: { text: string; isCorrect: boolean; imageUrl?: string | null }[];
}

interface ExamQuestionModalProps {
  open: boolean;
  initial?: DraftValue;
  onClose: () => void;
  onSave: (value: DraftValue) => void;
}

export function ExamQuestionModal({ open, initial, onClose, onSave }: ExamQuestionModalProps) {
  const [qType, setQType] = useState(initial?.type ?? "SINGLE_CHOICE");
  const [qText, setQText] = useState(initial?.text ?? "");
  const [qImageUrl, setQImageUrl] = useState<string | null>(initial?.imageUrl ?? null);
  const [score, setScore] = useState<number>(initial?.score ?? 1);
  const [options, setOptions] = useState<{ text: string; isCorrect: boolean; imageUrl?: string | null }[]>(() => {
    if (initial && (initial.type === "SINGLE_CHOICE" || initial.type === "MULTIPLE_CHOICE" || initial.type === "IMAGE_CHOICE")) {
      return initial.options.map((o) => ({ text: o.text, isCorrect: o.isCorrect, imageUrl: o.imageUrl ?? null }));
    }
    return [{ text: "", isCorrect: false }, { text: "", isCorrect: false }];
  });
  const [tfCorrect, setTfCorrect] = useState<"true" | "false">(() => {
    if (initial?.type === "TRUE_FALSE") {
      const c = initial.options.find((o) => o.isCorrect);
      return c && c.text === "Yanlış" ? "false" : "true";
    }
    return "true";
  });
  const [error, setError] = useState("");

  const hasOptions = qType === "SINGLE_CHOICE" || qType === "MULTIPLE_CHOICE";
  const isImageChoice = qType === "IMAGE_CHOICE";
  const isImageQuestion = qType === "IMAGE_QUESTION";
  const singleCorrect = qType === "SINGLE_CHOICE" || qType === "IMAGE_CHOICE";

  const setOpt = (i: number, field: "text" | "isCorrect" | "imageUrl", value: string | boolean | null) => {
    setOptions((prev) => {
      const next = [...prev];
      if (field === "isCorrect" && singleCorrect && value === true) next.forEach((o) => (o.isCorrect = false));
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };

  const buildOptions = (): { text: string; isCorrect: boolean; imageUrl?: string | null }[] => {
    if (qType === "TRUE_FALSE")
      return [
        { text: "Doğru", isCorrect: tfCorrect === "true" },
        { text: "Yanlış", isCorrect: tfCorrect === "false" },
      ];
    if (hasOptions) return options.filter((o) => o.text.trim());
    if (isImageChoice)
      return options.filter((o) => o.imageUrl).map((o, i) => ({ text: o.text.trim() || `Variant ${i + 1}`, isCorrect: o.isCorrect, imageUrl: o.imageUrl ?? null }));
    return [];
  };

  const save = () => {
    if (!qText.trim()) return setError("Sual mətni boş ola bilməz");
    if (!hasMeaningfulText(qText)) return setError(`Sual mətni: ${MEANINGFUL_TEXT_MSG}`);
    if (hasOptions && options.filter((o) => o.text.trim()).length < 2) return setError("Ən azı 2 variant daxil edin");
    // Every filled-in variant must be real text, not just "." / "," / "-".
    if (options.some((o) => o.text.trim() && !hasMeaningfulText(o.text))) return setError(`Variantlar: ${MEANINGFUL_TEXT_MSG}`);
    if (hasOptions && !options.some((o) => o.isCorrect)) return setError("Ən azı bir düzgün variant işarələyin");
    if (isImageQuestion && !qImageUrl) return setError("Sual üçün şəkil yükləyin");
    if (isImageChoice && options.filter((o) => o.imageUrl).length < 2) return setError("Ən azı 2 variant şəkli yükləyin");
    if (isImageChoice && !options.some((o) => o.isCorrect)) return setError("Düzgün variantı işarələyin");
    onSave({ type: qType, text: qText.trim(), imageUrl: qImageUrl, score, options: buildOptions() });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="flex max-h-[88vh] w-full max-w-[600px] flex-col overflow-hidden rounded-[16px] bg-surface shadow-[0_12px_32px_rgba(15,23,42,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-blue-50 text-blue-600 dark:bg-blue-600/10"><PencilLine size={18} /></div>
            <h3 className="text-[16px] font-semibold text-fg">{initial ? "Sualı redaktə et" : "Yeni sual yaz"}</h3>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-fg-muted hover:text-fg"><X size={18} /></button>
        </div>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">
          {error && <div className="rounded-[10px] border border-[#FECACA] bg-[#FEF2F2] px-3.5 py-2.5 text-[13px] text-danger-fg">{error}</div>}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FieldGroup label="Sual növü">
              <Select value={qType} onChange={(e) => setQType(e.target.value)}>
                {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
            </FieldGroup>
            <FieldGroup label="Bal">
              <Input
                type="number"
                step="0.5"
                min="0"
                max="100"
                value={score}
                onChange={(e) => {
                  const raw = parseFloat(e.target.value) || 0;
                  // Cap points at 100. Only rewrite the field when the entry
                  // goes over — so a mid-entry decimal like "50." still types.
                  if (raw > 100) e.target.value = "100";
                  setScore(Math.min(100, raw));
                }}
              />
            </FieldGroup>
          </div>

          <FieldGroup label="Sual mətni">
            <Textarea rows={3} value={qText} onChange={(e) => setQText(e.target.value)} placeholder="Sualınızı buraya yazın…" />
          </FieldGroup>

          {isImageQuestion && (
            <FieldGroup label="Sual şəkli">
              <ImageUploader value={qImageUrl} onChange={setQImageUrl} label="Şəkil yüklə" />
            </FieldGroup>
          )}

          {isImageChoice && (
            <div className="rounded-[12px] bg-surface-2 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-[14px] font-semibold text-fg">Şəkilli variantlar</h4>
                <button type="button" onClick={() => setOptions([...options, { text: "", isCorrect: false, imageUrl: null }])} className="flex items-center gap-1 text-[13px] font-medium text-blue-600 hover:underline">
                  <Plus size={14} /> Variant əlavə et
                </button>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {options.map((o, i) => (
                  <div key={i} className="rounded-[10px] border border-line bg-surface p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <label className="flex items-center gap-2 text-[13px] font-medium text-fg">
                        <input type="radio" checked={o.isCorrect} onChange={(e) => setOpt(i, "isCorrect", e.target.checked)} className="h-4 w-4 accent-blue-600" />
                        Düzgün
                      </label>
                      {options.length > 2 && (
                        <button type="button" onClick={() => setOptions(options.filter((_, x) => x !== i))} className="text-fg-faint hover:text-danger"><Trash2 size={15} /></button>
                      )}
                    </div>
                    <ImageUploader value={o.imageUrl} onChange={(url) => setOpt(i, "imageUrl", url)} label="Variant şəkli" />
                    <input className="field mt-2" value={o.text} onChange={(e) => setOpt(i, "text", e.target.value)} placeholder={`Etiket (ixtiyari) ${i + 1}`} />
                  </div>
                ))}
              </div>
              <p className="mt-2.5 text-[12px] text-fg-faint">Hər variant üçün şəkil yükləyin və düzgün olanı seçin.</p>
            </div>
          )}

          {hasOptions && (
            <div className="rounded-[12px] bg-surface-2 p-4">
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-[14px] font-semibold text-fg">Variantlar</h4>
                <button type="button" onClick={() => setOptions([...options, { text: "", isCorrect: false }])} className="flex items-center gap-1 text-[13px] font-medium text-blue-600 hover:underline">
                  <Plus size={14} /> Variant əlavə et
                </button>
              </div>
              <div className="flex flex-col gap-2.5">
                {options.map((o, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <input
                      type={qType === "SINGLE_CHOICE" ? "radio" : "checkbox"}
                      checked={o.isCorrect}
                      onChange={(e) => setOpt(i, "isCorrect", e.target.checked)}
                      className="h-5 w-5 accent-blue-600"
                      title="Düzgün cavab"
                    />
                    <input className="field flex-1" value={o.text} onChange={(e) => setOpt(i, "text", e.target.value)} placeholder={`Variant ${i + 1}`} />
                    {options.length > 2 && (
                      <button type="button" onClick={() => setOptions(options.filter((_, x) => x !== i))} className="text-fg-faint hover:text-danger"><Trash2 size={16} /></button>
                    )}
                  </div>
                ))}
              </div>
              <p className="mt-2.5 text-[12px] text-fg-faint">Düzgün cavab(lar)ı işarələyin.</p>
            </div>
          )}

          {qType === "TRUE_FALSE" && (
            <div className="rounded-[12px] bg-surface-2 p-4">
              <h4 className="mb-3 text-[14px] font-semibold text-fg">Düzgün cavab</h4>
              <div className="flex gap-3">
                {(["true", "false"] as const).map((v) => (
                  <button key={v} type="button" onClick={() => setTfCorrect(v)}
                    className={cn(
                      "rounded-[9px] border px-5 py-2 text-[14px] font-medium transition-colors",
                      tfCorrect === v ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-600/10" : "border-line text-fg-muted hover:bg-surface",
                    )}>
                    {v === "true" ? "Doğru" : "Yanlış"}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2.5 border-t border-line px-5 py-3.5">
          <Button variant="secondary" onClick={onClose}>Ləğv et</Button>
          <Button onClick={save}>{initial ? "Yadda saxla" : "Əlavə et"}</Button>
        </div>
      </div>
    </div>
  );
}
