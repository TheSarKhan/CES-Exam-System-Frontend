"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Download, Search, ArrowUp, ArrowDown, ChevronsUpDown, ExternalLink } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Department, Exam, ExamReport } from "@/lib/types";
import { PageHeader } from "@/components/app/PageHeader";
import { Card } from "@/components/ui/Card";
import { Tr, Td } from "@/components/ui/Table";
import { FieldGroup, Select, IconInput } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { ResultPill } from "@/components/ui/Badge";
import { Segmented } from "@/components/ui/DataViz";
import { Loading } from "@/components/ui/Feedback";
import { DatePicker } from "@/components/ui/DatePicker";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";

type StatusFilter = "all" | "pass" | "fail" | "survey";
type SortKey = "name" | "exam" | "score" | "date";
type SortDir = "asc" | "desc";

function buildQuery(f: { departmentId: string; examId: string; startDate: string; endDate: string }) {
  const p = new URLSearchParams();
  if (f.departmentId) p.set("departmentId", f.departmentId);
  if (f.examId) p.set("examId", f.examId);
  if (f.startDate) p.set("startDate", `${f.startDate}T00:00:00`);
  if (f.endDate) p.set("endDate", `${f.endDate}T23:59:59`);
  const qs = p.toString();
  return qs ? `?${qs}` : "";
}

