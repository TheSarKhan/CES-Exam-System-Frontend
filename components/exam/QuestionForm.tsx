"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Trash2, FolderTree } from "lucide-react";
import type { Difficulty } from "@/lib/types";
import type { TopicOption } from "@/lib/questionBank";
import { Card } from "@/components/ui/Card";
import { FieldGroup, Input, Select, Textarea } from "@/components/ui/Field";
import { Button, buttonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { ImageUploader } from "@/components/exam/ImageUploader";
import { hasMeaningfulText, MEANINGFUL_TEXT_MSG } from "@/lib/validate";

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "SINGLE_CHOICE", label: "Tək seçim" },
  { value: "MULTIPLE_CHOICE", label: "Çox seçim" },
  { value: "TRUE_FALSE", label: "Doğru / Yanlış" },
  { value: "SHORT_TEXT", label: "Qısa mətn" },
  { value: "LONG_TEXT", label: "Uzun mətn" },
  { value: "IMAGE_QUESTION", label: "Şəkilli sual" },
  { value: "IMAGE_CHOICE", label: "Şəkil seçimi" },
];

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: "EASY", label: "Asan" },
  { value: "MEDIUM", label: "Orta" },
  { value: "HARD", label: "Çətin" },
];

export interface QuestionFormInitial {
  type?: string;
  text?: string;
  imageUrl?: string | null;
  score?: number;
  difficulty?: Difficulty;
  options?: { text: string; isCorrect: boolean; imageUrl?: string | null }[] | null;
}

interface QuestionFormProps {
  topicOptions: TopicOption[];
  initialTopicId?: number;
  initial?: QuestionFormInitial;
  submitLabel: string;
  onSubmit: (body: Record<string, unknown>) => Promise<void>;
}

function uniqueBy<T, K>(arr: T[], key: (t: T) => K): T[] {
  const seen = new Set<K>();
  const out: T[] = [];
  for (const item of arr) {
    const k = key(item);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(item);
    }
  }
  return out;
}

