"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Send } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Exam } from "@/lib/types";
import { PageHeader } from "@/components/app/PageHeader";
import { Table, Tr, Td } from "@/components/ui/Table";
import { buttonClasses } from "@/components/ui/Button";
import { Loading } from "@/components/ui/Feedback";

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Exam[]>("/api/v1/exams")
      .then(setExams)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

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

      {loading ? (
        <Loading />
      ) : (
        <Table headers={["Başlıq", "Növ", "Mövzular", "Suallar", "Keçid balı", "Müddət", "Əməliyyat"]}>
          {exams.map((ex) => {
            const topics = ex.topicConfigs?.length ?? 0;
            const total = ex.topicConfigs?.reduce((s, t) => s + t.questionCount, 0) ?? 0;
            return (
              <Tr key={ex.id}>
                <Td className="font-semibold text-fg">{ex.title}</Td>
                <Td>
                  <span
                    className="inline-flex rounded-[7px] px-2.5 py-1 text-[12px] font-semibold"
                    style={
                      ex.type === "EXAM"
                        ? { background: "#EAF1FE", color: "#1D4ED8" }
                        : { background: "#F3E8FF", color: "#7E22CE" }
                    }
                  >
                    {ex.type === "EXAM" ? "İmtahan" : "Sorğu"}
                  </span>
                </Td>
                <Td className="num">{topics}</Td>
                <Td className="num">{total}</Td>
                <Td className="num">{ex.passMark != null ? `${ex.passMark}%` : "—"}</Td>
                <Td className="num">{ex.durationMinutes != null ? `${ex.durationMinutes} dəq` : "—"}</Td>
                <Td>
                  <Link href={`/exams/assign?examId=${ex.id}`} className="text-[13px] font-medium text-success-fg hover:underline">
                    Təyin et
                  </Link>
                </Td>
              </Tr>
            );
          })}
          {exams.length === 0 && (
            <Tr>
              <Td colSpan={7} className="py-10 text-center text-fg-muted">Hələ imtahan yaradılmayıb.</Td>
            </Tr>
          )}
        </Table>
      )}
    </div>
  );
}
