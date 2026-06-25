"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { publicFetch } from "@/lib/publicApi";
import type { SessionResult } from "@/lib/types";
import styles from "../../../../../employee/employee.module.css";

export default function CandidateResultPage() {
  const params = useParams();
  const token = params.token as string;
  const sessionId = Number(params.sessionId);

  const [result, setResult] = useState<SessionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    publicFetch<SessionResult>(`/api/v1/public/exam-token/${token}/sessions/${sessionId}/result`)
      .then(setResult)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, sessionId]);

  if (loading) return <p>Loading results...</p>;
  if (error || !result) return <div className={styles.error}>{error || "Result not found"}</div>;

  const passed = result.passed === true;

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>{result.examTitle}</h1>
        <p className={styles.subtitle}>Thank you for completing the assessment</p>
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
        <p className={styles.meta}>Completed: {new Date(result.endTime).toLocaleString()}</p>
      </div>

      <div className={styles.card}>
        <p style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
          Your responses have been recorded. You may close this window.
        </p>
      </div>
    </div>
  );
}
