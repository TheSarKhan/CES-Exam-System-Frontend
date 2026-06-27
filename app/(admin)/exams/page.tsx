"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Plus, Send, Pencil, Trash2, ListChecks, Target, Clock, ClipboardList,
  Users, TrendingUp, BarChart3, Search, PieChart,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Exam } from "@/lib/types";
import { PageHeader } from "@/components/app/PageHeader";
import { Card } from "@/components/ui/Card";
import { Select } from "@/components/ui/Field";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Loading, EmptyState, Modal } from "@/components/ui/Feedback";

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Exam | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    apiFetch<Exam[]>("/api/v1/exams")
      .then(setExams)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const view = useMemo(() => {
    const s = search.trim().toLowerCase();
    let list = exams.filter((e) =>
      (typeFilter === "all" || e.type === typeFilter) &&
      (!s || e.title.toLowerCase().includes(s)));
    list = [...list].sort((a, b) => {
      if (sortBy === "name") return a.title.localeCompare(b.title);
      if (sortBy === "assigned") return (b.stats?.assigned ?? 0) - (a.stats?.assigned ?? 0);
      return b.id - a.id; // newest
    });
    return list;
  }, [exams, search, typeFilter, sortBy]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setError("");
    try {
      await apiFetch(`/api/v1/exams/${deleteTarget.id}`, { method: "DELETE" });
      setExams((prev) => prev.filter((e) => e.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "İmtahan silinmədi");
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        title="İmtahanlar və sorğular"
        subtitle="Qiymətləndirmələri yaradın və təyin edin"
        action={
          <div className="flex gap-2.5">
            <Link href="/exams/assign" className={buttonClasses("secondary", "md")}>
              <Send size={16} /> Təyin et
            </Link>
            <Link href="/exams/create" className={buttonClasses("primary", "md")}>
              <Plus size={17} /> Yeni imtahan
            </Link>
          </div>
        }
      />

      {error && <div className="mb-4 rounded-[11px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-danger-fg">{error}</div>}

      {!loading && exams.length > 0 && (
        <div className="mb-5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input className="field w-full pl-9 text-[13.5px]" placeholder="İmtahan adı üzrə axtar…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="sm:w-[160px]">
            <option value="all">Bütün növlər</option>
            <option value="EXAM">İmtahan</option>
            <option value="SURVEY">Sorğu</option>
          </Select>
          <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sm:w-[170px]">
            <option value="newest">Ən yeni</option>
            <option value="name">Ad (A–Z)</option>
            <option value="assigned">Ən çox təyin</option>
          </Select>
        </div>
      )}

      {loading ? (
        <Loading />
      ) : exams.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ClipboardList size={22} />}
            title="Hələ imtahan yoxdur"
            description="İlk imtahanınızı yaradın və istifadəçilərə təyin edin."
            action={<Link href="/exams/create" className={buttonClasses("primary", "sm")}><Plus size={15} /> Yeni imtahan</Link>}
          />
        </Card>
      ) : view.length === 0 ? (
        <Card><EmptyState icon={<Search size={22} />} title="Nəticə yoxdur" description="Axtarış/filtrə uyğun imtahan tapılmadı." /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {view.map((ex) => {
            const total = ex.questionCount ?? ex.topicConfigs?.reduce((s, t) => s + t.questionCount, 0) ?? 0;
            const isExam = ex.type === "EXAM";
            const st = ex.stats;
            const hasActivity = st && (st.assigned > 0 || st.completed > 0 || st.inProgress > 0);
            return (
              <Card key={ex.id} className="group flex flex-col p-5">
                {/* header */}
                <div className="mb-3 flex items-start justify-between gap-2">
                  <span
                    className="inline-flex rounded-[7px] px-2.5 py-1 text-[11.5px] font-semibold"
                    style={isExam ? { background: "#F7EFD8", color: "#75590F" } : { background: "#F3E8FF", color: "#7E22CE" }}
                  >
                    {isExam ? "İmtahan" : "Sorğu"}
                  </span>
                  <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                    <Link href={`/exams/${ex.id}/edit`} className="flex h-8 w-8 items-center justify-center rounded-[8px] text-fg-muted hover:bg-surface-2 hover:text-fg" title="Düzəliş"><Pencil size={15} /></Link>
                    <button onClick={() => setDeleteTarget(ex)} className="flex h-8 w-8 items-center justify-center rounded-[8px] text-fg-muted hover:bg-danger-bg hover:text-danger" title="Sil"><Trash2 size={15} /></button>
                  </div>
                </div>

                {/* title + description */}
                <h3 className="text-[16px] font-semibold leading-snug text-fg line-clamp-2">{ex.title}</h3>
                {ex.description && <p className="mt-1.5 text-[13px] leading-relaxed text-fg-muted line-clamp-2">{ex.description}</p>}

                {/* meta */}
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12.5px] text-fg-muted">
                  <span className="flex items-center gap-1.5"><ListChecks size={14} className="text-fg-faint" /> <span className="num font-semibold text-fg">{total}</span> sual</span>
                  {isExam && ex.passMark != null && (
                    <span className="flex items-center gap-1.5"><Target size={14} className="text-fg-faint" /> <span className="num font-semibold text-fg">{ex.passMark}%</span> keçid</span>
                  )}
                  {ex.durationMinutes != null && (
                    <span className="flex items-center gap-1.5"><Clock size={14} className="text-fg-faint" /> <span className="num font-semibold text-fg">{ex.durationMinutes}</span> dəq</span>
                  )}
                </div>

                {/* stats */}
                {hasActivity ? (
                  <div className="mt-3 rounded-[9px] bg-surface-2 px-3 py-2">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-fg-muted">
                      <span className="flex items-center gap-1"><Users size={13} className="text-fg-faint" /> Təyin <b className="num text-fg">{st!.assigned}</b></span>
                      <span className="text-fg-faint">·</span>
                      <span>Bitib <b className="num text-fg">{st!.completed}</b></span>
                      {st!.inProgress > 0 && <><span className="text-fg-faint">·</span><span>Davam <b className="num text-fg">{st!.inProgress}</b></span></>}
                    </div>
                    {st!.avgScore != null && (
                      <div className="mt-1.5 flex items-center gap-2 text-[12px] text-fg-muted">
                        <span className="flex items-center gap-1"><TrendingUp size={13} className="text-fg-faint" /> Orta <b className="num text-fg">{st!.avgScore}%</b></span>
                        <span className="text-fg-faint">·</span>
                        <span>Keçid <b className="num text-success-fg">{st!.passRate}%</b></span>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="mt-3 text-[12px] text-fg-faint">Hələ təyin olunmayıb</p>
                )}

                {/* footer */}
                <div className="mt-auto flex gap-2 border-t border-line pt-4">
                  <Link href={`/exams/${ex.id}/analytics`} className={buttonClasses("outline", "sm")} title="Analitika">
                    <PieChart size={15} />
                  </Link>
                  <Link href={`/exams/${ex.id}/results`} className={buttonClasses("outline", "sm", "flex-1")}>
                    <BarChart3 size={15} /> Nəticələr
                  </Link>
                  <Link href={`/exams/assign?examId=${ex.id}`} className={buttonClasses("secondary", "sm", "flex-1")}>
                    <Send size={15} /> Təyin et
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={deleteTarget != null}
        onClose={() => !deleting && setDeleteTarget(null)}
        icon={<Trash2 size={20} />}
        iconTone="red"
        title="İmtahanı sil"
        footer={
          <>
            <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={deleting} className="flex-1">Ləğv et</Button>
            <Button variant="danger" onClick={confirmDelete} loading={deleting} className="flex-1">Sil</Button>
          </>
        }
      >
        <span className="font-medium text-fg">{deleteTarget?.title}</span> silinəcək. Bu əməliyyat geri qaytarıla bilməz.
      </Modal>
    </div>
  );
}
