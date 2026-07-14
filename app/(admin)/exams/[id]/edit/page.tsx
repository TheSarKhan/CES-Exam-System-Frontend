"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Exam } from "@/lib/types";
import { ExamBuilder, type ExamBuilderInitial } from "@/components/exam/ExamBuilder";
import { Loading } from "@/components/ui/Feedback";

export default function EditExamPage() {
  const params = useParams();
  const id = params.id as string;

  const [initial, setInitial] = useState<ExamBuilderInitial | null>(null);
  const [status, setStatus] = useState<"DRAFT" | "PUBLISHED">("PUBLISHED");
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Exam>(`/api/v1/exams/${id}`)
      .then((ex) => {
        setStatus(ex.status);
        setInitial({
          title: ex.title,
          description: ex.description ?? "",
          examType: ex.type,
          passMark: ex.passMark ?? 70,
          duration: ex.durationMinutes ?? 60,
          questions: (ex.questions ?? []).map((q) => ({
            questionId: q.questionId,
            fromBank: q.fromBank,
            type: q.type,
            text: q.text,
            imageUrl: q.imageUrl ?? null,
            score: q.score,
            options: (q.options ?? []).map((o) => ({ text: o.text, isCorrect: o.isCorrect, imageUrl: o.imageUrl ?? null })),
          })),
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : "İmtahan yüklənmədi"));
  }, [id]);

  const isDraft = status === "DRAFT";

  return (
    <div className="mx-auto max-w-[1140px]">
      <Link href="/exams" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-fg-muted hover:text-fg">
        <ArrowLeft size={15} /> İmtahanlara qayıt
      </Link>
      <h2 className="mb-4 text-[22px] font-bold tracking-[-0.4px] text-fg">{isDraft ? "Qaralamanı davam et" : "İmtahan düzəlişi"}</h2>

      {error && <div className="mb-4 rounded-[11px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-danger-fg">{error}</div>}

      {!initial ? (
        !error && <Loading />
      ) : (
        <ExamBuilder
          mode="edit"
          examId={Number(id)}
          initialStatus={status}
          initial={initial}
          submitLabel={isDraft ? "İmtahanı yarat" : "Yadda saxla"}
        />
      )}
    </div>
  );
}
