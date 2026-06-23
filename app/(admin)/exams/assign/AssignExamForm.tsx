"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { Department, Exam, ExamAssignmentResult, User } from "@/lib/types";
import styles from "../../admin.module.css";

function toLocalDateTimeValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AssignExamForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedExamId = searchParams.get("examId") ?? "";

  const [exams, setExams] = useState<Exam[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedExamId, setSelectedExamId] = useState(preselectedExamId);
  const [assignmentType, setAssignmentType] = useState<"user" | "department">("user");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [assignmentResult, setAssignmentResult] = useState<ExamAssignmentResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch<Exam[]>("/api/v1/exams"),
      apiFetch<User[]>("/api/v1/users"),
      apiFetch<Department[]>("/api/v1/departments"),
    ])
      .then(([examList, userList, deptList]) => {
        setExams(examList);
        setUsers(userList.filter((u) => u.status === "ACTIVE"));
        setDepartments(deptList);
      })
      .catch((e) => setError(e.message));

    const now = new Date();
    const weekLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    setStartDate(toLocalDateTimeValue(now.toISOString()));
    setEndDate(toLocalDateTimeValue(weekLater.toISOString()));
  }, []);

  useEffect(() => {
    if (preselectedExamId) setSelectedExamId(preselectedExamId);
  }, [preselectedExamId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const result = await apiFetch<ExamAssignmentResult>("/api/v1/exams/assign", {
        method: "POST",
        body: JSON.stringify({
          examId: Number(selectedExamId),
          userId: assignmentType === "user" ? Number(selectedUserId) : null,
          departmentId: assignmentType === "department" ? Number(selectedDeptId) : null,
          startDate: startDate ? `${startDate}:00` : null,
          endDate: endDate ? `${endDate}:00` : null,
        }),
      });
      if (result.accessToken) {
        setAssignmentResult(result);
      } else {
        router.push("/exams");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to assign exam");
      setSubmitting(false);
    }
  };

  const magicLink =
    assignmentResult?.accessToken && typeof window !== "undefined"
      ? `${window.location.origin}/exam/token/${assignmentResult.accessToken}`
      : "";

  const copyLink = async () => {
    if (!magicLink) return;
    await navigator.clipboard.writeText(magicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (assignmentResult?.accessToken) {
    return (
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <div className={styles.pageHeader}>
          <h1 className={styles.title}>Exam Assigned</h1>
        </div>
        <div className={styles.card}>
          <p style={{ marginBottom: "0.5rem" }}>
            <strong>{assignmentResult.examTitle}</strong> assigned to{" "}
            <strong>{assignmentResult.candidateName}</strong>.
          </p>
          <p className={styles.subtitle} style={{ marginBottom: "1.5rem" }}>
            Share this magic link with the candidate. No login required.
          </p>
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              padding: "0.75rem",
              background: "var(--bg-secondary)",
              borderRadius: "var(--radius-md)",
              marginBottom: "1rem",
              wordBreak: "break-all",
              fontSize: "0.875rem",
            }}
          >
            {magicLink}
          </div>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button type="button" className={styles.primaryBtn} onClick={copyLink}>
              {copied ? "Copied!" : "Copy Link"}
            </button>
            <Link href="/exams" className={styles.secondaryBtn}>
              Back to Exams
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div className={styles.pageHeader}>
        <div>
          <Link href="/exams" style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "0.5rem", display: "inline-block" }}>
            &larr; Back to Exams
          </Link>
          <h1 className={styles.title}>Assign Exam</h1>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.card}>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Select Exam</label>
            <select className={styles.input} value={selectedExamId} onChange={(e) => setSelectedExamId(e.target.value)} required>
              <option value="">-- Choose an exam --</option>
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Assign To</label>
            <div style={{ display: "flex", gap: "1rem", marginTop: "0.5rem" }}>
              <label
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "1.5rem",
                  border: `2px solid ${assignmentType === "user" ? "var(--primary-color)" : "var(--border-color)"}`,
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                  backgroundColor: assignmentType === "user" ? "rgba(59,130,246,0.05)" : "transparent",
                }}
              >
                <input type="radio" name="assignType" checked={assignmentType === "user"} onChange={() => setAssignmentType("user")} style={{ display: "none" }} />
                <span style={{ fontWeight: 500, color: assignmentType === "user" ? "var(--primary-color)" : "var(--text-secondary)" }}>
                  Individual User
                </span>
              </label>

              <label
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "1.5rem",
                  border: `2px solid ${assignmentType === "department" ? "var(--primary-color)" : "var(--border-color)"}`,
                  borderRadius: "var(--radius-md)",
                  cursor: "pointer",
                  backgroundColor: assignmentType === "department" ? "rgba(59,130,246,0.05)" : "transparent",
                }}
              >
                <input type="radio" name="assignType" checked={assignmentType === "department"} onChange={() => setAssignmentType("department")} style={{ display: "none" }} />
                <span style={{ fontWeight: 500, color: assignmentType === "department" ? "var(--primary-color)" : "var(--text-secondary)" }}>
                  Entire Department
                </span>
              </label>
            </div>
          </div>

          {assignmentType === "user" ? (
            <div className={styles.formGroup}>
              <label className={styles.label}>Select User</label>
              <select className={styles.input} value={selectedUserId} onChange={(e) => setSelectedUserId(e.target.value)} required>
                <option value="">-- Choose a user --</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.firstName} {u.lastName} ({u.email}){u.departmentName ? ` - ${u.departmentName}` : ""}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className={styles.formGroup}>
              <label className={styles.label}>Select Department</label>
              <select className={styles.input} value={selectedDeptId} onChange={(e) => setSelectedDeptId(e.target.value)} required>
                <option value="">-- Choose a department --</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Start Date</label>
              <input type="datetime-local" className={styles.input} value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>End Date</label>
              <input type="datetime-local" className={styles.input} value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </div>
          </div>

          <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
            <Link href="/exams" style={{ padding: "0.75rem 1.5rem", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", color: "var(--text-primary)", textDecoration: "none", fontWeight: 500 }}>
              Cancel
            </Link>
            <button type="submit" className={styles.primaryBtn} style={{ padding: "0.75rem 1.5rem" }} disabled={submitting}>
              {submitting ? "Assigning..." : "Assign Exam"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
