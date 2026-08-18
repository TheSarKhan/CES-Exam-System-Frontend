"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Mail, CheckCircle2, TrendingUp, Target, ClipboardList } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { UserDetail } from "@/lib/types";
import { KpiCard, ProgressBar, scoreColor } from "@/components/ui/DataViz";
import { Table, Tr, Td } from "@/components/ui/Table";
import { Avatar } from "@/components/ui/Avatar";
import { RoleBadge } from "@/components/ui/Badge";
import { Loading, EmptyState } from "@/components/ui/Feedback";
import { formatDateTime } from "@/lib/format";

export default function UserDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [data, setData] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<UserDetail>(`/api/v1/users/${id}/detail`)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "İstifadəçi yüklənmədi"))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <div className="mx-auto max-w-[1200px]">
      <Link
        href="/users"
        className="mb-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-fg-muted transition-colors hover:text-fg"
      >
        <ArrowLeft size={15} /> İstifadəçilər
      </Link>

      {loading ? (
        <Loading />
      ) : error || !data ? (
        <div className="card p-6 text-center text-[14px] text-danger-fg">{error || "İstifadəçi tapılmadı"}</div>
      ) : (
        <>
          {/* Header */}
          <div className="mb-6 flex items-center gap-3.5">
            <Avatar name={`${data.firstName} ${data.lastName}`} size={48} />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-[22px] font-bold tracking-[-0.4px] text-fg">{data.firstName} {data.lastName}</h2>
                {data.status !== "ACTIVE" && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-surface-2">Deaktiv</span>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-[13px] text-fg-muted">
                <span className="flex items-center gap-1"><Mail size={13} className="text-fg-faint" /> {data.email}</span>
                {data.departmentName && <span>{data.departmentName}</span>}
                <div className="flex flex-wrap gap-1.5">
                  {data.roles.map((r) => <RoleBadge key={r} role={r} />)}
                </div>
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-3">
            <KpiCard icon={<CheckCircle2 size={18} />} tone="green" value={data.completedExams} label="Tamamlanmış imtahan" />
            <KpiCard icon={<TrendingUp size={18} />} tone="amber" value={data.avgScore == null ? "—" : `${data.avgScore}%`} label="Orta nəticə" />
            <KpiCard icon={<Target size={18} />} tone="purple" value={data.passRate == null ? "—" : `${data.passRate}%`} label="Keçmə faizi" />
          </div>

          {/* Exam history */}
          <div className="mb-3 flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-[15px] font-semibold text-fg">
              <ClipboardList size={17} className="text-blue-600 dark:text-blue-400" /> İmtahan tarixçəsi
            </h3>
            <span className="num text-[13px] text-fg-muted">{data.examHistory.length}</span>
          </div>

          {data.examHistory.length === 0 ? (
            <div className="card">
              <EmptyState
                icon={<ClipboardList size={22} />}
                title="Hələ imtahan tamamlanmayıb"
                description="Bu istifadəçi bir imtahanı tamamladıqda burada görünəcək."
              />
            </div>
          ) : (
            <Table headers={["İmtahan", "Bal", "Nəticə", "Tarix"]}>
              {data.examHistory.map((h) => {
                const score = h.score == null ? null : Math.round(h.score);
                return (
                  <Tr key={h.sessionId}>
                    <Td className="font-medium text-fg">{h.examTitle}</Td>
                    <Td>
                      {score == null ? (
                        <span className="text-fg-faint">—</span>
                      ) : (
                        <div className="flex items-center gap-2.5">
                          <span className="num w-9 shrink-0 font-semibold" style={{ color: scoreColor(score) }}>{score}%</span>
                          <ProgressBar value={score} className="max-w-[96px]" height={7} />
                        </div>
                      )}
                    </Td>
                    <Td>
                      {h.passed == null ? (
                        <span className="text-fg-faint">—</span>
                      ) : h.passed ? (
                        <span className="inline-flex rounded-full bg-success-bg px-2.5 py-1 text-[11.5px] font-semibold text-success-fg">Keçdi</span>
                      ) : (
                        <span className="inline-flex rounded-full bg-danger-bg px-2.5 py-1 text-[11.5px] font-semibold text-danger-fg">Keçmədi</span>
                      )}
                    </Td>
                    <Td className="num text-fg-muted">{h.endTime ? formatDateTime(h.endTime) : "—"}</Td>
                  </Tr>
                );
              })}
            </Table>
          )}
        </>
      )}
    </div>
  );
}
