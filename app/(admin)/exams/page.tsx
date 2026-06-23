"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { Exam } from "@/lib/types";
import styles from "../admin.module.css";

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Exam[]>("/api/v1/exams")
      .then(setExams)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Exams & Surveys</h1>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link
            href="/exams/assign"
            className={styles.primaryBtn}
            style={{ background: "var(--bg-secondary)", color: "var(--text-primary)", border: "1px solid var(--border-color)" }}
          >
            Assign Exam
          </Link>
          <Link href="/exams/create" className={styles.primaryBtn}>
            Create Exam
          </Link>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.card} style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <p style={{ padding: "1.5rem", color: "var(--text-secondary)" }}>Loading...</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Topics</th>
                <th>Questions</th>
                <th>Pass Mark</th>
                <th>Duration</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((exam) => {
                const topicCount = exam.topicConfigs?.length ?? 0;
                const totalQuestions =
                  exam.topicConfigs?.reduce((sum, tc) => sum + tc.questionCount, 0) ?? 0;
                return (
                  <tr key={exam.id}>
                    <td style={{ fontWeight: 500 }}>{exam.title}</td>
                    <td>
                      <span
                        className={styles.badge}
                        style={{
                          backgroundColor:
                            exam.type === "EXAM" ? "rgba(59,130,246,0.1)" : "rgba(168,85,247,0.1)",
                          color: exam.type === "EXAM" ? "#3b82f6" : "#a855f7",
                        }}
                      >
                        {exam.type}
                      </span>
                    </td>
                    <td>{topicCount} topics</td>
                    <td>{totalQuestions}</td>
                    <td>{exam.passMark != null ? `${exam.passMark}%` : "-"}</td>
                    <td>{exam.durationMinutes != null ? `${exam.durationMinutes} min` : "-"}</td>
                    <td>
                      <Link
                        href={`/exams/assign?examId=${exam.id}`}
                        style={{ color: "var(--success-color)", fontWeight: 500, fontSize: "0.875rem", textDecoration: "none" }}
                      >
                        Assign
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!loading && exams.length === 0 && (
          <p style={{ padding: "1.5rem", color: "var(--text-secondary)" }}>No exams created yet.</p>
        )}
      </div>
    </div>
  );
}
