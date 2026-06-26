"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Category, Topic } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { FieldGroup, Input, Select, Textarea } from "@/components/ui/Field";
import { Button, buttonClasses } from "@/components/ui/Button";

interface TopicOption { id: number; label: string }

export default function CreateQuestionPage() {
  const router = useRouter();
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [topicId, setTopicId] = useState("");
  const [qType, setQType] = useState("SINGLE_CHOICE");
  const [qText, setQText] = useState("");
  const [score, setScore] = useState(1);
  const [tfCorrect, setTfCorrect] = useState<"true" | "false">("true");
  const [options, setOptions] = useState([{ text: "", isCorrect: false }, { text: "", isCorrect: false }]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch<Category[]>("/api/v1/question-bank/categories")
      .then(async (cats) => {
        const all: TopicOption[] = [];
        for (const c of cats) {
          const ts = await apiFetch<Topic[]>(`/api/v1/question-bank/categories/${c.id}/topics`);
          ts.forEach((t) => all.push({ id: t.id, label: `${c.name} › ${t.name}` }));
        }
        setTopics(all);
        if (all.length) setTopicId(String(all[0].id));
      })
      .catch((e) => setError(e.message));
  }, []);

  const setOpt = (i: number, field: "text" | "isCorrect", value: string | boolean) => {
    setOptions((prev) => {
      const next = [...prev];
      if (field === "isCorrect" && qType === "SINGLE_CHOICE" && value === true) next.forEach((o) => (o.isCorrect = false));
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
    return undefined;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicId) return setError("Mövzu seçin");
    setSubmitting(true);
    setError("");
    try {
      await apiFetch("/api/v1/question-bank/questions", {
        method: "POST",
        body: JSON.stringify({ topicId: Number(topicId), type: qType, text: qText, score, options: buildOptions() }),
      });
      router.push("/question-bank");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sual yaradılmadı");
      setSubmitting(false);
    }
  };

  const hasOptions = qType === "SINGLE_CHOICE" || qType === "MULTIPLE_CHOICE";

  return (
    <div className="mx-auto max-w-[760px]">
      <Link href="/question-bank" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-fg-muted hover:text-fg">
        <ArrowLeft size={15} /> Sual bankına qayıt
      </Link>
      <h2 className="mb-5 text-[22px] font-bold tracking-[-0.4px] text-fg">Yeni sual</h2>

      {error && <div className="mb-4 rounded-[11px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-danger-fg">{error}</div>}

      <Card className="p-6">
        <form onSubmit={submit} className="flex flex-col gap-5">
          <FieldGroup label="Mövzu">
            <Select value={topicId} onChange={(e) => setTopicId(e.target.value)} required>
              {topics.length === 0 && <option value="">Mövzu yoxdur</option>}
              {topics.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </Select>
          </FieldGroup>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FieldGroup label="Sual növü">
              <Select value={qType} onChange={(e) => setQType(e.target.value)}>
                <option value="SINGLE_CHOICE">Tək seçim</option>
                <option value="MULTIPLE_CHOICE">Çox seçim</option>
                <option value="TRUE_FALSE">Doğru / Yanlış</option>
                <option value="SHORT_TEXT">Qısa mətn (manual)</option>
                <option value="LONG_TEXT">Uzun mətn (manual)</option>
                <option value="RATING">Reytinq</option>
                <option value="LIKERT_SCALE">Likert</option>
                <option value="NUMBER_INPUT">Ədəd</option>
                <option value="DATE_PICKER">Tarix</option>
              </Select>
            </FieldGroup>
            <FieldGroup label="Bal">
              <Input type="number" step="0.5" value={score} onChange={(e) => setScore(parseFloat(e.target.value) || 0)} required />
            </FieldGroup>
          </div>

          <FieldGroup label="Sual mətni">
            <Textarea rows={4} value={qText} onChange={(e) => setQText(e.target.value)} placeholder="Sualınızı buraya yazın…" required />
          </FieldGroup>

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
              <p className="mt-2.5 text-[12px] text-fg-faint">Düzgün cav(lar)ı işarələyin.</p>
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
                    className={
                      "rounded-[9px] border px-5 py-2 text-[14px] font-medium transition-colors " +
                      (tfCorrect === v ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-600/10" : "border-line text-fg-muted hover:bg-surface")
                    }
                  >
                    {v === "true" ? "Doğru" : "Yanlış"}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-1">
            <Link href="/question-bank" className={buttonClasses("secondary", "md")}>Ləğv et</Link>
            <Button type="submit" loading={submitting}>Sualı yarat</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
