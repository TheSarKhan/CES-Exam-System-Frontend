"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Building2, FolderTree, HelpCircle, ArrowRight, ArrowUpFromLine } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useToast } from "@/lib/toast";
import { humanizeError } from "@/lib/errors";
import type { Category, Department } from "@/lib/types";
import { PageHeader } from "@/components/app/PageHeader";
import { buttonClasses } from "@/components/ui/Button";
import { Loading, EmptyState } from "@/components/ui/Feedback";

export default function QuestionBankPage() {
  const toast = useToast();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiFetch<Department[]>("/api/v1/departments"),
      apiFetch<Category[]>("/api/v1/question-bank/categories"),
    ])
      .then(([deps, cats]) => { setDepartments(deps); setCategories(cats); })
      .catch((e) => toast.error(humanizeError(e, "Sual bankı yüklənmədi")))
      .finally(() => setLoading(false));
  }, [toast]);

  // per-department aggregates from the full category list
  const statsByDept = useMemo(() => {
    const m = new Map<number, { categories: number; questions: number }>();
    for (const c of categories) {
      const cur = m.get(c.departmentId) ?? { categories: 0, questions: 0 };
      cur.categories += 1;
      cur.questions += c.questionCount ?? 0;
      m.set(c.departmentId, cur);
    }
    return m;
  }, [categories]);

  return (
    <div className="mx-auto max-w-[1200px]">
      <PageHeader
        title="Sual bankı"
        subtitle="Şöbə seçin, sonra kateqoriya və suallarına baxın"
        action={
          <Link href="/question-bank/import" className={buttonClasses("outline", "md")}>
            <ArrowUpFromLine size={16} /> Toplu idxal
          </Link>
        }
      />

      {loading ? (
        <Loading />
      ) : departments.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Building2 size={22} />}
            title="Şöbə yoxdur"
            description="Sual bankı şöbələr üzrə qurulur. Əvvəlcə Şöbələr bölməsindən şöbə yaradın."
            action={<Link href="/departments" className={buttonClasses("primary", "sm")}>Şöbələrə keç</Link>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((d) => {
            const s = statsByDept.get(d.id) ?? { categories: 0, questions: 0 };
            return (
              <Link
                key={d.id}
                href={`/question-bank/department/${d.id}`}
                className="card group relative flex flex-col p-5 transition-all hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-pop"
              >
                <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-[12px] bg-blue-50 text-blue-600 dark:bg-blue-600/15 dark:text-blue-400">
                  <Building2 size={20} />
                </span>

                <h3 className="text-[16px] font-semibold text-fg">{d.name}</h3>

                <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
                  <div className="flex items-center gap-3 text-[12px] text-fg-muted">
                    <span className="inline-flex items-center gap-1"><FolderTree size={13} className="text-fg-faint" /><span className="num font-semibold text-fg">{s.categories}</span> kateqoriya</span>
                    <span className="inline-flex items-center gap-1"><HelpCircle size={13} className="text-fg-faint" /><span className="num font-semibold text-fg">{s.questions}</span> sual</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[12px] font-medium text-blue-600 dark:text-blue-400">
                    Bax <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
