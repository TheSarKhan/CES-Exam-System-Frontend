"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Plus, FolderTree, Package } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Category, Question, Topic } from "@/lib/types";
import { PageHeader } from "@/components/app/PageHeader";
import { Card } from "@/components/ui/Card";
import { buttonClasses } from "@/components/ui/Button";
import { Loading, EmptyState } from "@/components/ui/Feedback";
import { questionTypeLabel } from "@/components/exam/QuestionInput";
import { cn } from "@/lib/cn";

interface CategoryWithTopics extends Category {
  topics: Topic[];
}

export default function QuestionBankPage() {
  const [categories, setCategories] = useState<CategoryWithTopics[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [counts, setCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [loadingQ, setLoadingQ] = useState(false);
  const [error, setError] = useState("");

  const [newCat, setNewCat] = useState("");
  const [newTopic, setNewTopic] = useState("");
  const [addingTopic, setAddingTopic] = useState<number | null>(null);

  const loadCategories = useCallback(async () => {
    try {
      const cats = await apiFetch<Category[]>("/api/v1/question-bank/categories");
      const withTopics = await Promise.all(
        cats.map(async (c) => ({
          ...c,
          topics: await apiFetch<Topic[]>(`/api/v1/question-bank/categories/${c.id}/topics`),
        })),
      );
      setCategories(withTopics);
      const first = withTopics.find((c) => c.topics.length > 0)?.topics[0];
      if (first && selectedTopic == null) setSelectedTopic(first.id);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sual bankı yüklənmədi");
    } finally {
      setLoading(false);
    }
  }, [selectedTopic]);

  useEffect(() => {
    loadCategories();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!selectedTopic) return setQuestions([]);
    setLoadingQ(true);
    apiFetch<Question[]>(`/api/v1/question-bank/topics/${selectedTopic}/questions`)
      .then((d) => {
        setQuestions(d);
        setCounts((p) => ({ ...p, [selectedTopic]: d.length }));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoadingQ(false));
  }, [selectedTopic]);

  const createCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.trim()) return;
    try {
      await apiFetch("/api/v1/question-bank/categories", { method: "POST", body: JSON.stringify({ name: newCat }) });
      setNewCat("");
      loadCategories();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Kateqoriya yaradılmadı");
    }
  };

  const createTopic = async (e: React.FormEvent, categoryId: number) => {
    e.preventDefault();
    if (!newTopic.trim()) return;
    try {
      await apiFetch("/api/v1/question-bank/topics", { method: "POST", body: JSON.stringify({ categoryId, name: newTopic }) });
      setNewTopic("");
      setAddingTopic(null);
      loadCategories();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Mövzu yaradılmadı");
    }
  };

  const activeTopic = categories.flatMap((c) => c.topics).find((t) => t.id === selectedTopic);

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        title="Sual bankı"
        subtitle="Kateqoriya · Mövzu · Suallar"
        action={
          <Link href="/question-bank/create" className={buttonClasses("primary", "md")}>
            <Plus size={17} /> Yeni sual
          </Link>
        }
      />

      {error && <div className="mb-4 rounded-[11px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-danger-fg">{error}</div>}

      {loading ? (
        <Loading />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[260px_1fr]">
          {/* Tree */}
          <Card className="h-fit p-4">
            <h3 className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-fg-faint">
              <FolderTree size={14} /> Kateqoriyalar
            </h3>

            <form onSubmit={createCategory} className="mb-3 flex gap-1.5">
              <input className="field !h-9 flex-1 text-[13px]" placeholder="Yeni kateqoriya…" value={newCat} onChange={(e) => setNewCat(e.target.value)} required />
              <button type="submit" className="flex h-9 w-9 items-center justify-center rounded-[9px] bg-blue-600 text-white hover:bg-blue-700">
                <Plus size={16} />
              </button>
            </form>

            {categories.length === 0 ? (
              <p className="py-4 text-center text-[13px] text-fg-muted">Kateqoriya yoxdur.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {categories.map((cat) => (
                  <div key={cat.id}>
                    <div className="mb-1 flex items-center gap-2 text-[13.5px] font-semibold text-fg">
                      <Package size={14} className="text-fg-muted" /> {cat.name}
                    </div>
                    <ul className="ml-1 flex flex-col gap-0.5">
                      {cat.topics.map((t) => {
                        const active = selectedTopic === t.id;
                        return (
                          <li key={t.id}>
                            <button
                              onClick={() => setSelectedTopic(t.id)}
                              className={cn(
                                "flex w-full items-center justify-between rounded-[8px] px-2.5 py-1.5 text-left text-[13px] transition-colors",
                                active ? "bg-blue-600 font-medium text-white" : "text-fg-muted hover:bg-surface-2",
                              )}
                            >
                              <span>{t.name}</span>
                              {counts[t.id] != null && (
                                <span className={cn("num text-[11px]", active ? "text-white/80" : "text-fg-faint")}>{counts[t.id]}</span>
                              )}
                            </button>
                          </li>
                        );
                      })}
                      <li>
                        {addingTopic === cat.id ? (
                          <form onSubmit={(e) => createTopic(e, cat.id)} className="mt-1 flex flex-col gap-1.5">
                            <input autoFocus className="field !h-8 text-[13px]" placeholder="Mövzu adı…" value={newTopic} onChange={(e) => setNewTopic(e.target.value)} required />
                            <div className="flex gap-1.5">
                              <button type="submit" className="flex-1 rounded-[7px] bg-blue-600 py-1 text-[12px] font-medium text-white">Yadda saxla</button>
                              <button type="button" onClick={() => { setAddingTopic(null); setNewTopic(""); }} className="flex-1 rounded-[7px] border border-line py-1 text-[12px] text-fg-muted">Ləğv</button>
                            </div>
                          </form>
                        ) : (
                          <button onClick={() => setAddingTopic(cat.id)} className="mt-0.5 px-2.5 text-[12px] font-medium text-blue-600 hover:underline">+ Mövzu</button>
                        )}
                      </li>
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Questions */}
          <Card className="p-0">
            <div className="border-b border-line px-5 py-4">
              <h3 className="text-[16px] font-semibold text-fg">{activeTopic ? activeTopic.name : "Mövzu seçin"}</h3>
              {activeTopic && <p className="num mt-0.5 text-[12.5px] text-fg-muted">{questions.length} sual</p>}
            </div>

            {loadingQ ? (
              <Loading />
            ) : !selectedTopic ? (
              <EmptyState icon={<FolderTree size={22} />} title="Mövzu seçin" description="Sualları görmək üçün soldan mövzu seçin." />
            ) : questions.length === 0 ? (
              <EmptyState icon={<Package size={22} />} title="Sual yoxdur" description="Bu mövzuda hələ sual yoxdur." />
            ) : (
              <div className="flex flex-col gap-2.5 p-4">
                {questions.map((q) => (
                  <div key={q.id} className="flex items-start gap-3 rounded-[11px] border border-line p-4">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex flex-wrap items-center gap-2">
                        <span className="num text-[11px] font-semibold text-fg-faint">#{q.id}</span>
                        <span className="rounded-[6px] bg-blue-50 px-2 py-0.5 text-[11.5px] font-semibold text-blue-700">{questionTypeLabel(q.type)}</span>
                        <span className="num rounded-[6px] bg-slate-100 px-2 py-0.5 text-[11.5px] font-semibold text-slate-600 dark:bg-surface-2">{q.score} bal</span>
                        {!q.isActive && <span className="rounded-[6px] bg-slate-100 px-2 py-0.5 text-[11.5px] text-slate-500">Deaktiv</span>}
                      </div>
                      <p className="text-[14px] font-medium text-fg">{q.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
