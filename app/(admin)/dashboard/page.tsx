"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import type { DashboardStats } from "@/lib/types";
import styles from "../admin.module.css";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString();
}

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<DashboardStats>("/api/v1/admin/dashboard")
      .then(setStats)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const monthName = new Date().toLocaleString("default", { month: "long" });

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>
            Welcome back{user ? `, ${user.firstName}` : ""}. Here is your platform overview.
          </p>
        </div>
        <Link href="/exams/assign" className={styles.primaryBtn}>
          Assign Exam
        </Link>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.statsGrid}>
        <StatCard
          label="Total Users"
          value={loading ? "—" : stats?.totalUsers ?? 0}
          hint="Active accounts"
        />
        <StatCard
          label="Active Exams"
          value={loading ? "—" : stats?.activeExams ?? 0}
          hint="Open assignments"
        />
        <StatCard
          label="Completed This Month"
          value={loading ? "—" : stats?.completedThisMonth ?? 0}
          hint={monthName}
        />
      </div>

      <div className={styles.card} style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid var(--border-color)" }}>
          <h2 style={{ fontSize: "1.125rem", fontWeight: 600 }}>Recent Completed Exams</h2>
        </div>

        {loading && (
          <p style={{ padding: "1.5rem", color: "var(--text-secondary)" }}>Loading...</p>
        )}

        {!loading && stats && stats.recentSessions.length === 0 && (
          <p style={{ padding: "1.5rem", color: "var(--text-secondary)" }}>
            No completed exams yet.
          </p>
        )}

        {!loading && stats && stats.recentSessions.length > 0 && (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Exam</th>
                <th>Score</th>
                <th>Result</th>
                <th>Completed</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentSessions.map((row) => (
                <tr key={row.sessionId}>
                  <td>{row.userName}</td>
                  <td>{row.examTitle}</td>
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
                  <td>{formatDate(row.completedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint: string;
}) {
  return (
    <div className={styles.statCard}>
      <span className={styles.statLabel}>{label}</span>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statHint}>{hint}</span>
    </div>
  );
}
