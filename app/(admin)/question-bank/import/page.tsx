"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUpFromLine, FileText, FileSpreadsheet, Check, X, AlertTriangle, CheckCircle2, Link2, Image as ImageIcon } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { loadTopicOptions, type TopicOption } from "@/lib/questionBank";
import type { Difficulty, BulkImportResult } from "@/lib/types";
import { parseCsv } from "@/lib/csv";
import { parseExcelToRows, downloadExcelTemplate } from "@/lib/excel";
import { Card } from "@/components/ui/Card";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { Loading } from "@/components/ui/Feedback";
import { questionTypeLabel } from "@/components/exam/QuestionInput";
import { DIFFICULTY_META } from "@/lib/questionBank";
import { cn } from "@/lib/cn";

const TYPE_MAP: Record<string, string> = {
  SINGLE_CHOICE: "SINGLE_CHOICE", SINGLE: "SINGLE_CHOICE", "TƏK SEÇIM": "SINGLE_CHOICE",
  MULTIPLE_CHOICE: "MULTIPLE_CHOICE", MULTIPLE: "MULTIPLE_CHOICE", "ÇOX SEÇIM": "MULTIPLE_CHOICE",
  TRUE_FALSE: "TRUE_FALSE", TF: "TRUE_FALSE", "DOĞRU/YANLIŞ": "TRUE_FALSE",
  SHORT_TEXT: "SHORT_TEXT", SHORT: "SHORT_TEXT", "QISA MƏTN": "SHORT_TEXT",
  LONG_TEXT: "LONG_TEXT", LONG: "LONG_TEXT", "UZUN MƏTN": "LONG_TEXT",
};
const DIFF_MAP: Record<string, Difficulty> = {
  EASY: "EASY", ASAN: "EASY", MEDIUM: "MEDIUM", ORTA: "MEDIUM", HARD: "HARD", "ÇƏTIN": "HARD",
};
const TRUE_VALUES = new Set(["A", "DOĞRU", "DOGRU", "TRUE", "1", "BƏLI", "YES"]);
const CHOICE_TYPES = new Set(["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE"]);

interface Draft {
  row: number;
  type: string | null;
  text: string;
  difficulty: Difficulty;
  score: number;
  options?: { text: string; isCorrect: boolean; sortOrder: number }[];
  imageUrl?: string;
  error?: string;
  /** Non-blocking issue — row is still importable, just flagged (e.g. no correct answer marked). */
  warning?: string;
}

function parseCorrect(raw: string): Set<string> {
  const set = new Set<string>();
  raw.split(/[,;| ]+/).forEach((tok) => {
    const t = tok.trim().toUpperCase();
    if (/^[A-E]$/.test(t)) set.add(t);
    else if (/^[1-5]$/.test(t)) set.add(String.fromCharCode(64 + Number(t)));
  });
  return set;
}

