"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { MyAssignment } from "@/lib/types";
import styles from "../employee.module.css";

function statusBadge(status: MyAssignment["status"]) {
  if (status === "COMPLETED") return styles.badgeCompleted;
  if (status === "IN_PROGRESS") return styles.badgeProgress;
  return styles.badgePending;
}

export default function EmployeeExamsPage() {
  const [assignments, setAssignments] = useState<MyAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<MyAssignment[]>("/api/v1/assignments/my")
      .then(setAssignments)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const handleStart = async (assignment: MyAssignment) => {
    try {
      if (assignment.status === "IN_PROGRESS" && assignment.sessionId) {
        window.location.href = `/employee/exams/${assignment.sessionId}/take`;
        return;
      }
      const session = await apiFetch<{ sessionId: number }>("/api/v1/sessions/start", {
        method: "POST",
        body: JSON.stringify({ assignmentId: assignment.assignmentId }),
      });
      window.location.href = `/employee/exams/${session.sessionId}/take`;
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to start");
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>My Exams</h1>
        <p className={styles.subtitle}>All assigned exams and surveys</p>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {loading && <p>Loading...</p>}

      <div className={styles.card} style={{ padding: 0, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
              <th style={{ padding: "1rem", textAlign: "left", color: "var(--text-secondary)", fontSize: "0.875rem" }}>Title</th>
              <th style={{ padding: "1rem", textAlign: "left", color: "var(--text-secondary)", fontSize: "0.875rem" }}>Type</th>
              <th style={{ padding: "1rem", textAlign: "left", color: "var(--text-secondary)", fontSize: "0.875rem" }}>Deadline</th>
              <th style={{ padding: "1rem", textAlign: "left", color: "var(--text-secondary)", fontSize: "0.875rem" }}>Status</th>
              <th style={{ padding: "1rem", textAlign: "left", color: "var(--text-secondary)", fontSize: "0.875rem" }}>Score</th>
              <th style={{ padding: "1rem" }}></th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a) => (
              <tr key={a.assignmentId} style={{ borderBottom: "1px solid var(--border-color)" }}>
                <td style={{ padding: "1rem", fontWeight: 500 }}>{a.examTitle}</td>
                <td style={{ padding: "1rem" }}>{a.examType}</td>
                <td style={{ padding: "1rem" }}>
                  {a.endDate ? new Date(a.endDate).toLocaleDateString() : "—"}
                </td>
                <td style={{ padding: "1rem" }}>
                  <span className={statusBadge(a.status)}>{a.status}</span>
                </td>
                <td style={{ padding: "1rem" }}>
                  {a.score != null ? `${a.score}%` : "—"}
                </td>
                <td style={{ padding: "1rem" }}>
                  {a.status === "COMPLETED" && a.sessionId ? (
                    <Link href={`/employee/exams/${a.sessionId}/result`} className={styles.secondaryBtn}>
                      Results
                    </Link>
                  ) : a.status !== "COMPLETED" ? (
                    <button className={styles.primaryBtn} onClick={() => handleStart(a)}>
                      {a.status === "IN_PROGRESS" ? "Continue" : "Start"}
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && assignments.length === 0 && (
          <p style={{ padding: "2rem", color: "var(--text-secondary)" }}>No exams assigned yet.</p>
        )}
      </div>
    </div>
  );
}
