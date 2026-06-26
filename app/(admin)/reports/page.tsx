"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Download } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Department, Exam, ExamReport } from "@/lib/types";
import { PageHeader } from "@/components/app/PageHeader";
import { Card } from "@/components/ui/Card";
import { Table, Tr, Td } from "@/components/ui/Table";
import { FieldGroup, Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { ResultPill } from "@/components/ui/Badge";
import { Loading } from "@/components/ui/Feedback";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("az", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

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
    r.userName, r.userEmail, r.departmentName ?? "", r.examTitle, r.examType,
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([apiFetch<Department[]>("/api/v1/departments"), apiFetch<Exam[]>("/api/v1/exams")])
      .then(([d, e]) => { setDepartments(d); setExams(e); })
      .catch((e) => setError(e.message));
  }, []);

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

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        title="Hesabatlar"
        subtitle="Əməkdaş, şöbə və tarix üzrə imtahan nəticələri"
        action={
          <Button variant="outline" icon={<Download size={16} />} disabled={reports.length === 0} onClick={() => exportCsv(reports)}>
            CSV ixrac
          </Button>
        }
      />

      {error && <div className="mb-4 rounded-[11px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-danger-fg">{error}</div>}

      <Card className="mb-5 p-5">
        <form onSubmit={(e) => { e.preventDefault(); load(filters); }} className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto_auto_auto]">
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
            <input type="date" className="field num" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
          </FieldGroup>
          <FieldGroup label="Son">
            <input type="date" className="field num" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
          </FieldGroup>
          <div className="flex gap-2">
            <Button type="submit">Tətbiq et</Button>
            <Button type="button" variant="ghost" onClick={() => { const c = { departmentId: "", examId: "", startDate: "", endDate: "" }; setFilters(c); load(c); }}>
              Sıfırla
            </Button>
          </div>
        </form>
      </Card>

      {loading ? (
        <Loading />
      ) : (
        <Table headers={[`Əməkdaş`, "Şöbə", "İmtahan", "Bal", "Nəticə", "Tamamlandı"]}>
          {reports.map((r) => (
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
              <Td className="num text-fg-muted">{formatDate(r.endTime)}</Td>
            </Tr>
          ))}
          {reports.length === 0 && (
            <Tr>
              <Td colSpan={6} className="py-10 text-center text-fg-muted">Filtrlərə uyğun tamamlanmış imtahan yoxdur.</Td>
            </Tr>
          )}
        </Table>
      )}
    </div>
  );
}
