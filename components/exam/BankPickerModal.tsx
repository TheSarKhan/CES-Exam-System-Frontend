"use client";

import React, { useEffect, useMemo, useState } from "react";
import { X, Search, Check, Library, Shuffle, ListChecks, Eraser } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Difficulty, Question } from "@/lib/types";
import { loadTopicOptions, DIFFICULTY_META, type TopicOption } from "@/lib/questionBank";
import { questionTypeLabel } from "@/components/exam/QuestionInput";
import { Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Loading, EmptyState } from "@/components/ui/Feedback";
import { cn } from "@/lib/cn";

function uniqueBy<T, K>(arr: T[], key: (t: T) => K): T[] {
  const seen = new Set<K>();
  const out: T[] = [];
  for (const item of arr) {
    const k = key(item);
    if (!seen.has(k)) { seen.add(k); out.push(item); }
  }
  return out;
}

const TYPE_FILTERS = [
  { value: "ALL", label: "Bütün tiplər" },
  { value: "SINGLE_CHOICE", label: "Tək seçim" },
  { value: "MULTIPLE_CHOICE", label: "Çox seçim" },
  { value: "TRUE_FALSE", label: "Doğru / Yanlış" },
  { value: "SHORT_TEXT", label: "Qısa mətn" },
  { value: "LONG_TEXT", label: "Uzun mətn" },
];

const RANDOM_N = 10;

interface BankPickerModalProps {
  open: boolean;
  onClose: () => void;
  onAdd: (questions: Question[]) => void;
  excludeIds?: number[];
}

