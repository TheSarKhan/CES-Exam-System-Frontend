"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import type { MyAssignment } from "@/lib/types";
import styles from "../employee.module.css";

function statusBadge(status: MyAssignment["status"]) {
  if (status === "COMPLETED") return styles.badgeCompleted;
  if (status === "IN_PROGRESS") return styles.badgeProgress;
  return styles.badgePending;
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString();
}

export default function EmployeeDashboardPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<MyAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<MyAssignment[]>("/api/v1/assignments/my")
      .then(setAssignments)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const active = assignments.filter((a) => a.status !== "COMPLETED");

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>
          Welcome, {user?.firstName} {user?.lastName}
        </h1>
        <p className={styles.subtitle}>Your assigned assessments and exams</p>
      </div>

      {error && <div className={styles.error}>{error}</div>}
      {loading && <p className={styles.meta}>Loading...</p>}

      {!loading && active.length === 0 && (
        <div className={styles.card}>
          <p className={styles.meta}>No active exams at the moment.</p>
        </div>
      )}

      <div className={styles.cardGrid}>
        {active.map((a) => (
          <div key={a.assignmentId} className={styles.examCard}>
            <span className={statusBadge(a.status)}>{a.status}</span>
            <h3 className={styles.examTitle}>{a.examTitle}</h3>
            <p className={styles.meta}>Type: {a.examType}</p>
            <p className={styles.meta}>Deadline: {formatDate(a.endDate)}</p>
            {a.durationMinutes && (
              <p className={styles.meta}>Duration: {a.durationMinutes} min</p>
            )}
            <ExamAction assignment={a} />
          </div>
        ))}
      </div>

      {assignments.some((a) => a.status === "COMPLETED") && (
        <div style={{ marginTop: "2rem" }}>
          <Link href="/employee/exams" className={styles.secondaryBtn}>
            View all exams & results
          </Link>
        </div>
      )}
    </div>
  );
}

function ExamAction({ assignment }: { assignment: MyAssignment }) {
  if (assignment.status === "COMPLETED" && assignment.sessionId) {
    return (
      <Link href={`/employee/exams/${assignment.sessionId}/result`} className={styles.secondaryBtn}>
        View Results
      </Link>
    );
  }
  return <StartOrResumeButton assignment={assignment} />;
}

function StartOrResumeButton({ assignment }: { assignment: MyAssignment }) {
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
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
      alert(e instanceof Error ? e.message : "Failed to start exam");
      setLoading(false);
    }
  };

  return (
    <button className={styles.primaryBtn} onClick={handleStart} disabled={loading}>
      {loading ? "Starting..." : assignment.status === "IN_PROGRESS" ? "Continue" : "Start Exam"}
    </button>
  );
}
