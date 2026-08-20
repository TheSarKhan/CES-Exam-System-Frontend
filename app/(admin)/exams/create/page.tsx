"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { AppSettings } from "@/lib/types";
import { ExamBuilder } from "@/components/exam/ExamBuilder";
import { Loading } from "@/components/ui/Feedback";

const CREATE_DRAFT_ID_KEY = "ces_exam_create_draft_id";

export default function CreateExamPage() {
  const router = useRouter();
  const [defaults, setDefaults] = useState<{ passMark: number; duration: number } | null>(null);
  // Reconnect to a backend draft auto-saved from a previous (e.g. refreshed-away) create
  // session instead of starting blank — null while the localStorage check hasn't run yet.
  const [resumeId, setResumeId] = useState<number | null | undefined>(undefined);

  useEffect(() => {
    const stored = localStorage.getItem(CREATE_DRAFT_ID_KEY);
    if (stored) {
      router.replace(`/exams/${stored}/edit`);
      return;
    }
    setResumeId(null);
  }, [router]);

  useEffect(() => {
    apiFetch<AppSettings>("/api/v1/admin/settings")
      .then((s) => setDefaults({ passMark: s.defaultPassMark, duration: s.defaultDurationMinutes }))
      .catch(() => setDefaults({ passMark: 70, duration: 60 })); // fall back to builder defaults
  }, []);

  return (
    <div className="mx-auto max-w-[1140px]">
      <Link href="/exams" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-fg-muted hover:text-fg">
        <ArrowLeft size={15} /> İmtahanlara qayıt
      </Link>
      <h2 className="mb-4 text-[22px] font-bold tracking-[-0.4px] text-fg">Yeni imtahan</h2>

      {!defaults || resumeId === undefined ? (
        <Loading />
      ) : (
        <ExamBuilder
          mode="create"
          submitLabel="İmtahanı yarat"
          initial={{ passMark: defaults.passMark, duration: defaults.duration }}
        />
      )}
    </div>
  );
}