export function BankPickerModal({ open, onClose, onAdd, excludeIds = [] }: BankPickerModalProps) {
  const [opts, setOpts] = useState<TopicOption[] | null>(null);
  const [deptId, setDeptId] = useState<number | "">("");
  const [catId, setCatId] = useState<number | "">("");
  const [topicId, setTopicId] = useState<number | "">("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loadingQ, setLoadingQ] = useState(false);
  const [selected, setSelected] = useState<Record<number, Question>>({});
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [diffFilter, setDiffFilter] = useState<Difficulty | "ALL">("ALL");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || opts) return;
    loadTopicOptions()
      .then((o) => {
        setOpts(o);
        const d = o[0]?.departmentId ?? "";
        const c = o.find((t) => t.departmentId === d)?.categoryId ?? "";
        const t = o.find((x) => x.categoryId === c)?.topicId ?? "";
        setDeptId(d); setCatId(c); setTopicId(t);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Sual bankı yüklənmədi"));
  }, [open, opts]);

  useEffect(() => {
    if (!topicId) { setQuestions([]); return; }
    setLoadingQ(true);
    apiFetch<Question[]>(`/api/v1/question-bank/topics/${topicId}/questions`)
      .then(setQuestions)
      .catch((e) => setError(e instanceof Error ? e.message : "Suallar yüklənmədi"))
      .finally(() => setLoadingQ(false));
  }, [topicId]);

  const departments = useMemo(() => uniqueBy(opts ?? [], (t) => t.departmentId), [opts]);
  const categories = useMemo(
    () => uniqueBy((opts ?? []).filter((t) => t.departmentId === deptId), (t) => t.categoryId),
    [opts, deptId],
  );
  const topics = useMemo(() => (opts ?? []).filter((t) => t.categoryId === catId), [opts, catId]);

  const onDept = (d: number) => {
    setDeptId(d);
    const c = (opts ?? []).find((t) => t.departmentId === d)?.categoryId ?? "";
    setCatId(c);
    setTopicId((opts ?? []).find((t) => t.categoryId === c)?.topicId ?? "");
  };
  const onCat = (c: number) => {
    setCatId(c);
    setTopicId((opts ?? []).find((t) => t.categoryId === c)?.topicId ?? "");
  };

  const toggle = (q: Question) =>
    setSelected((prev) => {
      const next = { ...prev };
      if (next[q.id]) delete next[q.id];
      else next[q.id] = q;
      return next;
    });

  const visible = useMemo(() => {
    const s = search.trim().toLowerCase();
    return questions.filter(
      (q) =>
        (typeFilter === "ALL" || q.type === typeFilter) &&
        (diffFilter === "ALL" || q.difficulty === diffFilter) &&
        (!s || q.text.toLowerCase().includes(s)),
    );
  }, [questions, search, typeFilter, diffFilter]);

  // questions in the current filter that are still addable (not already in the exam)
  const addable = useMemo(() => visible.filter((q) => !excludeIds.includes(q.id)), [visible, excludeIds]);

  const selectAllFiltered = () =>
    setSelected((prev) => {
      const next = { ...prev };
      addable.forEach((q) => { next[q.id] = q; });
      return next;
    });

  const pickRandom = () =>
    setSelected((prev) => {
      const pool = addable.filter((q) => !prev[q.id]);
      for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pool[i], pool[j]] = [pool[j], pool[i]];
      }
      const next = { ...prev };
      pool.slice(0, RANDOM_N).forEach((q) => { next[q.id] = q; });
      return next;
    });

  const selectedCount = Object.keys(selected).length;

  const confirm = () => {
    onAdd(Object.values(selected));
    setSelected({});
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="flex max-h-[88vh] w-full max-w-[700px] flex-col overflow-hidden rounded-[16px] bg-surface shadow-[0_12px_32px_rgba(15,23,42,0.18)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-blue-50 text-blue-600 dark:bg-blue-600/10"><Library size={18} /></div>
            <h3 className="text-[16px] font-semibold text-fg">Bankdan sual seç</h3>
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-fg-muted hover:text-fg"><X size={18} /></button>
        </div>

        {/* cascade + filters */}
        <div className="border-b border-line px-5 py-3">
          {error && <p className="mb-2 text-[12.5px] text-danger-fg">{error}</p>}
          {!opts ? (
            <Loading />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                <Select value={deptId} onChange={(e) => onDept(Number(e.target.value))}>
                  {departments.length === 0 && <option value="">Şöbə yoxdur</option>}
                  {departments.map((d) => <option key={d.departmentId} value={d.departmentId}>{d.departmentName}</option>)}
                </Select>
                <Select value={catId} onChange={(e) => onCat(Number(e.target.value))}>
                  {categories.length === 0 && <option value="">Kateqoriya yoxdur</option>}
                  {categories.map((c) => <option key={c.categoryId} value={c.categoryId}>{c.categoryName}</option>)}
                </Select>
                <Select value={topicId} onChange={(e) => setTopicId(Number(e.target.value))}>
                  {topics.length === 0 && <option value="">Mövzu yoxdur</option>}
                  {topics.map((t) => <option key={t.topicId} value={t.topicId}>{t.topicName}</option>)}
                </Select>
              </div>
              <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                <div className="relative flex-1">
                  <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input className="field !h-9 w-full pl-9 text-[13px]" placeholder="Sual axtar…" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <select className="field !h-9 !w-auto appearance-none pr-7 text-[13px]" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                  {TYPE_FILTERS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                <select className="field !h-9 !w-auto appearance-none pr-7 text-[13px]" value={diffFilter} onChange={(e) => setDiffFilter(e.target.value as Difficulty | "ALL")}>
                  <option value="ALL">Bütün səviyyələr</option>
                  <option value="EASY">Asan</option>
                  <option value="MEDIUM">Orta</option>
                  <option value="HARD">Çətin</option>
                </select>
              </div>
              {/* bulk actions */}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <button type="button" onClick={selectAllFiltered} disabled={addable.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-[8px] border border-line px-2.5 py-1.5 text-[12.5px] font-medium text-fg-muted hover:bg-surface-2 disabled:opacity-40">
                  <ListChecks size={14} /> Filtrlənənləri seç ({addable.length})
                </button>
                <button type="button" onClick={pickRandom} disabled={addable.length === 0}
                  className="inline-flex items-center gap-1.5 rounded-[8px] border border-line px-2.5 py-1.5 text-[12.5px] font-medium text-fg-muted hover:bg-surface-2 disabled:opacity-40">
                  <Shuffle size={14} /> Random {RANDOM_N}
                </button>
                {selectedCount > 0 && (
                  <button type="button" onClick={() => setSelected({})}
                    className="inline-flex items-center gap-1.5 rounded-[8px] px-2.5 py-1.5 text-[12.5px] font-medium text-danger hover:bg-danger-bg">
                    <Eraser size={14} /> Təmizlə
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* question list */}
        <div className="min-h-[180px] flex-1 overflow-y-auto px-5 py-3">
          {loadingQ ? (
            <Loading />
          ) : !topicId ? (
            <EmptyState icon={<Library size={20} />} title="Mövzu seçin" description="Sualları görmək üçün mövzu seçin." />
          ) : visible.length === 0 ? (
            <EmptyState icon={<Library size={20} />} title="Sual yoxdur" description="Bu filtrlərə uyğun sual tapılmadı." />
          ) : (
            <div className="flex flex-col gap-2">
              {visible.map((q) => {
                const added = excludeIds.includes(q.id);
                const isSel = !!selected[q.id];
                const diff = DIFFICULTY_META[q.difficulty] ?? DIFFICULTY_META.MEDIUM;
                return (
                  <button
                    key={q.id}
                    type="button"
                    disabled={added}
                    onClick={() => toggle(q)}
                    className={cn(
                      "flex items-start gap-3 rounded-[11px] border p-3 text-left transition-colors",
                      added ? "cursor-not-allowed border-line bg-surface-2 opacity-60"
                        : isSel ? "border-blue-500 bg-blue-50/60 dark:bg-blue-600/10"
                          : "border-line hover:border-blue-200 hover:bg-blue-50/30 dark:hover:bg-surface-2",
                    )}
                  >
                    <span className={cn(
                      "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border-2",
                      isSel ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300",
                    )}>
                      {isSel && <Check size={13} />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-1.5">
                        <span className="rounded-[6px] bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-600/10">{questionTypeLabel(q.type)}</span>
                        <span className={cn("rounded-[6px] px-1.5 py-0.5 text-[11px] font-semibold", diff.cls)}>{diff.label}</span>
                        <span className="num rounded-[6px] bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600 dark:bg-surface-2">{q.score} bal</span>
                        {added && <span className="text-[11px] font-medium text-success-fg">✓ Əlavə edilib</span>}
                      </div>
                      <p className="text-[13.5px] text-fg">{q.text}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* footer */}
        <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3.5">
          <span className="text-[13px] text-fg-muted">{selectedCount > 0 ? <>Seçilib: <b className="num text-fg">{selectedCount}</b></> : "Sual seçilməyib"}</span>
          <div className="flex gap-2.5">
            <Button variant="secondary" onClick={onClose}>Bağla</Button>
            <Button onClick={confirm} disabled={selectedCount === 0}>İmtahana əlavə et</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
