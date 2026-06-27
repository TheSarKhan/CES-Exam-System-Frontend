"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Inbox } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { humanizeError } from "@/lib/errors";
import { loadTopicOptions, type TopicOption } from "@/lib/questionBank";
import { QuestionForm } from "@/components/exam/QuestionForm";
import { Card } from "@/components/ui/Card";
import { Loading, EmptyState } from "@/components/ui/Feedback";
import { buttonClasses } from "@/components/ui/Button";

export default function CreateQuestionPage() {
  const router = useRouter();
  const toast = useToast();
  const [topicOptions, setTopicOptions] = useState<TopicOption[] | null>(null);
  const [initialTopicId, setInitialTopicId] = useState<number | undefined>();
  const [backHref, setBackHref] = useState("/question-bank");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get("topicId");
    const cat = params.get("categoryId");
    if (t) setInitialTopicId(Number(t));
    if (cat) setBackHref(`/question-bank/category/${cat}`);
    loadTopicOptions()
      .then((opts) => {
        // When opened from a category, scope the topic picker to that category.
        const scoped = cat ? opts.filter((o) => o.categoryId === Number(cat)) : opts;
        setTopicOptions(scoped);
        if (!t && cat && scoped.length) setInitialTopicId(scoped[0].topicId);
      })
      .catch((e) => toast.error(humanizeError(e, "Mövzular yüklənmədi")));
  }, [toast]);

  return (
    <div className="mx-auto max-w-[820px]">
      <Link href={backHref} className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-fg-muted hover:text-fg">
        <ArrowLeft size={15} /> Sual bankına qayıt
      </Link>
      <h2 className="mb-5 text-[22px] font-bold tracking-[-0.4px] text-fg">Yeni sual</h2>

      {!topicOptions ? (
        <Card className="p-6"><Loading /></Card>
      ) : topicOptions.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Inbox size={22} />}
            title="Mövzu yoxdur"
            description="Sual əlavə etmək üçün əvvəlcə kateqoriyaya mövzu əlavə edin."
            action={<Link href={backHref} className={buttonClasses("primary", "sm")}>Geri qayıt</Link>}
          />
        </Card>
      ) : (
        <QuestionForm
          topicOptions={topicOptions}
          initialTopicId={initialTopicId}
          submitLabel="Sualı yarat"
          onSubmit={async (body) => {
            await apiFetch("/api/v1/question-bank/questions", { method: "POST", body: JSON.stringify(body) });
            toast.success("Sual əlavə edildi");
            router.push(backHref);
          }}
        />
      )}
    </div>
  );
}
