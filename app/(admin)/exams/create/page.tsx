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

interface AvailableTopic { id: number; name: string; category: string; maxQuestions: number }
interface TopicConfig { topicId: number; topicName: string; questionCount: number; maxQuestions: number }

export default function CreateExamPage() {
  const router = useRouter();
  const [available, setAvailable] = useState<AvailableTopic[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [examType, setExamType] = useState("EXAM");
  const [passMark, setPassMark] = useState(70);
  const [duration, setDuration] = useState(60);
  const [configs, setConfigs] = useState<TopicConfig[]>([]);
  const [selTopic, setSelTopic] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch<Category[]>("/api/v1/question-bank/categories")
      .then(async (cats) => {
        const topics: AvailableTopic[] = [];
        for (const c of cats) {
          const ts = await apiFetch<Topic[]>(`/api/v1/question-bank/categories/${c.id}/topics`);
          for (const t of ts) {
            const qs = await apiFetch<unknown[]>(`/api/v1/question-bank/topics/${t.id}/questions`);
            topics.push({ id: t.id, name: t.name, category: c.name, maxQuestions: qs.length });
          }
        }
        setAvailable(topics);
      })
      .catch((e) => setError(e.message));
  }, []);

  const addTopic = () => {
    if (!selTopic) return;
    const t = available.find((x) => x.id === Number(selTopic));
    if (!t || configs.find((c) => c.topicId === t.id)) return;
    setConfigs([...configs, { topicId: t.id, topicName: t.name, questionCount: Math.min(5, t.maxQuestions || 1), maxQuestions: t.maxQuestions }]);
    setSelTopic("");
  };

  const setCount = (id: number, count: number) =>
    setConfigs(configs.map((c) => (c.topicId === id ? { ...c, questionCount: Math.min(Math.max(1, count), c.maxQuestions) } : c)));

  const total = configs.reduce((s, c) => s + c.questionCount, 0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (configs.length === 0) return setError("Ən azı bir mövzu əlavə edin");
    setSubmitting(true);
    setError("");
    try {
      await apiFetch("/api/v1/exams", {
        method: "POST",
        body: JSON.stringify({
          title,
          description: description || null,
          type: examType,
          passMark: examType === "EXAM" ? passMark : null,
          durationMinutes: duration,
          topicConfigs: configs.map((c) => ({ topicId: c.topicId, questionCount: c.questionCount })),
        }),
      });
      router.push("/exams");
    } catch (e) {
      setError(e instanceof Error ? e.message : "İmtahan yaradılmadı");
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[900px]">
      <Link href="/exams" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-fg-muted hover:text-fg">
        <ArrowLeft size={15} /> İmtahanlara qayıt
      </Link>
      <h2 className="mb-5 text-[22px] font-bold tracking-[-0.4px] text-fg">Yeni imtahan</h2>

      {error && <div className="mb-4 rounded-[11px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-danger-fg">{error}</div>}

      <form onSubmit={submit} className="flex flex-col gap-5">
        <Card className="p-6">
          <h3 className="mb-5 text-[15px] font-semibold text-fg">Ümumi məlumat</h3>
          <div className="flex flex-col gap-5">
            <FieldGroup label="İmtahanın adı"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="məs. Q1 Bilik Yoxlaması" required /></FieldGroup>
            <FieldGroup label="Təsvir"><Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="İmtahan haqqında qısa məlumat…" /></FieldGroup>
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
              <FieldGroup label="Müddət (dəqiqə)"><Input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} min={1} required /></FieldGroup>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <h3 className="text-[15px] font-semibold text-fg">Mövzu konfiqurasiyası</h3>
              <p className="mt-0.5 text-[13px] text-fg-muted">Mövzuları seçin və hər birindən neçə təsadüfi sual gələcəyini təyin edin.</p>
            </div>
            <div className="text-right">
              <div className="num text-[28px] font-bold leading-none text-blue-600">{total}</div>
              <div className="text-[11px] text-fg-muted">ümumi sual</div>
            </div>
          </div>

          <div className="mb-4 flex gap-2.5 rounded-[12px] border border-dashed border-blue-200 bg-blue-50/40 p-3 dark:bg-blue-600/5">
            <Select value={selTopic} onChange={(e) => setSelTopic(e.target.value)} className="flex-1">
              <option value="">— Əlavə etmək üçün mövzu seçin —</option>
              {available.filter((t) => !configs.find((c) => c.topicId === t.id)).map((t) => (
                <option key={t.id} value={t.id}>{t.category} › {t.name} ({t.maxQuestions} mövcud)</option>
              ))}
            </Select>
            <Button type="button" icon={<Plus size={16} />} onClick={addTopic}>Əlavə et</Button>
          </div>

          {configs.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-fg-muted">Hələ mövzu əlavə edilməyib.</p>
          ) : (
            <div className="flex flex-col gap-2.5">
              {configs.map((c) => (
                <div key={c.topicId} className="flex items-center gap-4 rounded-[11px] border border-line p-3.5">
                  <div className="flex-1">
                    <div className="text-[14px] font-medium text-fg">{c.topicName}</div>
                    <div className="num text-[11.5px] text-fg-faint">Maks {c.maxQuestions} sual mövcud</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[12.5px] text-fg-muted">Sual:</span>
                    <input type="number" className="field num w-20 text-center" value={c.questionCount} onChange={(e) => setCount(c.topicId, Number(e.target.value))} min={1} max={c.maxQuestions} />
                  </div>
                  <button type="button" onClick={() => setConfigs(configs.filter((x) => x.topicId !== c.topicId))} className="text-fg-faint hover:text-danger">
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="flex justify-end gap-3">
          <Link href="/exams" className={buttonClasses("secondary", "md")}>Ləğv et</Link>
          <Button type="submit" loading={submitting}>İmtahanı yarat</Button>
        </div>
      </form>
    </div>
  );
}
