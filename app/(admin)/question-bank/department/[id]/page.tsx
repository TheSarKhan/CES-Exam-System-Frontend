"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Building2, Plus, Package, Pencil, Trash2, FolderTree, ArrowRight, ArrowUpFromLine, Layers, HelpCircle,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { humanizeError } from "@/lib/errors";
import type { Category, Department } from "@/lib/types";
import { Button, buttonClasses } from "@/components/ui/Button";
import { FieldGroup, Input } from "@/components/ui/Field";
import { Loading, EmptyState, Modal } from "@/components/ui/Feedback";
import { nameError } from "@/lib/validate";

export default function DepartmentQuestionBankPage() {
  const params = useParams();
  const deptId = Number(params.id);
  const toast = useToast();

  const [deptName, setDeptName] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadCategories = useCallback(async () => {
    try {
      setCategories(await apiFetch<Category[]>(`/api/v1/question-bank/categories?departmentId=${deptId}`));
    } catch (e) {
      toast.error(humanizeError(e, "Kateqoriyalar yüklənmədi"));
    }
  }, [deptId, toast]);

  useEffect(() => {
    Promise.all([
      apiFetch<Department[]>("/api/v1/departments"),
      apiFetch<Category[]>(`/api/v1/question-bank/categories?departmentId=${deptId}`),
    ])
      .then(([deps, cats]) => {
        setDeptName(deps.find((d) => d.id === deptId)?.name ?? "Şöbə");
        setCategories(cats);
      })
      .catch((e) => toast.error(humanizeError(e, "Yüklənmədi")))
      .finally(() => setLoading(false));
  }, [deptId, toast]);

  const newCatError = nameError(newCat, "Kateqoriya adı");
  const editNameError = nameError(editName, "Kateqoriya adı");

  const createCategory = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (newCatError) return toast.error(newCatError);
    const name = newCat.trim();
    setSubmitting(true);
    try {
      await apiFetch("/api/v1/question-bank/categories", {
        method: "POST",
        body: JSON.stringify({ departmentId: deptId, name, description: newDesc.trim() || null }),
      });
      setNewCat(""); setNewDesc(""); setCreateOpen(false);
      await loadCategories();
      toast.success(`"${name}" kateqoriyası yaradıldı`);
    } catch (e) {
      toast.error(humanizeError(e, "Kateqoriya yaradılmadı"));
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (c: Category) => { setEditTarget(c); setEditName(c.name); };

  const saveEdit = async () => {
    if (!editTarget) return;
    if (editNameError) return toast.error(editNameError);
    setSavingEdit(true);
    try {
      await apiFetch(`/api/v1/question-bank/categories/${editTarget.id}`, {
        method: "PUT",
        body: JSON.stringify({ departmentId: deptId, name: editName.trim(), description: editTarget.description }),
      });
      setEditTarget(null);
      await loadCategories();
      toast.success("Kateqoriya adı yeniləndi");
    } catch (e) {
      toast.error(humanizeError(e, "Yenilənmədi"));
      setEditTarget(null);
    } finally {
      setSavingEdit(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const name = deleteTarget.name;
    setDeleting(true);
    try {
      await apiFetch(`/api/v1/question-bank/categories/${deleteTarget.id}`, { method: "DELETE" });
      setDeleteTarget(null);
      await loadCategories();
      toast.success(`"${name}" silindi`);
    } catch (e) {
      toast.error(humanizeError(e, "Silinmədi"));
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1200px]">
      <Link href="/question-bank" className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-fg-muted transition-colors hover:text-fg">
        <ArrowLeft size={15} /> Şöbələr
      </Link>

      {loading ? (
        <Loading />
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[13px] bg-blue-50 text-blue-600 dark:bg-blue-600/15 dark:text-blue-400">
                <Building2 size={22} />
              </span>
              <div>
                <h2 className="text-[22px] font-bold tracking-[-0.4px] text-fg">{deptName}</h2>
                <p className="mt-0.5 text-[13px] text-fg-muted">Kateqoriyaya klikləyib suallara baxın</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/question-bank/import" className={buttonClasses("outline", "md")}>
                <ArrowUpFromLine size={16} /> Toplu idxal
              </Link>
              <button onClick={() => { setNewCat(""); setNewDesc(""); setCreateOpen(true); }} className={buttonClasses("primary", "md")}>
                <Plus size={17} /> Yeni kateqoriya
              </button>
            </div>
          </div>

          {categories.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={<FolderTree size={22} />}
                title="Bu şöbədə kateqoriya yoxdur"
                description="İlk kateqoriyanı yaradın, sonra ona mövzu və suallar əlavə edin."
                action={<Button onClick={() => setCreateOpen(true)} icon={<Plus size={16} />}>Kateqoriya yarat</Button>}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/question-bank/category/${c.id}`}
                  className="card group relative flex flex-col p-5 transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-pop"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-blue-50 text-blue-600 dark:bg-blue-600/15 dark:text-blue-400">
                      <Package size={20} />
                    </span>
                    <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); openEdit(c); }} className="rounded-md p-1.5 text-fg-muted hover:bg-surface-2 hover:text-fg" title="Adını dəyiş"><Pencil size={15} /></button>
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDeleteTarget(c); }} className="rounded-md p-1.5 text-fg-muted hover:bg-surface-2 hover:text-danger" title="Sil"><Trash2 size={15} /></button>
                    </div>
                  </div>

                  <h3 className="text-[16px] font-semibold text-fg">{c.name}</h3>
                  {c.description && <p className="mt-1 line-clamp-2 text-[12.5px] text-fg-muted">{c.description}</p>}

                  <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                    <div className="flex items-center gap-3 text-[12px] text-fg-muted">
                      <span className="inline-flex items-center gap-1"><Layers size={13} className="text-fg-faint" /><span className="num font-semibold text-fg">{c.topicCount ?? 0}</span> mövzu</span>
                      <span className="inline-flex items-center gap-1"><HelpCircle size={13} className="text-fg-faint" /><span className="num font-semibold text-fg">{c.questionCount ?? 0}</span> sual</span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[12px] font-medium text-blue-600 dark:text-blue-400">
                      Bax <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </>
      )}

      {/* create category */}
      <Modal
        open={createOpen}
        onClose={() => !submitting && setCreateOpen(false)}
        icon={<Package size={18} />}
        title="Yeni kateqoriya"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)} disabled={submitting} className="flex-1">Ləğv et</Button>
            <Button onClick={() => createCategory()} loading={submitting} disabled={!!newCatError} className="flex-1">Yarat</Button>
          </>
        }
      >
        <form onSubmit={createCategory} className="mt-1 flex flex-col gap-3">
          <FieldGroup label="Kateqoriya adı" error={newCat.trim() ? newCatError ?? undefined : undefined}>
            <Input autoFocus value={newCat} onChange={(e) => setNewCat(e.target.value)} placeholder="məs. Təhlükəsizlik" invalid={!!(newCat.trim() && newCatError)} required />
          </FieldGroup>
          <FieldGroup label="Təsvir (istəyə bağlı)">
            <Input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Qısa təsvir" />
          </FieldGroup>
        </form>
      </Modal>

      {/* rename category */}
      <Modal
        open={editTarget != null}
        onClose={() => !savingEdit && setEditTarget(null)}
        icon={<Pencil size={18} />}
        title="Kateqoriyanın adını dəyiş"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditTarget(null)} disabled={savingEdit} className="flex-1">Ləğv et</Button>
            <Button onClick={saveEdit} loading={savingEdit} disabled={!!editNameError} className="flex-1">Yadda saxla</Button>
          </>
        }
      >
        <div className="mt-1">
          <FieldGroup label="Kateqoriya adı" error={editName.trim() ? editNameError ?? undefined : undefined}>
            <Input autoFocus value={editName} onChange={(e) => setEditName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && saveEdit()} invalid={!!(editName.trim() && editNameError)} />
          </FieldGroup>
        </div>
      </Modal>

      {/* delete category */}
      <Modal
        open={deleteTarget != null}
        onClose={() => !deleting && setDeleteTarget(null)}
        icon={<Trash2 size={20} />}
        iconTone="red"
        title="Kateqoriyanı sil"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting} className="flex-1">Ləğv et</Button>
            <Button variant="danger" onClick={confirmDelete} loading={deleting} className="flex-1">Sil</Button>
          </>
        }
      >
        <span className="font-medium text-fg">{deleteTarget?.name}</span> silinəcək. İçində mövzular varsa, əvvəlcə onları silmək lazımdır.
      </Modal>
    </div>
  );
}
