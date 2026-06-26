"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Building2, Users, CheckCircle2, TrendingUp, Target, Mail,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { DepartmentDetail, DepartmentMember } from "@/lib/types";
import { KpiCard, ProgressBar, scoreColor } from "@/components/ui/DataViz";
import { Table, Tr, Td } from "@/components/ui/Table";
import { Avatar } from "@/components/ui/Avatar";
import { Loading, EmptyState } from "@/components/ui/Feedback";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/cn";

export default function DepartmentDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<DepartmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<DepartmentDetail>(`/api/v1/departments/${id}/detail`)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Şöbə yüklənmədi"))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="mx-auto max-w-[1200px]">
      <Link
        href="/departments"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-fg-muted transition-colors hover:text-fg"
      >
        <ArrowLeft size={15} /> Şöbələr
      </Link>

      {loading ? (
        <Loading />
      ) : error || !data ? (
        <div className="card p-6 text-center text-[14px] text-danger-fg">{error || "Şöbə tapılmadı"}</div>
      ) : (
        <>
          {/* Header */}
          <div className="mb-6 flex items-center gap-3.5">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[13px] bg-blue-50 text-blue-600 dark:bg-blue-600/15 dark:text-blue-400">
              <Building2 size={22} />
            </span>
            <div>
              <h2 className="text-[22px] font-bold tracking-[-0.4px] text-fg">{data.name}</h2>
              <p className="mt-0.5 text-[13px] text-fg-muted">Yaradılıb: {formatDate(data.createdAt)}</p>
            </div>
          </div>

          {/* KPIs */}
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard icon={<Users size={18} />} tone="blue" value={data.memberCount} label="Əməkdaş" />
            <KpiCard icon={<CheckCircle2 size={18} />} tone="green" value={data.examsCompleted} label="Tamamlanmış imtahan" />
            <KpiCard icon={<TrendingUp size={18} />} tone="amber" value={data.avgScore == null ? "—" : `${data.avgScore}%`} label="Orta nəticə" />
            <KpiCard icon={<Target size={18} />} tone="purple" value={data.passRate == null ? "—" : `${data.passRate}%`} label="Keçmə faizi" />
          </div>

          {/* Members */}
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-[15px] font-semibold text-fg">
              <Users size={17} className="text-blue-600 dark:text-blue-400" /> Əməkdaşlar
            </h3>
            <span className="num text-[13px] text-fg-muted">{data.members.length}</span>
          </div>

          {data.members.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={<Users size={22} />}
                title="Bu şöbədə əməkdaş yoxdur"
                description="İstifadəçilər bölməsindən bu şöbəyə əməkdaş təyin edin."
              />
            </div>
          ) : (
            <Table headers={["Əməkdaş", "Rol", "Tamamlanmış", "Orta nəticə", "Son fəaliyyət"]}>
              {data.members.map((m) => (
                <MemberRow key={m.id} m={m} />
              ))}
            </Table>
          )}
        </>
      )}
    </div>
  );
}

function MemberRow({ m }: { m: DepartmentMember }) {
  const fullName = `${m.firstName} ${m.lastName}`;
  const inactive = m.status !== "ACTIVE";
  return (
    <Tr className={cn(inactive && "opacity-55")}>
      <Td>
        <div className="flex items-center gap-3">
          <Avatar name={fullName} size={36} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate text-[13.5px] font-semibold text-fg">{fullName}</span>
              {inactive && (
                <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10.5px] font-semibold text-slate-500 dark:bg-surface-2">
                  Deaktiv
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 truncate text-[12px] text-fg-muted">
              <Mail size={11} className="shrink-0 text-fg-faint" /> {m.email}
            </div>
          </div>
        </div>
      </Td>
      <Td>
        <div className="flex flex-wrap gap-1">
          {m.roles.map((r) => (
            <span key={r} className="rounded-full bg-surface-2 px-2.5 py-1 text-[11.5px] font-medium text-fg-soft">
              {r}
            </span>
          ))}
        </div>
      </Td>
      <Td className="num font-semibold text-fg">{m.completedExams}</Td>
      <Td>
        {m.avgScore == null ? (
          <span className="text-fg-faint">—</span>
        ) : (
          <div className="flex items-center gap-2.5">
            <span className="num w-9 shrink-0 font-semibold" style={{ color: scoreColor(m.avgScore) }}>
              {m.avgScore}%
            </span>
            <ProgressBar value={m.avgScore} className="max-w-[96px]" height={7} />
          </div>
        )}
      </Td>
      <Td className="num text-fg-muted">{m.lastActivity ? formatDate(m.lastActivity) : <span className="text-fg-faint">—</span>}</Td>
    </Tr>
  );
}
