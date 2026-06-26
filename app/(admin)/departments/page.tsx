"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Building2, Plus } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Department } from "@/lib/types";
import { PageHeader } from "@/components/app/PageHeader";
import { Table, Tr, Td } from "@/components/ui/Table";
import { Card } from "@/components/ui/Card";
import { FieldGroup, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Feedback";

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setDepartments(await apiFetch<Department[]>("/api/v1/departments"));
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Şöbələr yüklənmədi");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSubmitting(true);
    try {
      await apiFetch("/api/v1/departments", { method: "POST", body: JSON.stringify({ name: name.trim() }) });
      setName("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Şöbə yaradılmadı");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader title="Şöbələr" subtitle="Şirkət şöbələrini idarə edin" />

      {error && <div className="mb-4 rounded-[11px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-danger-fg">{error}</div>}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_2fr]">
        <Card className="h-fit p-5">
          <h3 className="mb-4 flex items-center gap-2 text-[15px] font-semibold text-fg">
            <Building2 size={17} className="text-blue-600" /> Yeni şöbə
          </h3>
          <form onSubmit={create} className="flex flex-col gap-4">
            <FieldGroup label="Şöbənin adı">
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="məs. Marketinq" required />
            </FieldGroup>
            <Button type="submit" loading={submitting} icon={<Plus size={16} />}>
              Şöbə yarat
            </Button>
          </form>
        </Card>

        {loading ? (
          <Loading />
        ) : (
          <Table headers={["ID", "Ad", "Yaradılıb"]}>
            {departments.map((d) => (
              <Tr key={d.id}>
                <Td className="num text-fg-faint">#{d.id}</Td>
                <Td className="font-semibold text-fg">{d.name}</Td>
                <Td className="num text-fg-muted">{new Date(d.createdAt).toLocaleDateString("az")}</Td>
              </Tr>
            ))}
            {departments.length === 0 && (
              <Tr>
                <Td colSpan={3} className="py-10 text-center text-fg-muted">Şöbə yoxdur.</Td>
              </Tr>
            )}
          </Table>
        )}
      </div>
    </div>
  );
}
