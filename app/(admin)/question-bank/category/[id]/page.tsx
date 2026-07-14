"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Package, Plus, Pencil, Trash2, Search, Layers, HelpCircle, X,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { humanizeError } from "@/lib/errors";
import type { Category, Difficulty, Question, Topic } from "@/lib/types";
import { DIFFICULTY_META } from "@/lib/questionBank";
import { Table, Tr, Td } from "@/components/ui/Table";
import { Button, buttonClasses } from "@/components/ui/Button";
import { FieldGroup, Input } from "@/components/ui/Field";
import { Loading, EmptyState, Modal } from "@/components/ui/Feedback";
import { nameError } from "@/lib/validate";
import { questionTypeLabel } from "@/components/exam/QuestionInput";
import { cn } from "@/lib/cn";

type DeleteTarget =
  | { kind: "topic"; id: number; name: string }
  | { kind: "question"; id: number; name: string };

export default function CategoryDetailPage() {
  const params = useParams();
  const categoryId = Number(params.id);
  const toast = useToast();

  const [category, setCategory] = useState<Category | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [topicFilter, setTopicFilter] = useState<number | "ALL">("ALL");
  const [search, setSearch] = useState("");
  const [diffFilter, setDiffFilter] = useState<Difficulty | "ALL">("ALL");

  const [topicOpen, setTopicOpen] = useState(false);
  const [newTopic, setNewTopic] = useState("");
  const [savingTopic, setSavingTopic] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      const [cat, tps, qs] = await Promise.all([
        apiFetch<Category>(`/api/v1/question-bank/categories/${categoryId}`),
        apiFetch<Topic[]>(`/api/v1/question-bank/categories/${categoryId}/topics`),
        apiFetch<Question[]>(`/api/v1/question-bank/categories/${categoryId}/questions`),
      ]);
      setCategory(cat);
      setTopics(tps);
      setQuestions(qs);
      setError("");
    } catch (e) {
      setError(humanizeError(e, "Kateqoriya yüklənmədi"));
    } finally {
      setLoading(false);
    }
  }, [categoryId]);

  useEffect(() => { load(); }, [load]);

  const topicName = useMemo(() => {
    const m = new Map<number, string>();
    topics.forEach((t) => m.set(t.id, t.name));
    return m;
  }, [topics]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return questions.filter(
      (qq) =>
        (topicFilter === "ALL" || qq.topicId === topicFilter) &&
        (diffFilter === "ALL" || qq.difficulty === diffFilter) &&
        (!q || qq.text.toLowerCase().includes(q)),
    );
  }, [questions, topicFilter, diffFilter, search]);

  const newTopicError = nameError(newTopic, "Mövzu adı");

  const createTopic = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (newTopicError) return toast.error(newTopicError);
    const name = newTopic.trim();
    setSavingTopic(true);
    try {
      await apiFetch("/api/v1/question-bank/topics", {
        method: "POST",
        body: JSON.stringify({ categoryId, name }),
      });
      setNewTopic(""); setTopicOpen(false);
      await load();
      toast.success(`"${name}" mövzusu əlavə edildi`);
    } catch (e) {
      toast.error(humanizeError(e, "Mövzu yaradılmadı"));
    } finally {
      setSavingTopic(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { kind, id, name } = deleteTarget;
    setDeleting(true);
    try {
      await apiFetch(`/api/v1/question-bank/${kind === "topic" ? "topics" : "questions"}/${id}`, { method: "DELETE" });
      setDeleteTarget(null);
      if (kind === "topic" && topicFilter === id) setTopicFilter("ALL");
      await load();
      toast.success(kind === "topic" ? `"${name}" mövzusu silindi` : "Sual silindi");
    } catch (e) {
      toast.error(humanizeError(e, "Silinmədi"));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const createHref = `/question-bank/create?categoryId=${categoryId}${category ? `&departmentId=${category.departmentId}` : ""}${topicFilter !== "ALL" ? `&topicId=${topicFilter}` : ""}`;

  return (
    <div className="mx-auto max-w-[1200px]">
      <Link
        href={category ? `/question-bank/department/${category.departmentId}` : "/question-bank"}
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-fg-muted transition-colors hover:text-fg"
      >
        <ArrowLeft size={15} /> {category ? "Kateqoriyalar" : "Sual bankı"}
      </Link>

      {loading ? (
        <Loading />
      ) : error || !category ? (
        <div className="card p-6 text-center text-[14px] text-danger-fg">{error || "Kateqoriya tapılmadı"}</div>
      ) : (
        <>
          {/* Header */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[13px] bg-blue-50 text-blue-600 dark:bg-blue-600/15 dark:text-blue-400">
                <Package size={22} />
              </span>
              <div>
                <h2 className="text-[22px] font-bold tracking-[-0.4px] text-fg">{category.name}</h2>
                <p className="mt-0.5 flex items-center gap-3 text-[13px] text-fg-muted">
                  <span>{category.departmentName}</span>
                  <span className="inline-flex items-center gap-1"><Layers size={13} className="text-fg-faint" /> {topics.length} mövzu</span>
                  <span className="inline-flex items-center gap-1"><HelpCircle size={13} className="text-fg-faint" /> {questions.length} sual</span>
                </p>
              </div>
            </div>
            <Link
              href={createHref}
              className={cn(buttonClasses("primary", "md"), topics.length === 0 && "pointer-events-none opacity-50")}
              title={topics.length === 0 ? "Əvvəlcə mövzu əlavə edin" : "Yeni sual"}
            >
              <Plus size={17} /> Yeni sual
            </Link>
          </div>

          {/* Topics row */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button
              onClick={() => setTopicFilter("ALL")}
              className={cn(
                "rounded-full px-3 py-1.5 text-[13px] font-medium transition-colors",
                topicFilter === "ALL" ? "bg-blue-600 text-white" : "bg-surface-2 text-fg-muted hover:text-fg",
              )}
            >
              Bütün mövzular
            </button>
            {topics.map((t) => {
              const active = topicFilter === t.id;
              return (
                <span
                  key={t.id}
                  className={cn(
                    "group inline-flex items-center gap-1 rounded-full py-1.5 pl-3 pr-1.5 text-[13px] font-medium transition-colors",
                    active ? "bg-blue-600 text-white" : "bg-surface-2 text-fg-muted hover:text-fg",
                  )}
                >
                  <button onClick={() => setTopicFilter(t.id)}>{t.name}</button>
                  <button
                    onClick={() => setDeleteTarget({ kind: "topic", id: t.id, name: t.name })}
                    className={cn("rounded-full p-0.5 opacity-0 transition-opacity group-hover:opacity-100", active ? "hover:bg-white/20" : "hover:bg-line")}
                    title="Mövzunu sil"
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}
            <button
              onClick={() => { setNewTopic(""); setTopicOpen(true); }}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-line px-3 py-1.5 text-[13px] font-medium text-blue-600 hover:bg-surface-2 dark:text-blue-400"
            >
              <Plus size={14} /> Mövzu
            </button>
          </div>

          {/* Filters */}
          {questions.length > 0 && (
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="field w-full pl-9 text-[13.5px]" placeholder="Sual mətnində axtar…" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <select className="field !w-auto appearance-none pr-8 text-[13.5px] sm:w-[170px]" value={diffFilter} onChange={(e) => setDiffFilter(e.target.value as Difficulty | "ALL")}>
                <option value="ALL">Bütün səviyyələr</option>
                <option value="EASY">Asan</option>
                <option value="MEDIUM">Orta</option>
                <option value="HARD">Çətin</option>
              </select>
            </div>
          )}

          {/* Questions table */}
          {topics.length === 0 ? (
            <div className="card">
              <EmptyState icon={<Layers size={22} />} title="Mövzu yoxdur" description="Sual əlavə etməzdən əvvəl bu kateqoriyaya ən azı bir mövzu əlavə edin." action={<Button onClick={() => setTopicOpen(true)} icon={<Plus size={16} />}>Mövzu əlavə et</Button>} />
            </div>
          ) : questions.length === 0 ? (
            <div className="card">
              <EmptyState icon={<HelpCircle size={22} />} title="Sual yoxdur" description="Bu kateqoriyada hələ sual yoxdur." action={<Link href={createHref} className={buttonClasses("primary", "sm")}><Plus size={15} /> İlk sualı əlavə et</Link>} />
            </div>
          ) : visible.length === 0 ? (
            <div className="card">
              <EmptyState icon={<Search size={22} />} title="Nəticə yoxdur" description="Filtrə uyğun sual tapılmadı." />
            </div>
          ) : (
            <Table headers={["Sual", "Mövzu", "Tip", "Səviyyə", "Bal", ""]}>
              {visible.map((q) => {
                const diff = DIFFICULTY_META[q.difficulty] ?? DIFFICULTY_META.MEDIUM;
                return (
                  <Tr key={q.id}>
                    <Td className="max-w-[420px]">
                      <div className="flex items-start gap-2">
                        <span className="num mt-0.5 text-[11px] font-semibold text-fg-faint">#{q.id}</span>
                        <div className="min-w-0">
                          <p className="font-medium text-fg">{q.text}</p>
                          {!q.isActive && <span className="mt-1 inline-block rounded-[5px] bg-slate-100 px-1.5 py-0.5 text-[10.5px] text-slate-500 dark:bg-surface-2">Deaktiv</span>}
                        </div>
                      </div>
                    </Td>
                    <Td className="whitespace-nowrap text-[12.5px] text-fg-muted">{q.topicId != null ? topicName.get(q.topicId) ?? "—" : "—"}</Td>
                    <Td className="whitespace-nowrap">
                      <span className="rounded-[6px] bg-blue-50 px-2 py-0.5 text-[11.5px] font-semibold text-blue-700 dark:bg-blue-600/10 dark:text-blue-400">{questionTypeLabel(q.type)}</span>
                    </Td>
                    <Td><span className={cn("rounded-[6px] px-2 py-0.5 text-[11.5px] font-semibold", diff.cls)}>{diff.label}</span></Td>
                    <Td className="num font-semibold text-fg">{q.score}</Td>
                    <Td>
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/question-bank/${q.id}/edit`} className="flex h-8 w-8 items-center justify-center rounded-[8px] text-fg-muted hover:bg-surface-2 hover:text-fg" title="Düzəliş"><Pencil size={15} /></Link>
                        <button onClick={() => setDeleteTarget({ kind: "question", id: q.id, name: q.text })} className="flex h-8 w-8 items-center justify-center rounded-[8px] text-fg-muted hover:bg-danger-bg hover:text-danger" title="Sil"><Trash2 size={15} /></button>
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </Table>
          )}
        </>
      )}

      {/* add topic */}
      <Modal
        open={topicOpen}
        onClose={() => !savingTopic && setTopicOpen(false)}
        icon={<Layers size={18} />}
        title="Yeni mövzu"
        footer={
          <>
            <Button variant="secondary" onClick={() => setTopicOpen(false)} disabled={savingTopic} className="flex-1">Ləğv et</Button>
            <Button onClick={() => createTopic()} loading={savingTopic} disabled={!!newTopicError} className="flex-1">Yarat</Button>
          </>
        }
      >
        <form onSubmit={createTopic} className="mt-1">
          <FieldGroup label="Mövzu adı" error={newTopic.trim() ? newTopicError ?? undefined : undefined}>
            <Input autoFocus value={newTopic} onChange={(e) => setNewTopic(e.target.value)} placeholder="məs. Yanğın təhlükəsizliyi" invalid={!!(newTopic.trim() && newTopicError)} required />
          </FieldGroup>
        </form>
      </Modal>

      {/* delete confirm */}
      <Modal
        open={deleteTarget != null}
        onClose={() => !deleting && setDeleteTarget(null)}
        icon={<Trash2 size={20} />}
        iconTone="red"
        title={deleteTarget?.kind === "topic" ? "Mövzunu sil" : "Sualı sil"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting} className="flex-1">Ləğv et</Button>
            <Button variant="danger" onClick={confirmDelete} loading={deleting} className="flex-1">Sil</Button>
          </>
        }
      >
        <span className="font-medium text-fg">{deleteTarget?.name}</span> silinəcək.
        {deleteTarget?.kind === "topic" ? " İçində suallar varsa, əvvəlcə onları silmək lazımdır." : " Bu əməliyyat geri qaytarıla bilməz."}
      </Modal>
    </div>
  );
}
