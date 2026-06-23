"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { Department, User } from "@/lib/types";
import styles from "../../../admin.module.css";

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "", // Optional during edit
    departmentId: "",
    roleIds: [] as number[],
    status: "ACTIVE",
  });

  useEffect(() => {
    Promise.all([
      apiFetch<Department[]>("/api/v1/departments"),
      apiFetch<{ id: number; name: string }[]>("/api/v1/roles"),
      apiFetch<User>(`/api/v1/users/${userId}`), // We need this API endpoint in backend too
    ])
      .then(([deps, rls, user]) => {
        setDepartments(deps);
        setRoles(rls);
        setFormData({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          password: "",
          departmentId: user.departmentId ? String(user.departmentId) : "",
          roleIds: user.roles?.map(r => r.id) || [],
          status: user.status,
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleRoleChange = (roleId: number, checked: boolean) => {
    if (checked) {
      setFormData({ ...formData, roleIds: [...formData.roleIds, roleId] });
    } else {
      setFormData({ ...formData, roleIds: formData.roleIds.filter((id) => id !== roleId) });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.roleIds.length === 0) {
      setError("Select at least one role");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const payload: any = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        departmentId: formData.departmentId ? Number(formData.departmentId) : null,
        roleIds: formData.roleIds,
        status: formData.status,
      };
      if (formData.password) {
        payload.password = formData.password;
      }
      
      await apiFetch(`/api/v1/users/${userId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      router.push("/users");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update user");
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: "2rem", color: "var(--text-secondary)" }}>Loading user data...</div>;
  }

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div className={styles.pageHeader}>
        <div>
          <Link href="/users" style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "0.5rem", display: "inline-block" }}>
            &larr; Back to Users
          </Link>
          <h1 className={styles.title}>Edit User</h1>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.card}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div className={styles.formGroup}>
              <label className={styles.label}>First Name</label>
              <input
                type="text"
                className={styles.input}
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Last Name</label>
              <input
                type="text"
                className={styles.input}
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Email Address</label>
            <input
              type="email"
              className={styles.input}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Password (Leave blank to keep current)</label>
            <input
              type="password"
              className={styles.input}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Department</label>
              <select
                className={styles.input}
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
              >
                <option value="">Select a department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>Status</label>
              <select
                className={styles.input}
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Roles</label>
            <div style={{ display: "flex", gap: "1.5rem", marginTop: "0.5rem" }}>
              {roles.map((role) => (
                <label key={role.id} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <input
                    type="checkbox"
                    checked={formData.roleIds.includes(role.id)}
                    onChange={(e) => handleRoleChange(role.id, e.target.checked)}
                  />
                  {role.name}
                </label>
              ))}
            </div>
          </div>

          <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
            <Link href="/users" style={{ padding: "0.75rem 1.5rem", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", color: "var(--text-primary)", textDecoration: "none", fontWeight: 500 }}>
              Cancel
            </Link>
            <button type="submit" className={styles.primaryBtn} style={{ padding: "0.75rem 1.5rem" }} disabled={submitting}>
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
