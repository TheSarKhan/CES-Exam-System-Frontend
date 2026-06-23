"use client";

import React, { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Department, Exam, ExamReport } from "@/lib/types";
import styles from "../admin.module.css";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

function buildQuery(filters: {
  departmentId: string;
  examId: string;
  startDate: string;
  endDate: string;
}) {
  const params = new URLSearchParams();
  if (filters.departmentId) params.set("departmentId", filters.departmentId);
  if (filters.examId) params.set("examId", filters.examId);
  if (filters.startDate) params.set("startDate", `${filters.startDate}T00:00:00`);
  if (filters.endDate) params.set("endDate", `${filters.endDate}T23:59:59`);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

function exportCsv(rows: ExamReport[]) {
  const headers = [
    "Employee",
    "Email",
    "Department",
    "Exam",
    "Type",
    "Score (%)",
    "Result",
    "Started",
    "Completed",
  ];
  const lines = rows.map((r) => [
    r.userName,
    r.userEmail,
    r.departmentName ?? "",
    r.examTitle,
    r.examType,
    r.score != null ? String(r.score) : "",
    r.passed == null ? "Survey" : r.passed ? "Passed" : "Failed",
    r.startTime,
    r.endTime,
  ]);
  const csv = [headers, ...lines]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `ces-reports-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [reports, setReports] = useState<ExamReport[]>([]);
  const [filters, setFilters] = useState({
    departmentId: "",
    examId: "",
    startDate: "",
    endDate: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      apiFetch<Department[]>("/api/v1/departments"),
      apiFetch<Exam[]>("/api/v1/exams"),
    ])
      .then(([depts, examList]) => {
        setDepartments(depts);
        setExams(examList);
      })
      .catch((e) => setError(e.message));
  }, []);

  const loadReports = useCallback(async (activeFilters = filters) => {
    setLoading(true);
    try {
      const data = await apiFetch<ExamReport[]>(`/api/v1/admin/reports${buildQuery(activeFilters)}`);
      setReports(data);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load reports");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadReports();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    loadReports(filters);
  };

  const handleReset = () => {
    const cleared = { departmentId: "", examId: "", startDate: "", endDate: "" };
    setFilters(cleared);
    loadReports(cleared);
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Reports</h1>
          <p className={styles.subtitle}>Exam results by employee, department, and date range</p>
        </div>
        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={() => exportCsv(reports)}
          disabled={reports.length === 0}
        >
          Export CSV
        </button>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.card} style={{ marginBottom: "1.5rem" }}>
        <form onSubmit={handleApply}>
          <div className={styles.filterGrid}>
            <div className={styles.formGroup} style={{ marginBottom: 0 }}>
              <label className={styles.label}>Department</label>
              <select
                className={styles.input}
                value={filters.departmentId}
                onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })}
              >
                <option value="">All departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup} style={{ marginBottom: 0 }}>
              <label className={styles.label}>Exam</label>
              <select
                className={styles.input}
                value={filters.examId}
                onChange={(e) => setFilters({ ...filters, examId: e.target.value })}
              >
                <option value="">All exams</option>
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.formGroup} style={{ marginBottom: 0 }}>
              <label className={styles.label}>From</label>
              <input
                type="date"
                className={styles.input}
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div className={styles.formGroup} style={{ marginBottom: 0 }}>
              <label className={styles.label}>To</label>
              <input
                type="date"
                className={styles.input}
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            <div className={styles.filterActions}>
              <button type="submit" className={styles.primaryBtn}>
                Apply Filters
              </button>
              <button type="button" className={styles.secondaryBtn} onClick={handleReset}>
                Reset
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className={styles.card} style={{ padding: 0, overflow: "auto" }}>
        {loading ? (
          <p style={{ padding: "1.5rem", color: "var(--text-secondary)" }}>Loading reports...</p>
        ) : (
          <>
            <div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid var(--border-color)", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
              {reports.length} result{reports.length !== 1 ? "s" : ""}
            </div>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Exam</th>
                  <th>Score</th>
                  <th>Result</th>
                  <th>Completed</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((row) => (
                  <tr key={row.sessionId}>
                    <td>
                      <div style={{ fontWeight: 500 }}>{row.userName}</div>
                      <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{row.userEmail}</div>
                    </td>
                    <td>{row.departmentName || "—"}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{row.examTitle}</div>
                      <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{row.examType}</div>
                    </td>
                    <td>{row.score != null ? `${row.score}%` : "—"}</td>
                    <td>
                      {row.passed == null ? (
                        <span className={styles.badge}>Survey</span>
                      ) : row.passed ? (
                        <span className={styles.badgePass}>Passed</span>
                      ) : (
                        <span className={styles.badgeFail}>Failed</span>
                      )}
                    </td>
                    <td>{formatDate(row.endTime)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {reports.length === 0 && (
              <p style={{ padding: "1.5rem", color: "var(--text-secondary)" }}>
                No completed exams match your filters.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
