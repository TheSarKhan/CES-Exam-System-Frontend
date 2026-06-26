"use client";

import React, { useCallback, useEffect, useState } from "react";
import { ScrollText, ChevronLeft, ChevronRight, Shield, User as UserIcon, Clock } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { humanizeError } from "@/lib/errors";
import type { AuditLog, PageResponse } from "@/lib/types";
import { PageHeader } from "@/components/app/PageHeader";
import { Table, Tr, Td } from "@/components/ui/Table";
import { Avatar } from "@/components/ui/Avatar";
import { Select } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { Loading, EmptyState, Modal } from "@/components/ui/Feedback";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";

const PAGE_SIZE = 20;

const MODULES = [
  "İstifadəçilər", "Şöbələr", "İmtahanlar", "Sual bankı", "Autentifikasiya",
  "Parametrlər", "Bildirişlər", "Hesab", "Təyinatlar", "İmtahan sessiyaları", "Namizəd imtahanı",
];

function statusClass(code: number | null): string {
  if (code == null) return "bg-slate-100 text-slate-600 dark:bg-surface-2";
  if (code < 300) return "bg-success-bg text-success-fg";
  if (code < 400) return "bg-info-bg text-info-fg";
  if (code < 500) return "bg-warning-bg text-warning-fg";
  return "bg-danger-bg text-danger-fg";
}

function methodClass(method: string | null): string {
  switch (method) {
    case "POST": return "bg-success-bg text-success-fg";
    case "PUT": case "PATCH": return "bg-warning-bg text-warning-fg";
    case "DELETE": return "bg-danger-bg text-danger-fg";
    default: return "bg-slate-100 text-slate-600 dark:bg-surface-2";
  }
}

export default function AuditPage() {
  const toast = useToast();
  const [data, setData] = useState<PageResponse<AuditLog> | null>(null);
  const [page, setPage] = useState(0);
  const [moduleFilter, setModuleFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AuditLog | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ page: String(page), size: String(PAGE_SIZE) });
      if (moduleFilter) q.set("module", moduleFilter);
      setData(await apiFetch<PageResponse<AuditLog>>(`/api/v1/admin/audit?${q.toString()}`));
    } catch (e) {
      toast.error(humanizeError(e, "Audit jurnalı yüklənmədi"));
    } finally {
      setLoading(false);
    }
  }, [page, moduleFilter, toast]);

  useEffect(() => { load(); }, [load]);

  const total = data?.totalElements ?? 0;
  const totalPages = data?.totalPages ?? 0;
  const from = total === 0 ? 0 : page * PAGE_SIZE + 1;
  const to = Math.min((page + 1) * PAGE_SIZE, total);

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        title="Audit jurnalı"
        subtitle="Platformada baş verən bütün dəyişikliklər burada qeydə alınır"
        action={
          <Select value={moduleFilter} onChange={(e) => { setPage(0); setModuleFilter(e.target.value); }} className="sm:w-[200px]">
            <option value="">Bütün modullar</option>
            {MODULES.map((m) => <option key={m} value={m}>{m}</option>)}
          </Select>
        }
      />

      {loading ? (
        <Loading />
      ) : !data || data.content.length === 0 ? (
        <div className="card">
          <EmptyState icon={<ScrollText size={22} />} title="Qeyd yoxdur" description={moduleFilter ? "Bu modul üzrə audit qeydi tapılmadı." : "Hələ heç bir əməliyyat qeydə alınmayıb."} />
        </div>
      ) : (
        <>
          <Table headers={["İstifadəçi", "Rolu", "Modul", "Əməliyyat növü", "Tarix və saat"]}>
            {data.content.map((row) => (
              <Tr key={row.id} onClick={() => setSelected(row)}>
                <Td>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={row.userName || "Anonim"} size={32} />
                    <span className="text-[13.5px] font-semibold text-fg">{row.userName || "Anonim"}</span>
                  </div>
                </Td>
                <Td className="text-fg-muted">{row.userRole || "—"}</Td>
                <Td className="font-medium text-fg">{row.module || "—"}</Td>
                <Td>
                  <span className="inline-flex items-center gap-2">
                    <span className={cn("num rounded-[6px] px-1.5 py-0.5 text-[11px] font-bold", methodClass(row.httpMethod))}>{row.httpMethod}</span>
                    <span className="text-fg">{row.action || "—"}</span>
                  </span>
                </Td>
                <Td className="num whitespace-nowrap text-fg-muted">{formatDateTime(row.createdAt)}</Td>
              </Tr>
            ))}
          </Table>

          {/* pagination */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="num text-[13px] text-fg-muted">
              {from}–{to} / {total} qeyd
            </p>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled={page <= 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                <ChevronLeft size={15} /> Əvvəlki
              </Button>
              <span className="num px-2 text-[13px] text-fg-muted">{page + 1} / {Math.max(1, totalPages)}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage((p) => p + 1)}>
                Növbəti <ChevronRight size={15} />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* detail popup */}
      <Modal
        open={selected != null}
        onClose={() => setSelected(null)}
        icon={<ScrollText size={18} />}
        title="Audit qeydi"
        footer={<Button onClick={() => setSelected(null)} className="flex-1">Bağla</Button>}
      >
        {selected && (
          <div className="mt-2 flex flex-col divide-y divide-line">
            <Row icon={<UserIcon size={14} />} label="İstifadəçi" value={selected.userName || "Anonim"} />
            <Row icon={<Shield size={14} />} label="Rolu" value={selected.userRole || "—"} />
            <Row label="Modul" value={selected.module || "—"} />
            <Row label="Əməliyyat növü" value={selected.action || "—"} />
            <Row icon={<Clock size={14} />} label="Tarix və saat" value={formatDateTime(selected.createdAt)} mono />
            <Row label="HTTP metod" value={<span className={cn("num rounded-[6px] px-2 py-0.5 text-[11.5px] font-bold", methodClass(selected.httpMethod))}>{selected.httpMethod || "—"}</span>} />
            <Row label="IP ünvan" value={selected.ipAddress || "—"} mono />
            <Row label="Status kodu" value={<span className={cn("num rounded-[6px] px-2 py-0.5 text-[11.5px] font-bold", statusClass(selected.statusCode))}>{selected.statusCode ?? "—"}</span>} />
            {selected.path && <Row label="Endpoint" value={selected.path} mono />}
          </div>
        )}
      </Modal>
    </div>
  );
}

function Row({
  label,
  value,
  icon,
  mono,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <span className="flex items-center gap-1.5 text-[13px] text-fg-muted">
        {icon && <span className="text-fg-faint">{icon}</span>}
        {label}
      </span>
      <span className={cn("text-right text-[13px] font-medium text-fg", mono && "num break-all")}>{value}</span>
    </div>
  );
}