function exportCsv(rows: ExamReport[]) {
  const headers = ["Əməkdaş", "E-poçt", "Şöbə", "İmtahan", "Növ", "Bal (%)", "Nəticə", "Başladı", "Bitdi"];
  const lines = rows.map((r) => [
    r.userName, r.userEmail, r.departmentName ?? "", r.examTitle, r.examType === "EXAM" ? "İmtahan" : "Sorğu",
    r.score != null ? String(r.score) : "",
    r.passed == null ? "Sorğu" : r.passed ? "Keçdi" : "Kəsildi",
    r.startTime, r.endTime,
  ]);
  const csv = [headers, ...lines].map((row) => row.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ces-hesabat-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [reports, setReports] = useState<ExamReport[]>([]);
  const [filters, setFilters] = useState({ departmentId: "", examId: "", startDate: "", endDate: "" });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: "date", dir: "desc" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([apiFetch<Department[]>("/api/v1/departments"), apiFetch<Exam[]>("/api/v1/exams")])
      .then(([d, e]) => { setDepartments(d); setExams(e); })
      .catch((e) => setError(e.message));
  }, []);

  const dateRangeInvalid = Boolean(filters.startDate && filters.endDate && filters.startDate > filters.endDate);

  const load = useCallback(async (f = filters) => {
    setLoading(true);
    try {
      setReports(await apiFetch<ExamReport[]>(`/api/v1/admin/reports${buildQuery(f)}`));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hesabat yüklənmədi");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // client-side search + status + sort over the server-filtered set
  const view = useMemo(() => {
    let rows = reports;
    const q = search.trim().toLowerCase();
    if (q) {
      rows = rows.filter((r) =>
        r.userName.toLowerCase().includes(q) ||
        r.userEmail.toLowerCase().includes(q) ||
        r.examTitle.toLowerCase().includes(q),
      );
    }
    if (status === "pass") rows = rows.filter((r) => r.passed === true);
    else if (status === "fail") rows = rows.filter((r) => r.passed === false);
    else if (status === "survey") rows = rows.filter((r) => r.passed == null);

    const dir = sort.dir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => {
      switch (sort.key) {
        case "name": return dir * a.userName.localeCompare(b.userName, "az");
        case "exam": return dir * a.examTitle.localeCompare(b.examTitle, "az");
        case "score": return dir * ((a.score ?? -1) - (b.score ?? -1));
        default: return dir * a.endTime.localeCompare(b.endTime);
      }
    });
  }, [reports, search, status, sort]);

  const summary = useMemo(() => {
    const scored = view.filter((r) => r.passed != null && r.score != null);
    const pass = scored.filter((r) => r.passed).length;
    const avg = scored.length ? Math.round(scored.reduce((s, r) => s + (r.score ?? 0), 0) / scored.length) : null;
    const passRate = scored.length ? Math.round((pass / scored.length) * 100) : null;
    const surveys = view.filter((r) => r.passed == null).length;
    return { total: view.length, avg, passRate, surveys };
  }, [view]);

  const toggleSort = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "name" || key === "exam" ? "asc" : "desc" }));

  const resetFilters = () => {
    const c = { departmentId: "", examId: "", startDate: "", endDate: "" };
    setFilters(c);
    setSearch("");
    setStatus("all");
    load(c);
  };

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        title="Hesabatlar"
        subtitle="Əməkdaş, şöbə və tarix üzrə imtahan nəticələri"
        action={
          <Button variant="outline" icon={<Download size={16} />} disabled={view.length === 0} onClick={() => exportCsv(view)}>
            CSV ixrac{view.length > 0 ? ` (${view.length})` : ""}
          </Button>
        }
      />

      {error && <div className="mb-4 rounded-[11px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-danger-fg">{error}</div>}

      {/* server-side filters */}
      <Card className="mb-4 p-5">
        <form onSubmit={(e) => { e.preventDefault(); if (!dateRangeInvalid) load(filters); }} className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto_auto]">
          <FieldGroup label="Şöbə">
            <Select value={filters.departmentId} onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })}>
              <option value="">Bütün şöbələr</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </FieldGroup>
          <FieldGroup label="İmtahan">
            <Select value={filters.examId} onChange={(e) => setFilters({ ...filters, examId: e.target.value })}>
              <option value="">Bütün imtahanlar</option>
              {exams.map((ex) => <option key={ex.id} value={ex.id}>{ex.title}</option>)}
            </Select>
          </FieldGroup>
          <FieldGroup label="Başlanğıc">
            <DatePicker value={filters.startDate} onChange={(v) => setFilters({ ...filters, startDate: v })} />
          </FieldGroup>
          <FieldGroup label="Son" error={dateRangeInvalid ? "Son tarix başlanğıc tarixindən əvvəl ola bilməz." : undefined}>
            <DatePicker value={filters.endDate} onChange={(v) => setFilters({ ...filters, endDate: v })} />
          </FieldGroup>
          <div className="flex gap-2">
            <Button type="submit" disabled={dateRangeInvalid}>Tətbiq et</Button>
            <Button type="button" variant="ghost" onClick={resetFilters}>Sıfırla</Button>
          </div>
        </form>
      </Card>

      {/* summary strip */}
      {!loading && reports.length > 0 && (
        <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatBox label="Nəticə" value={summary.total} />
          <StatBox label="Orta bal" value={summary.avg != null ? `${summary.avg}%` : "—"} />
          <StatBox label="Keçid faizi" value={summary.passRate != null ? `${summary.passRate}%` : "—"} tone="green" />
          <StatBox label="Sorğu cavabı" value={summary.surveys} />
        </div>
      )}

      {/* toolbar: search + status */}
      {!loading && reports.length > 0 && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="w-full max-w-[300px]">
            <IconInput icon={<Search size={15} />} placeholder="Ad, e-poçt və ya imtahan…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Segmented
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: "Hamısı" },
              { value: "pass", label: "Keçdi" },
              { value: "fail", label: "Kəsildi" },
              { value: "survey", label: "Sorğu" },
            ]}
          />
        </div>
      )}

      {loading ? (
        <Loading />
      ) : (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-line bg-surface-2">
                  <SortTh label="Əməkdaş" active={sort.key === "name"} dir={sort.dir} onClick={() => toggleSort("name")} />
                  <th className="px-5 py-3 text-[11.5px] font-semibold uppercase tracking-wider text-fg-faint">Şöbə</th>
                  <SortTh label="İmtahan" active={sort.key === "exam"} dir={sort.dir} onClick={() => toggleSort("exam")} />
                  <SortTh label="Bal" active={sort.key === "score"} dir={sort.dir} onClick={() => toggleSort("score")} />
                  <th className="px-5 py-3 text-[11.5px] font-semibold uppercase tracking-wider text-fg-faint">Nəticə</th>
                  <SortTh label="Tamamlandı" active={sort.key === "date"} dir={sort.dir} onClick={() => toggleSort("date")} />
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody>
                {view.map((r) => (
                  <Tr key={r.sessionId}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={r.userName} size={32} />
                        <div>
                          <div className="text-[13.5px] font-semibold text-fg">{r.userName}</div>
                          <div className="text-[11.5px] text-fg-faint">{r.userEmail}</div>
                        </div>
                      </div>
                    </Td>
                    <Td>{r.departmentName || "—"}</Td>
                    <Td>
                      <div className="font-medium text-fg">{r.examTitle}</div>
                      <div className="text-[11.5px] text-fg-faint">{r.examType === "EXAM" ? "İmtahan" : "Sorğu"}</div>
                    </Td>
                    <Td className="num font-semibold text-fg">{r.score != null ? `${r.score}%` : "—"}</Td>
                    <Td>{r.passed == null ? <ResultPill result="survey" /> : r.passed ? <ResultPill result="pass" /> : <ResultPill result="fail" />}</Td>
                    <Td className="num text-fg-muted">{formatDateTime(r.endTime)}</Td>
                    <Td>
                      <Link href={`/exams/${r.examId}/results`} title="İmtahan nəticələrinə bax" className="inline-flex text-fg-faint hover:text-blue-600">
                        <ExternalLink size={15} />
                      </Link>
                    </Td>
                  </Tr>
                ))}
                {view.length === 0 && (
                  <Tr>
                    <Td colSpan={7} className="py-10 text-center text-fg-muted">
                      {reports.length === 0 ? "Filtrlərə uyğun tamamlanmış imtahan yoxdur." : "Axtarışa uyğun nəticə tapılmadı."}
                    </Td>
                  </Tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function StatBox({ label, value, tone }: { label: string; value: React.ReactNode; tone?: "green" }) {
  return (
    <div className="rounded-[12px] border border-line bg-surface px-4 py-3">
      <div className="text-[12px] text-fg-muted">{label}</div>
      <div className={cn("num mt-0.5 text-[20px] font-bold", tone === "green" ? "text-success-fg" : "text-fg")}>{value}</div>
    </div>
  );
}

function SortTh({ label, active, dir, onClick }: { label: string; active: boolean; dir: SortDir; onClick: () => void }) {
  return (
    <th className="px-5 py-3">
      <button
        onClick={onClick}
        className={cn(
          "inline-flex items-center gap-1 text-[11.5px] font-semibold uppercase tracking-wider transition-colors",
          active ? "text-fg" : "text-fg-faint hover:text-fg-muted",
        )}
      >
        {label}
        {active ? (dir === "asc" ? <ArrowUp size={12} /> : <ArrowDown size={12} />) : <ChevronsUpDown size={12} className="opacity-50" />}
      </button>
    </th>
  );
}