export function QuestionForm({ topicOptions, initialTopicId, initial, submitLabel, onSubmit }: QuestionFormProps) {
  // ----- resolve the initial department/category/topic triple once -----
  const init = useMemo(() => {
    const opt = initialTopicId ? topicOptions.find((t) => t.topicId === initialTopicId) : undefined;
    const dId = opt?.departmentId ?? topicOptions[0]?.departmentId;
    const cId = opt?.categoryId ?? topicOptions.find((t) => t.departmentId === dId)?.categoryId;
    const tId = opt?.topicId ?? topicOptions.find((t) => t.categoryId === cId)?.topicId;
    return { dId: dId ?? ("" as const), cId: cId ?? ("" as const), tId: tId ?? ("" as const) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [departmentId, setDepartmentId] = useState<number | "">(init.dId);
  const [categoryId, setCategoryId] = useState<number | "">(init.cId);
  const [topicId, setTopicId] = useState<number | "">(init.tId);
  // Location is shown read-only by default when we already know the topic; expand only on demand.
  const [editingLocation, setEditingLocation] = useState<boolean>(!init.tId);

  const [qType, setQType] = useState(initial?.type ?? "SINGLE_CHOICE");
  const [qText, setQText] = useState(initial?.text ?? "");
  const [qImageUrl, setQImageUrl] = useState<string | null>(initial?.imageUrl ?? null);
  const [score, setScore] = useState<number>(initial?.score ?? 1);
  const [difficulty, setDifficulty] = useState<Difficulty>(initial?.difficulty ?? "MEDIUM");
  const [options, setOptions] = useState<{ text: string; isCorrect: boolean; imageUrl?: string | null }[]>(() => {
    const o = initial?.options;
    if (o && o.length && (initial?.type === "SINGLE_CHOICE" || initial?.type === "MULTIPLE_CHOICE" || initial?.type === "IMAGE_CHOICE")) {
      return o.map((x) => ({ text: x.text, isCorrect: x.isCorrect, imageUrl: x.imageUrl ?? null }));
    }
    return [{ text: "", isCorrect: false }, { text: "", isCorrect: false }];
  });
  const [tfCorrect, setTfCorrect] = useState<"true" | "false">(() => {
    if (initial?.type === "TRUE_FALSE" && initial.options) {
      const c = initial.options.find((x) => x.isCorrect);
      return c && c.text === "Yanlış" ? "false" : "true";
    }
    return "true";
  });

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // ----- cascading option lists -----
  const departments = useMemo(() => uniqueBy(topicOptions, (t) => t.departmentId), [topicOptions]);
  const categories = useMemo(
    () => uniqueBy(topicOptions.filter((t) => t.departmentId === departmentId), (t) => t.categoryId),
    [topicOptions, departmentId],
  );
  const topics = useMemo(
    () => topicOptions.filter((t) => t.categoryId === categoryId),
    [topicOptions, categoryId],
  );
  const selected = useMemo(() => topicOptions.find((t) => t.topicId === topicId), [topicOptions, topicId]);

  const onDeptChange = (d: number) => {
    setDepartmentId(d);
    const firstCat = topicOptions.find((t) => t.departmentId === d);
    setCategoryId(firstCat?.categoryId ?? "");
    const firstTopic = topicOptions.find((t) => t.categoryId === firstCat?.categoryId);
    setTopicId(firstTopic?.topicId ?? "");
  };
  const onCatChange = (c: number) => {
    setCategoryId(c);
    const firstTopic = topicOptions.find((t) => t.categoryId === c);
    setTopicId(firstTopic?.topicId ?? "");
  };

  const singleCorrect = qType === "SINGLE_CHOICE" || qType === "IMAGE_CHOICE";

  const setOpt = (i: number, field: "text" | "isCorrect" | "imageUrl", value: string | boolean | null) => {
    setOptions((prev) => {
      const next = [...prev];
      if (field === "isCorrect" && singleCorrect && value === true) next.forEach((o) => (o.isCorrect = false));
      next[i] = { ...next[i], [field]: value };
      return next;
    });
  };

  const buildOptions = () => {
    if (qType === "TRUE_FALSE")
      return [
        { text: "Doğru", isCorrect: tfCorrect === "true", sortOrder: 0 },
        { text: "Yanlış", isCorrect: tfCorrect === "false", sortOrder: 1 },
      ];
    if (qType === "SINGLE_CHOICE" || qType === "MULTIPLE_CHOICE")
      return options.map((o, i) => ({ text: o.text, isCorrect: o.isCorrect, sortOrder: i }));
    if (qType === "IMAGE_CHOICE")
      return options.map((o, i) => ({ text: o.text || `Variant ${i + 1}`, imageUrl: o.imageUrl ?? null, isCorrect: o.isCorrect, sortOrder: i }));
    return undefined;
  };

  const hasOptions = qType === "SINGLE_CHOICE" || qType === "MULTIPLE_CHOICE";
  const isImageChoice = qType === "IMAGE_CHOICE";
  const isImageQuestion = qType === "IMAGE_QUESTION";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicId) return setError("Mövzu seçin");
    if (!qText.trim()) return setError("Sual mətni boş ola bilməz");
    if (!hasMeaningfulText(qText)) return setError(`Sual mətni: ${MEANINGFUL_TEXT_MSG}`);
    if (hasOptions && options.filter((o) => o.text.trim()).length < 2) return setError("Ən azı 2 variant daxil edin");
    // Every filled-in variant must be real text, not just "." / "," / "-".
    if (options.some((o) => o.text.trim() && !hasMeaningfulText(o.text))) return setError(`Variantlar: ${MEANINGFUL_TEXT_MSG}`);
    if (hasOptions && !options.some((o) => o.isCorrect)) return setError("Ən azı bir düzgün variant işarələyin");
    if (isImageQuestion && !qImageUrl) return setError("Sual üçün şəkil yükləyin");
    if (isImageChoice && options.filter((o) => o.imageUrl).length < 2) return setError("Ən azı 2 variant şəkli yükləyin");
    if (isImageChoice && !options.some((o) => o.isCorrect)) return setError("Düzgün variantı işarələyin");
    setSubmitting(true);
    setError("");
    try {
      await onSubmit({
        topicId: Number(topicId),
        type: qType,
        text: qText,
        imageUrl: qImageUrl,
        score,
        difficulty,
        options: buildOptions(),
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Yadda saxlanmadı");
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-6">
      <form onSubmit={submit} className="flex flex-col gap-5">
        {error && <div className="rounded-[11px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-danger-fg">{error}</div>}

        {/* Location: Şöbə → Kateqoriya → Mövzu (read-only, editable on demand) */}
        {!editingLocation && selected ? (
          <div className="flex items-center justify-between gap-3 rounded-[12px] border border-line bg-surface-2 px-4 py-3">
            <div className="flex min-w-0 items-center gap-2 text-[13px]">
              <FolderTree size={15} className="shrink-0 text-fg-muted" />
              <span className="truncate">
                <span className="text-fg-muted">{selected.departmentName}</span>
                <span className="mx-1.5 text-fg-faint">›</span>
                <span className="text-fg-muted">{selected.categoryName}</span>
                <span className="mx-1.5 text-fg-faint">›</span>
                <span className="font-semibold text-fg">{selected.topicName}</span>
              </span>
            </div>
            <button
              type="button"
              onClick={() => setEditingLocation(true)}
              className="shrink-0 text-[13px] font-medium text-blue-600 hover:underline"
            >
              Dəyiş
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FieldGroup label="Şöbə">
              <Select value={departmentId} onChange={(e) => onDeptChange(Number(e.target.value))}>
                {departments.length === 0 && <option value="">Şöbə yoxdur</option>}
                {departments.map((d) => <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}
              </Select>
            </FieldGroup>
            <FieldGroup label="Kateqoriya">
              <Select value={categoryId} onChange={(e) => onCatChange(Number(e.target.value))}>
                {categories.length === 0 && <option value="">Kateqoriya yoxdur</option>}
                {categories.map((c) => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
              </Select>
            </FieldGroup>
            <FieldGroup label="Mövzu">
              <Select value={topicId} onChange={(e) => setTopicId(Number(e.target.value))}>
                {topics.length === 0 && <option value="">Mövzu yoxdur</option>}
                {topics.map((t) => <option key={t.topicId} value={t.topicId}>{t.topicName}</option>)}
              </Select>
            </FieldGroup>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FieldGroup label="Sual növü">
            <Select value={qType} onChange={(e) => setQType(e.target.value)}>
              {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </FieldGroup>
          <FieldGroup label="Çətinlik">
            <Select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty)}>
              {DIFFICULTIES.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
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
              required
            />
          </FieldGroup>
        </div>

        <FieldGroup label="Sual mətni">
          <Textarea rows={4} value={qText} onChange={(e) => setQText(e.target.value)} placeholder="Sualınızı buraya yazın…" required />
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
                      <button type="button" onClick={() => setOptions(options.filter((_, x) => x !== i))} className="text-fg-faint hover:text-danger">
                        <Trash2 size={15} />
                      </button>
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
                  <input className="field flex-1" value={o.text} onChange={(e) => setOpt(i, "text", e.target.value)} placeholder={`Variant ${i + 1}`} required />
                  {options.length > 2 && (
                    <button type="button" onClick={() => setOptions(options.filter((_, x) => x !== i))} className="text-fg-faint hover:text-danger">
                      <Trash2 size={16} />
                    </button>
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
                <button
                  key={v}
                  type="button"
                  onClick={() => setTfCorrect(v)}
                  className={cn(
                    "rounded-[9px] border px-5 py-2 text-[14px] font-medium transition-colors",
                    tfCorrect === v ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-600/10" : "border-line text-fg-muted hover:bg-surface",
                  )}
                >
                  {v === "true" ? "Doğru" : "Yanlış"}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <Link href="/question-bank" className={buttonClasses("secondary", "md")}>Ləğv et</Link>
          <Button type="submit" loading={submitting}>{submitLabel}</Button>
        </div>
      </form>
    </Card>
  );
}