function buildDraft(cells: string[], row: number): Draft {
  const get = (i: number) => (cells[i] ?? "").trim();
  const rawType = get(0).toUpperCase().replace(/\s+/g, "_");
  const type = TYPE_MAP[rawType] ?? TYPE_MAP[get(0).trim().toUpperCase()] ?? null;
  const text = get(1);
  const rawDiff = get(2).toUpperCase();
  const difficulty = DIFF_MAP[rawDiff] ?? "MEDIUM";
  const scoreRaw = get(3);
  const score = scoreRaw === "" ? 1 : Number(scoreRaw.replace(",", "."));
  const imageUrl = get(9);
  const d: Draft = { row, type, text, difficulty, score };
  if (imageUrl) d.imageUrl = imageUrl;

  if (!type) { d.error = `Tip tanınmadı: "${get(0)}"`; return d; }
  if (!text) { d.error = "Sual mətni boşdur"; return d; }
  if (rawDiff && !DIFF_MAP[rawDiff]) { d.error = `Çətinlik tanınmadı: "${get(2)}"`; return d; }
  if (Number.isNaN(score)) { d.error = `Bal rəqəm deyil: "${scoreRaw}"`; return d; }

  const NO_ANSWER_WARNING = "Düzgün cavab qeyd olunmayıb — sual bankına əlavə olunacaq, amma imtahanda istifadə edilə bilməz";

  if (type === "TRUE_FALSE") {
    const correctRaw = get(8).trim().toUpperCase();
    if (!correctRaw) {
      d.options = [
        { text: "Doğru", isCorrect: false, sortOrder: 0 },
        { text: "Yanlış", isCorrect: false, sortOrder: 1 },
      ];
      d.warning = NO_ANSWER_WARNING;
      return d;
    }
    const correctIsTrue = TRUE_VALUES.has(correctRaw);
    const valid = correctIsTrue || ["B", "YANLIŞ", "YANLIS", "FALSE", "0", "XEYR", "NO"].includes(correctRaw);
    if (!valid) { d.error = `Doğru/Yanlış cavabı tanınmadı: "${get(8)}"`; return d; }
    d.options = [
      { text: "Doğru", isCorrect: correctIsTrue, sortOrder: 0 },
      { text: "Yanlış", isCorrect: !correctIsTrue, sortOrder: 1 },
    ];
    return d;
  }

  if (type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE") {
    const correct = parseCorrect(get(8));
    const opts: Draft["options"] = [];
    [4, 5, 6, 7].forEach((col, idx) => {
      const t = get(col);
      if (t) {
        const letter = String.fromCharCode(65 + idx);
        opts!.push({ text: t, isCorrect: correct.has(letter), sortOrder: opts!.length });
      }
    });
    if (opts.length < 2) { d.error = "Ən azı 2 variant lazımdır"; return d; }
    const nCorrect = opts.filter((o) => o.isCorrect).length;
    if (type === "SINGLE_CHOICE" && nCorrect > 1) { d.error = "Tək seçimdə birdən çox düzgün variant ola bilməz"; return d; }
    d.options = opts;
    if (nCorrect < 1) d.warning = NO_ANSWER_WARNING;
    return d;
  }

  // SHORT_TEXT / LONG_TEXT — no options
  return d;
}

