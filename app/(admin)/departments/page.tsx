"use client";

import React, { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import type { Department } from "@/lib/types";
import styles from "../admin.module.css";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [newDeptName, setNewDeptName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const loadDepartments = useCallback(async () => {
    try {
      const data = await apiFetch<Department[]>("/api/v1/departments");
      setDepartments(data);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load departments");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;
    setSubmitting(true);
    try {
      await apiFetch<Department>("/api/v1/departments", {
        method: "POST",
        body: JSON.stringify({ name: newDeptName.trim() }),
      });
      setNewDeptName("");
      await loadDepartments();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create department");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Departments</h1>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "2rem" }}>
        <div className={styles.card}>
          <h3 style={{ marginBottom: "1rem", fontWeight: 600 }}>Add New Department</h3>
          <form onSubmit={handleCreate}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Department Name</label>
              <input
                type="text"
                className={styles.input}
                value={newDeptName}
                onChange={(e) => setNewDeptName(e.target.value)}
                placeholder="e.g. Marketing"
                required
              />
            </div>
            <button type="submit" className={styles.primaryBtn} disabled={submitting}>
              {submitting ? "Creating..." : "Create Department"}
            </button>
          </form>
        </div>

        <div className={styles.card} style={{ padding: 0, overflow: "hidden" }}>
          {loading ? (
            <p style={{ padding: "1.5rem", color: "var(--text-secondary)" }}>Loading...</p>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody>
                {departments.map((dept) => (
                  <tr key={dept.id}>
                    <td>#{dept.id}</td>
                    <td style={{ fontWeight: 500 }}>{dept.name}</td>
                    <td style={{ color: "var(--text-secondary)" }}>
                      {new Date(dept.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && departments.length === 0 && (
            <p style={{ padding: "1.5rem", color: "var(--text-secondary)" }}>No departments yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
