"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Department, User } from "@/lib/types";
import { nameError, passwordError, sanitizeName, emailError, PASSWORD_HINT } from "@/lib/validate";
import { Card } from "@/components/ui/Card";
import { FieldGroup, Input, Select } from "@/components/ui/Field";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Feedback";

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", departmentId: "", roleIds: [] as number[], status: "ACTIVE" });

  useEffect(() => {
    Promise.all([
      apiFetch<Department[]>("/api/v1/departments"),
      apiFetch<{ id: number; name: string }[]>("/api/v1/roles"),
      apiFetch<User>(`/api/v1/users/${userId}`),
    ])
      .then(([deps, rls, u]) => {
        setDepartments(deps);
        setRoles(rls);
        setForm({
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          password: "",
          departmentId: u.departmentId ? String(u.departmentId) : "",
          roleIds: u.roles?.map((r) => r.id) ?? [],
          status: u.status,
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [userId]);

  const toggleRole = (id: number, checked: boolean) =>
    setForm((f) => ({ ...f, roleIds: checked ? [...f.roleIds, id] : f.roleIds.filter((x) => x !== id) }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fieldErr = nameError(form.firstName, "Ad") || nameError(form.lastName, "Soyad")
      || emailError(form.email)
      || (form.password ? passwordError(form.password) : null);
    if (fieldErr) return setError(fieldErr);
    if (!form.departmentId) return setError("Şöbə seçilməlidir");
    if (form.roleIds.length === 0) return setError("Ən azı bir rol seçin");
    setSubmitting(true);
    setError("");
    try {
      const payload: Record<string, unknown> = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        departmentId: form.departmentId ? Number(form.departmentId) : null,
        roleIds: form.roleIds,
        status: form.status,
      };
      if (form.password) payload.password = form.password;
      await apiFetch(`/api/v1/users/${userId}`, { method: "PUT", body: JSON.stringify(payload) });
      router.push("/users");
    } catch (e) {
      setError(e instanceof Error ? e.message : "İstifadəçi yenilənmədi");
      setSubmitting(false);
    }
  };

  const roleLabel = (n: string) => (n.includes("ADMIN") ? "Admin" : n.includes("CANDIDATE") ? "Namizəd" : "İşçi");

  if (loading) return <Loading />;

  return (
    <div className="mx-auto max-w-[760px]">
      <Link href="/users" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-fg-muted hover:text-fg">
        <ArrowLeft size={15} /> İstifadəçilərə qayıt
      </Link>
      <h2 className="mb-5 text-[22px] font-bold tracking-[-0.4px] text-fg">İstifadəçi düzəlişi</h2>

      {error && <div className="mb-4 rounded-[11px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-danger-fg">{error}</div>}

      <Card className="p-6">
        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FieldGroup label="Ad"><Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: sanitizeName(e.target.value) })} required /></FieldGroup>
            <FieldGroup label="Soyad"><Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: sanitizeName(e.target.value) })} required /></FieldGroup>
          </div>
          <FieldGroup label="E-poçt"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></FieldGroup>
          <FieldGroup label="Şifrə" hint={`Dəyişməmək üçün boş buraxın. ${PASSWORD_HINT}`}>
            <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </FieldGroup>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FieldGroup label="Şöbə">
              <Select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
                <option value="">Şöbə seçin</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </FieldGroup>
            <FieldGroup label="Status">
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="ACTIVE">Aktiv</option>
                <option value="INACTIVE">Deaktiv</option>
              </Select>
            </FieldGroup>
          </div>
          <FieldGroup label="Rollar">
            <div className="flex flex-wrap gap-2">
              {roles.map((r) => {
                const checked = form.roleIds.includes(r.id);
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => toggleRole(r.id, !checked)}
                    className={
                      "rounded-[9px] border px-3.5 py-2 text-[13px] font-medium transition-colors " +
                      (checked ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-600/10" : "border-line text-fg-muted hover:bg-surface-2")
                    }
                  >
                    {roleLabel(r.name)}
                  </button>
                );
              })}
            </div>
          </FieldGroup>
          <div className="flex justify-end gap-3 pt-1">
            <Link href="/users" className={buttonClasses("secondary", "md")}>Ləğv et</Link>
            <Button type="submit" loading={submitting}>Yadda saxla</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
