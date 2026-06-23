"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { SessionResult } from "@/lib/types";
import styles from "../../../employee.module.css";

export default function ExamResultPage() {
  const params = useParams();
  const sessionId = Number(params.sessionId);
  const [result, setResult] = useState<SessionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<SessionResult>(`/api/v1/sessions/${sessionId}/result`)
      .then(setResult)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) return <p>Loading results...</p>;
  if (error || !result) return <div className={styles.error}>{error || "Result not found"}</div>;

  const passed = result.passed === true;

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>{result.examTitle}</h1>
        <p className={styles.subtitle}>Exam completed</p>
      </div>

      <div className={styles.card} style={{ marginBottom: "2rem", textAlign: "center" }}>
        {result.passed != null && (
          <p className={passed ? styles.resultPass : styles.resultFail}>
            {passed ? "Passed" : "Failed"}
          </p>
        )}
        <p style={{ fontSize: "1.5rem", fontWeight: 600, marginTop: "0.5rem" }}>
          Score: {result.score}%
        </p>
        {result.passMark != null && (
          <p className={styles.meta}>Pass mark: {result.passMark}%</p>
        )}
        <p className={styles.meta}>
          Completed: {new Date(result.endTime).toLocaleString()}
        </p>
      </div>

      <h2 style={{ fontSize: "1.125rem", fontWeight: 600, marginBottom: "1rem" }}>Answer Review</h2>
      <div className={styles.card}>
        {result.answers.map((a, i) => (
          <div key={a.questionId} className={styles.answerRow}>
            <p style={{ fontWeight: 500, marginBottom: "0.5rem" }}>
              {i + 1}. {a.questionText}
            </p>
            {a.selectedOptionText && (
              <p className={styles.meta}>Your answer: {a.selectedOptionText}</p>
            )}
            {a.textAnswer && (
              <p className={styles.meta}>Your answer: {a.textAnswer}</p>
            )}
            {a.isCorrect != null && (
              <p className={a.isCorrect ? styles.answerCorrect : styles.answerWrong}>
                {a.isCorrect ? "Correct" : "Incorrect"}
              </p>
            )}
          </div>
        ))}
      </div>

      <Link href="/employee/dashboard" className={styles.primaryBtn} style={{ marginTop: "1.5rem" }}>
        Back to Dashboard
      </Link>
    </div>
  );
}
