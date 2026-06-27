"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Question } from "@/lib/types";
import { loadTopicOptions, type TopicOption } from "@/lib/questionBank";
import { QuestionForm } from "@/components/exam/QuestionForm";
import { Card } from "@/components/ui/Card";
import { Loading } from "@/components/ui/Feedback";

export default function EditQuestionPage() {
  const router = useRouter();
  const params = useParams();
  const questionId = params.id as string;

  const [topicOptions, setTopicOptions] = useState<TopicOption[] | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      loadTopicOptions(),
      apiFetch<Question>(`/api/v1/question-bank/questions/${questionId}`),
    ])
      .then(([opts, q]) => {
        setTopicOptions(opts);
        setQuestion(q);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Sual yüklənmədi"));
  }, [questionId]);

  const ready = topicOptions && question;

  return (
    <div className="mx-auto max-w-[820px]">
      <Link href="/question-bank" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-fg-muted hover:text-fg">
        <ArrowLeft size={15} /> Sual bankına qayıt
      </Link>
      <h2 className="mb-5 text-[22px] font-bold tracking-[-0.4px] text-fg">Sual düzəlişi</h2>

      {error && <div className="mb-4 rounded-[11px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-danger-fg">{error}</div>}

      {!ready ? (
        !error && <Card className="p-6"><Loading /></Card>
      ) : (
        <QuestionForm
          topicOptions={topicOptions!}
          initialTopicId={question!.topicId}
          initial={{
            type: question!.type,
            text: question!.text,
            imageUrl: question!.imageUrl,
            score: question!.score,
            difficulty: question!.difficulty,
            options: question!.options?.map((o) => ({ text: o.text, isCorrect: o.isCorrect, imageUrl: o.imageUrl })) ?? null,
          }}
          submitLabel="Yadda saxla"
          onSubmit={async (body) => {
            await apiFetch(`/api/v1/question-bank/questions/${questionId}`, { method: "PUT", body: JSON.stringify(body) });
            router.push("/question-bank");
          }}
        />
      )}
    </div>
  );
}