export default function ImportQuestionsPage() {
  const router = useRouter();
  const [topicOptions, setTopicOptions] = useState<TopicOption[] | null>(null);
  const [topicId, setTopicId] = useState<number | "">("");
  const [csvText, setCsvText] = useState("");
  // When an Excel file is loaded its parsed rows take precedence over the textarea.
  const [sheetRows, setSheetRows] = useState<string[][] | null>(null);
  const [sheetName, setSheetName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<BulkImportResult | null>(null);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<"file" | "link">("file");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkWarnings, setLinkWarnings] = useState<string[]>([]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("topicId");
    if (t) setTopicId(Number(t));
    loadTopicOptions()
      .then(setTopicOptions)
      .catch((e) => setError(e instanceof Error ? e.message : "Mövzular yüklənmədi"));
  }, []);

  const drafts = useMemo<Draft[]>(() => {
    const rows = sheetRows ?? (csvText.trim() ? parseCsv(csvText) : []);
    if (rows.length === 0) return [];
    // skip a header row if present
    const start = (rows[0][0] ?? "").trim().toLowerCase() === "type" ? 1 : 0;
    return rows.slice(start).map((cells, i) => buildDraft(cells, i + 1));
  }, [csvText, sheetRows]);

  const valid = drafts.filter((d) => !d.error);
  const invalid = drafts.filter((d) => d.error);

  // Row-level import selection — every non-error row starts checked; the user
  // can uncheck any it doesn't want (including rows with no correct answer marked).
  // Reset explicitly wherever a new source is loaded (see onFile/onImportLink/clearSheet).
  const [unchecked, setUnchecked] = useState<Set<number>>(new Set());
  const toggleSelect = (row: number) => {
    setUnchecked((prev) => {
      const next = new Set(prev);
      if (next.has(row)) next.delete(row); else next.add(row);
      return next;
    });
  };
  const selected = valid.filter((d) => !unchecked.has(d.row));

  const onFile = async (file: File) => {
    setError("");
    const isExcel = /\.xlsx?$/i.test(file.name);
    if (isExcel) {
      try {
        const rows = await parseExcelToRows(file);
        if (rows.length === 0) { setError("Excel faylında məlumat tapılmadı."); return; }
        setSheetRows(rows);
        setSheetName(file.name);
        setCsvText("");
        setUnchecked(new Set());
      } catch (e) {
        setError(e instanceof Error ? e.message : "Excel oxunmadı");
      }
      return;
    }
    // CSV → read as text into the textarea
    const reader = new FileReader();
    reader.onload = () => { setSheetRows(null); setSheetName(""); setCsvText(String(reader.result ?? "")); setUnchecked(new Set()); };
    reader.readAsText(file);
  };

  const clearSheet = () => { setSheetRows(null); setSheetName(""); setLinkWarnings([]); setUnchecked(new Set()); };

  const onImportLink = async () => {
    const url = linkUrl.trim();
    if (!url) return;
    setError("");
    setLinkWarnings([]);
    setLinkLoading(true);
    try {
      const res = await fetch("/api/forms-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Link oxuna bilmədi");
      setSheetRows(data.rows as string[][]);
      setSheetName(data.provider === "google" ? "Google Forms idxalı" : "Microsoft Forms idxalı");
      setCsvText("");
      setUnchecked(new Set());
      setLinkWarnings(data.warnings ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Link oxuna bilmədi");
    } finally {
      setLinkLoading(false);
    }
  };

  const toggleCorrect = (d: Draft, letter: string) => {
    if (!sheetRows) return;
    const start = (sheetRows[0]?.[0] ?? "").trim().toLowerCase() === "type" ? 1 : 0;
    const idx = start + d.row - 1;
    const row = sheetRows[idx];
    if (!row) return;
    const next = row.slice();
    while (next.length < 9) next.push("");
    if (d.type === "TRUE_FALSE") {
      next[8] = letter;
    } else if (d.type === "SINGLE_CHOICE") {
      next[8] = letter;
    } else if (d.type === "MULTIPLE_CHOICE") {
      const current = parseCorrect(next[8] ?? "");
      if (current.has(letter)) current.delete(letter);
      else current.add(letter);
      next[8] = Array.from(current).sort().join(" ");
    } else {
      return;
    }
    const updated = sheetRows.slice();
    updated[idx] = next;
    setSheetRows(updated);
  };

  const doImport = async () => {
    if (topicId === "" || selected.length === 0) return;
    setSubmitting(true);
    setError("");
    try {
      const body = {
        topicId,
        questions: selected.map((d) => ({
          topicId,
          type: d.type,
          text: d.text,
          score: d.score,
          difficulty: d.difficulty,
          options: d.options,
          imageUrl: d.imageUrl,
        })),
      };
      const res = await apiFetch<BulkImportResult>("/api/v1/question-bank/questions/bulk", {
        method: "POST",
        body: JSON.stringify(body),
      });
      setResult(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "İdxal alınmadı");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[960px]">
      <Link href="/question-bank" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-fg-muted hover:text-fg">
        <ArrowLeft size={15} /> Sual bankına qayıt
      </Link>
      <h2 className="mb-1 flex items-center gap-2 text-[22px] font-bold tracking-[-0.4px] text-fg">
        <ArrowUpFromLine size={20} className="text-blue-600" /> Toplu idxal
      </h2>
      <p className="mb-5 text-[13.5px] text-fg-muted">CSV faylından bir mövzuya çoxlu sualı bir anda əlavə edin.</p>

      {error && <div className="mb-4 rounded-[11px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-danger-fg">{error}</div>}

      {result ? (
        <Card className="flex flex-col items-center gap-4 p-8 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-success-bg text-success-fg"><CheckCircle2 size={32} /></span>
          <div>
            <h3 className="text-[18px] font-semibold text-fg">{result.created} sual idxal edildi</h3>
            {result.errors.length > 0 && (
              <p className="mt-1 text-[13px] text-amber-600">{result.errors.length} sətir xəta səbəbindən keçildi.</p>
            )}
          </div>
          {result.errors.length > 0 && (
            <div className="w-full max-w-[520px] rounded-[11px] border border-amber-200 bg-amber-50 p-3 text-left dark:border-amber-500/20 dark:bg-amber-500/10">
              {result.errors.map((e, i) => (
                <div key={i} className="text-[12.5px] text-amber-800 dark:text-amber-300"><b>Sətir {e.row}:</b> {e.message}</div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <Link href="/question-bank" className={buttonClasses("primary", "md")}>Sual bankına keç</Link>
            <Button variant="outline" onClick={() => { setResult(null); setCsvText(""); clearSheet(); }}>Yenidən idxal</Button>
          </div>
        </Card>
      ) : !topicOptions ? (
        <Loading />
      ) : (
        <div className="flex flex-col gap-5">
          {/* Step 1: topic */}
          <Card className="p-5">
            <h3 className="mb-3 text-[14px] font-semibold text-fg">1. Mövzu seçin</h3>
            <Select value={topicId} onChange={(e) => setTopicId(e.target.value ? Number(e.target.value) : "")}>
              <option value="">Mövzu seçin…</option>
              {topicOptions.map((t) => (
                <option key={t.topicId} value={t.topicId}>{t.departmentName} / {t.categoryName} / {t.topicName}</option>
              ))}
            </Select>
          </Card>

          {/* Step 2: source */}
          <Card className="p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-[14px] font-semibold text-fg">2. Suallar (Excel, CSV və ya Forms linki)</h3>
              {!sheetRows && (
                <div className="flex rounded-[9px] border border-line bg-surface-2 p-0.5 text-[12.5px]">
                  <button
                    type="button"
                    onClick={() => setMode("file")}
                    className={cn("rounded-[7px] px-3 py-1.5 font-medium transition-colors", mode === "file" ? "bg-surface text-fg shadow-sm" : "text-fg-muted")}
                  >
                    Fayl
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("link")}
                    className={cn("rounded-[7px] px-3 py-1.5 font-medium transition-colors", mode === "link" ? "bg-surface text-fg shadow-sm" : "text-fg-muted")}
                  >
                    Google/MS Forms linki
                  </button>
                </div>
              )}
            </div>

            {sheetRows ? (
              <div className="flex items-center justify-between gap-3 rounded-[10px] border border-line bg-surface-2 px-4 py-3">
                <span className="flex items-center gap-2 text-[13px] text-fg">
                  <FileSpreadsheet size={16} className="text-emerald-600" />
                  <b className="truncate">{sheetName}</b> · {drafts.length} sətir yükləndi
                </span>
                <button onClick={clearSheet} className="shrink-0 text-[13px] font-medium text-fg-muted hover:text-danger">Təmizlə</button>
              </div>
            ) : mode === "link" ? (
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-2">
                  <input
                    className="field min-w-0 flex-1"
                    placeholder="https://docs.google.com/forms/d/e/... və ya https://forms.office.com/..."
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                  />
                  <Button icon={<Link2 size={15} />} loading={linkLoading} disabled={!linkUrl.trim()} onClick={onImportLink}>
                    Linki oxu
                  </Button>
                </div>
                {linkWarnings.length > 0 && (
                  <div className="rounded-[9px] border border-amber-200 bg-amber-50 px-3 py-2 text-[11.5px] leading-relaxed text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                    {linkWarnings.map((w, i) => <div key={i}>{w}</div>)}
                  </div>
                )}
                <div className="rounded-[9px] bg-surface-2 px-3 py-2 text-[11.5px] leading-relaxed text-fg-muted">
                  Formun paylaşım ayarında ictimai giriş aktiv olmalıdır. <b>Düzgün cavablar formdan çıxarıla bilmir</b> — aşağıdakı önizləmədə variant çipinə klikləyib işarələyin, ya da bunsuz idxal edin (belə suallar bankda “Cavabsız” işarəsi ilə görünür və imtahanda istifadə olunmur, sonra tamamlaya bilərsiniz). Checkbox ilə istəmədiyiniz sualları seçimdən çıxara bilərsiniz.
                </div>
              </div>
            ) : (
              <>
                <div className="mb-3 flex flex-wrap gap-2">
                  <Button icon={<FileSpreadsheet size={15} />} onClick={() => downloadExcelTemplate()}>Excel şablon</Button>
                  <Button variant="outline" icon={<FileText size={15} />} onClick={() => fileRef.current?.click()}>Fayl seç</Button>
                  <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv,text/csv" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = ""; }} />
                </div>
                <textarea
                  className="field min-h-[150px] w-full font-mono text-[12.5px]"
                  placeholder="Excel faylı seçin (tövsiyə) — və ya CSV-ni bura yapışdırın…"
                  value={csvText}
                  onChange={(e) => { setCsvText(e.target.value); setUnchecked(new Set()); }}
                />
                <div className="mt-2 rounded-[9px] bg-surface-2 px-3 py-2 text-[11.5px] leading-relaxed text-fg-muted">
                  <b>Excel-də</b> hər sahə ayrı xanadır — sual mətnində vergül (,) problem yaratmır; <b>type</b> və <b>difficulty</b> açılan siyahıdan seçilir.<br />
                  <b>Sütunlar:</b> type, text, difficulty, score, optionA–D, correct. <b>difficulty:</b> EASY/MEDIUM/HARD (boş = Orta).
                  <b> correct:</b> seçim üçün hərf(lər) (A, və ya çoxlu seçimdə “A C”); Doğru/Yanlış üçün A=Doğru, B=Yanlış; mətn tipləri üçün boş. Boş buraxsanız sual “Cavabsız” işarəsi ilə əlavə olunur.
                </div>
              </>
            )}
          </Card>

          {/* Step 3: preview */}
          {drafts.length > 0 && (
            <Card className="p-0">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
                <h3 className="text-[14px] font-semibold text-fg">3. Önizləmə</h3>
                <div className="flex items-center gap-3 text-[12.5px]">
                  <span className="inline-flex items-center gap-1 text-success-fg"><Check size={14} /> {selected.length} seçili</span>
                  {invalid.length > 0 && <span className="inline-flex items-center gap-1 text-danger-fg"><X size={14} /> {invalid.length} xəta</span>}
                </div>
              </div>
              <div className="max-h-[420px] overflow-auto">
                <table className="w-full text-left text-[12.5px]">
                  <thead className="sticky top-0 bg-surface-2">
                    <tr>
                      {["", "#", "Tip", "Sual", "Çətinlik", "Bal", "Variant", "Status"].map((h, i) => (
                        <th key={i} className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-fg-faint">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {drafts.map((d) => (
                      <tr key={d.row} className={cn("border-b border-line", d.error && "bg-danger-bg/40", !d.error && d.warning && "bg-amber-50/60 dark:bg-amber-500/5")}>
                        <td className="px-4 py-2.5">
                          <input
                            type="checkbox"
                            checked={!d.error && !unchecked.has(d.row)}
                            disabled={!!d.error}
                            onChange={() => toggleSelect(d.row)}
                          />
                        </td>
                        <td className="num px-4 py-2.5 text-fg-faint">{d.row}</td>
                        <td className="px-4 py-2.5">{d.type ? questionTypeLabel(d.type) : <span className="text-danger-fg">—</span>}</td>
                        <td className="max-w-[280px] truncate px-4 py-2.5 text-fg">
                          {d.text || <span className="text-fg-faint">(boş)</span>}
                          {d.imageUrl && <ImageIcon size={12} className="ml-1.5 inline text-blue-500" aria-label={d.imageUrl} />}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={cn("rounded-[5px] px-1.5 py-0.5 text-[11px] font-semibold", DIFFICULTY_META[d.difficulty]?.cls)}>{DIFFICULTY_META[d.difficulty]?.label}</span>
                        </td>
                        <td className="num px-4 py-2.5">{d.score}</td>
                        <td className="px-4 py-2.5">
                          {d.options ? (
                            <div className="flex flex-wrap gap-1">
                              {d.options.map((o, i) => {
                                const letter = String.fromCharCode(65 + i);
                                return (
                                  <button
                                    key={i}
                                    type="button"
                                    disabled={!sheetRows}
                                    title={o.text}
                                    onClick={() => toggleCorrect(d, letter)}
                                    className={cn(
                                      "rounded-[5px] border px-1.5 py-0.5 text-[11px] font-semibold",
                                      o.isCorrect ? "border-success-fg/40 bg-success-bg text-success-fg" : "border-line bg-surface-2 text-fg-muted",
                                      sheetRows ? "cursor-pointer hover:opacity-80" : "cursor-default",
                                    )}
                                  >
                                    {letter}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <span className="text-fg-muted">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          {d.error
                            ? <span className="inline-flex items-center gap-1 text-danger-fg"><AlertTriangle size={12} /> {d.error}</span>
                            : d.warning
                            ? <span className="inline-flex items-center gap-1 text-amber-600" title={d.warning}><AlertTriangle size={12} /> Cavabsız</span>
                            : <span className="inline-flex items-center gap-1 text-success-fg"><Check size={12} /> Hazır</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-4">
                <p className="text-[12.5px] text-fg-muted">
                  {topicId === "" ? "İdxal üçün əvvəlcə mövzu seçin." : `${selected.length} sual idxal olunacaq${invalid.length ? `, ${invalid.length} keçiləcək` : ""}.`}
                </p>
                <Button icon={<ArrowUpFromLine size={16} />} loading={submitting} disabled={topicId === "" || selected.length === 0} onClick={doImport}>
                  İdxal et{selected.length > 0 ? ` (${selected.length})` : ""}
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
