"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { publicFetch } from "@/lib/publicApi";
import type { TokenAssignment } from "@/lib/types";
import type { SessionStart } from "@/lib/types";
import styles from "../../employee/employee.module.css";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

export default function CandidateExamLandingPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [info, setInfo] = useState<TokenAssignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    publicFetch<TokenAssignment>(`/api/v1/public/exam-token/${token}`)
      .then(setInfo)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleStart = async () => {
    setStarting(true);
    setError("");
    try {
      if (info?.status === "IN_PROGRESS" && info.sessionId) {
        router.push(`/exam/token/${token}/${info.sessionId}/take`);
        return;
      }
      if (info?.status === "COMPLETED" && info.sessionId) {
        router.push(`/exam/token/${token}/${info.sessionId}/result`);
        return;
      }
      const session = await publicFetch<SessionStart>(`/api/v1/public/exam-token/${token}/start`, {
        method: "POST",
      });
      router.push(`/exam/token/${token}/${session.sessionId}/take`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start exam");
      setStarting(false);
    }
  };

  if (loading) return <p style={{ color: "var(--text-secondary)" }}>Loading...</p>;
  if (error && !info) return <div className={styles.error}>{error}</div>;
  if (!info) return <div className={styles.error}>Exam link not found.</div>;

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>{info.examTitle}</h1>
        <p className={styles.subtitle}>Hello, {info.candidateName}</p>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.card}>
        {info.examDescription && (
          <p style={{ marginBottom: "1rem", lineHeight: 1.6 }}>{info.examDescription}</p>
        )}
        <div style={{ display: "grid", gap: "0.5rem", marginBottom: "1.5rem", color: "var(--text-secondary)", fontSize: "0.9375rem" }}>
          {info.durationMinutes && <p>Duration: {info.durationMinutes} minutes</p>}
          <p>Available from: {formatDate(info.startDate)}</p>
          <p>Deadline: {formatDate(info.endDate)}</p>
          <p>
            Status:{" "}
            <strong style={{ color: "var(--text-primary)" }}>{info.status}</strong>
          </p>
        </div>

        {info.status === "COMPLETED" ? (
          <button
            className={styles.primaryBtn}
            onClick={() => router.push(`/exam/token/${token}/${info.sessionId}/result`)}
          >
            View Results
          </button>
        ) : (
          <button className={styles.primaryBtn} onClick={handleStart} disabled={starting}>
            {starting ? "Starting..." : info.status === "IN_PROGRESS" ? "Continue Exam" : "Start Exam"}
          </button>
        )}

        <p style={{ marginTop: "1.5rem", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
          This is a secure one-time exam link. Do not share it with others.
        </p>
      </div>
    </div>
  );
}
