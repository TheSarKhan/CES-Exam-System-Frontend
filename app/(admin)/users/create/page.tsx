"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Department } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { FieldGroup, Input, Select } from "@/components/ui/Field";
import { Button, buttonClasses } from "@/components/ui/Button";
import { isValidName, sanitizeNameInput, NAME_ERROR_MESSAGE } from "@/lib/validation";

export default function CreateUserPage() {
  const router = useRouter();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [roles, setRoles] = useState<{ id: number; name: string }[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", departmentId: "", roleIds: [] as number[] });

  useEffect(() => {
    apiFetch<Department[]>("/api/v1/departments").then(setDepartments).catch((e) => setError(e.message));
    apiFetch<{ id: number; name: string }[]>("/api/v1/roles").then(setRoles).catch(() => {});
  }, []);

  const toggleRole = (id: number, checked: boolean) =>
    setForm((f) => ({ ...f, roleIds: checked ? [...f.roleIds, id] : f.roleIds.filter((x) => x !== id) }));

  const firstNameValid = isValidName(form.firstName);
  const lastNameValid = isValidName(form.lastName);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.roleIds.length === 0) return setError("Ən azı bir rol seçin");
    if (!firstNameValid || !lastNameValid) return setError(NAME_ERROR_MESSAGE);
    setSubmitting(true);
    setError("");
    try {
      await apiFetch("/api/v1/users", {
        method: "POST",
        body: JSON.stringify({ ...form, departmentId: form.departmentId ? Number(form.departmentId) : null }),
      });
      router.push("/users");
    } catch (e) {
      setError(e instanceof Error ? e.message : "İstifadəçi yaradılmadı");
      setSubmitting(false);
    }
  };

  const roleLabel = (n: string) => (n.includes("ADMIN") ? "Admin" : n.includes("CANDIDATE") ? "Namizəd" : "İşçi");

  return (
    <div className="mx-auto max-w-[760px]">
      <Link href="/users" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-fg-muted hover:text-fg">
        <ArrowLeft size={15} /> İstifadəçilərə qayıt
      </Link>
      <h2 className="mb-5 text-[22px] font-bold tracking-[-0.4px] text-fg">Yeni istifadəçi</h2>

      {error && <div className="mb-4 rounded-[11px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-danger-fg">{error}</div>}

      <Card className="p-6">
        <form onSubmit={submit} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FieldGroup label="Ad" error={form.firstName && !firstNameValid ? NAME_ERROR_MESSAGE : undefined}>
              <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: sanitizeNameInput(e.target.value) })} invalid={!!form.firstName && !firstNameValid} maxLength={100} required />
            </FieldGroup>
            <FieldGroup label="Soyad" error={form.lastName && !lastNameValid ? NAME_ERROR_MESSAGE : undefined}>
              <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: sanitizeNameInput(e.target.value) })} invalid={!!form.lastName && !lastNameValid} maxLength={100} required />
            </FieldGroup>
          </div>
          <FieldGroup label="E-poçt"><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required /></FieldGroup>
          <FieldGroup label="Şifrə"><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required /></FieldGroup>
          <FieldGroup label="Şöbə">
            <Select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
              <option value="">Şöbə seçin</option>
              {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </FieldGroup>
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
            <Button type="submit" loading={submitting} disabled={!firstNameValid || !lastNameValid}>İstifadəçini yarat</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
