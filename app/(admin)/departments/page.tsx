"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Plus, Pencil, Trash2, Users, ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { humanizeError } from "@/lib/errors";
import type { Department } from "@/lib/types";
import { PageHeader } from "@/components/app/PageHeader";
import { FieldGroup, Input } from "@/components/ui/Field";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Loading, EmptyState, Modal } from "@/components/ui/Feedback";
import { formatDate } from "@/lib/format";

export default function DepartmentsPage() {
  const toast = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editTarget, setEditTarget] = useState<Department | null>(null);
  const [editName, setEditName] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Department | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    try {
      setDepartments(await apiFetch<Department[]>("/api/v1/departments"));
    } catch (e) {
      toast.error(humanizeError(e, "Şöbələr yüklənmədi"));
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);

  const create = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!name.trim()) return;
    const newName = name.trim();
    setSubmitting(true);
    try {
      await apiFetch("/api/v1/departments", { method: "POST", body: JSON.stringify({ name: newName }) });
      setName("");
      setCreateOpen(false);
      await load();
      toast.success(`"${newName}" şöbəsi yaradıldı`);
    } catch (e) {
      toast.error(humanizeError(e, "Şöbə yaradılmadı"));
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (d: Department) => { setEditTarget(d); setEditName(d.name); };

  const saveEdit = async () => {
    if (!editTarget || !editName.trim()) return;
    setSavingEdit(true);
    try {
      await apiFetch(`/api/v1/departments/${editTarget.id}`, { method: "PUT", body: JSON.stringify({ name: editName.trim() }) });
      setEditTarget(null);
      await load();
      toast.success("Şöbə adı yeniləndi");
    } catch (e) {
      toast.error(humanizeError(e, "Şöbə yenilənmədi"));
      setEditTarget(null);
    } finally {
      setSavingEdit(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const delName = deleteTarget.name;
    setDeleting(true);
    try {
      await apiFetch(`/api/v1/departments/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      await load();
      toast.success(`"${delName}" şöbəsi silindi`);
    } catch (e) {
      toast.error(humanizeError(e, "Şöbə silinmədi"));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        title="Şöbələr"
        subtitle="Şöbəyə klikləyib əməkdaşlarını və statistikasını görün"
        action={
          <button onClick={() => { setName(""); setCreateOpen(true); }} className={buttonClasses("primary", "md")}>
            <Plus size={17} /> Yeni şöbə
          </button>
        }
      />

      {loading ? (
        <Loading />
      ) : departments.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Building2 size={22} />}
            title="Hələ şöbə yoxdur"
            description="İlk şöbəni yaradın, sonra ona əməkdaş təyin edin."
            action={<Button onClick={() => setCreateOpen(true)} icon={<Plus size={16} />}>Şöbə yarat</Button>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((d) => (
            <Link
              key={d.id}
              href={`/departments/${d.id}`}
              className="card group relative flex flex-col p-5 transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-pop"
            >
              <div className="mb-3 flex items-start justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-blue-50 text-blue-600 dark:bg-blue-600/15 dark:text-blue-400">
                  <Building2 size={20} />
                </span>
                <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEdit(d); }}
                    className="rounded-md p-1.5 text-fg-muted hover:bg-surface-2 hover:text-fg"
                    title="Adını dəyiş"
                  >
                    <Pencil size={15} />
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteTarget(d); }}
                    className="rounded-md p-1.5 text-fg-muted hover:bg-surface-2 hover:text-danger"
                    title="Sil"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              <h3 className="text-[16px] font-semibold text-fg">{d.name}</h3>
              <div className="mt-1.5 flex items-center gap-1.5 text-[13px] text-fg-muted">
                <Users size={14} className="text-fg-faint" />
                <span className="num font-semibold text-fg">{d.memberCount}</span> üzv
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-line pt-3 text-[12px]">
                <span className="num text-fg-faint">{formatDate(d.createdAt)}</span>
                <span className="inline-flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400">
                  Ətraflı <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* create */}
      <Modal
        open={createOpen}
        onClose={() => !submitting && setCreateOpen(false)}
        icon={<Building2 size={18} />}
        title="Yeni şöbə"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)} disabled={submitting} className="flex-1">Ləğv et</Button>
            <Button onClick={() => create()} loading={submitting} className="flex-1">Yarat</Button>
          </>
        }
      >
        <form onSubmit={create} className="mt-1">
          <FieldGroup label="Şöbənin adı">
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="məs. Marketinq" required />
          </FieldGroup>
        </form>
      </Modal>

      {/* rename */}
      <Modal
        open={editTarget != null}
        onClose={() => !savingEdit && setEditTarget(null)}
        icon={<Pencil size={18} />}
        title="Şöbənin adını dəyiş"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditTarget(null)} disabled={savingEdit} className="flex-1">Ləğv et</Button>
            <Button onClick={saveEdit} loading={savingEdit} className="flex-1">Yadda saxla</Button>
          </>
        }
      >
        <div className="mt-1">
          <Input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveEdit()} />
        </div>
      </Modal>

      {/* delete */}
      <Modal
        open={deleteTarget != null}
        onClose={() => !deleting && setDeleteTarget(null)}
        icon={<Trash2 size={20} />}
        iconTone="red"
        title="Şöbəni sil"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting} className="flex-1">Ləğv et</Button>
            <Button variant="danger" onClick={confirmDelete} loading={deleting} className="flex-1">Sil</Button>
          </>
        }
      >
        <span className="font-medium text-fg">{deleteTarget?.name}</span> silinəcək. İçində istifadəçi və ya sual bankı kateqoriyası varsa, silinməyəcək.
      </Modal>
    </div>
  );
}
