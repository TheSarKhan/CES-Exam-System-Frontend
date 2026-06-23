"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { User } from "@/lib/types";
import styles from "../admin.module.css";

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadUsers = useCallback(async () => {
    try {
      const data = await apiFetch<User[]>("/api/v1/users");
      setUsers(data);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleDeactivate = async (id: number) => {
    if (!confirm("Deactivate this user?")) return;
    try {
      await apiFetch(`/api/v1/users/${id}`, { method: "DELETE" });
      await loadUsers();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to deactivate user");
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Users</h1>
        <Link href="/users/create" className={styles.primaryBtn}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Add New User
        </Link>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.card} style={{ padding: 0, overflow: "auto" }}>
        {loading ? (
          <p style={{ padding: "1.5rem", color: "var(--text-secondary)" }}>Loading...</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Roles</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td style={{ fontWeight: 500 }}>
                    {user.firstName} {user.lastName}
                  </td>
                  <td style={{ color: "var(--text-secondary)" }}>{user.email}</td>
                  <td>{user.departmentName || "-"}</td>
                  <td>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      {user.roles.map((role) => (
                        <span key={role.id} className={styles.badge}>
                          {role.name.replace("ROLE_", "")}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${user.status === "ACTIVE" ? styles.active : ""}`}>
                      {user.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
                      <Link
                        href={`/users/${user.id}/edit`}
                        style={{
                          color: "var(--primary-color)",
                          fontWeight: 500,
                          textDecoration: "none",
                        }}
                      >
                        Edit
                      </Link>
                      {user.status === "ACTIVE" && (
                        <button
                          onClick={() => handleDeactivate(user.id)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "var(--error-color)",
                            cursor: "pointer",
                            fontWeight: 500,
                          }}
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && users.length === 0 && (
          <p style={{ padding: "1.5rem", color: "var(--text-secondary)" }}>No users found.</p>
        )}
      </div>
    </div>
  );
}
