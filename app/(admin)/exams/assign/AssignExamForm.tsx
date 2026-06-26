"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Copy, Check, User as UserIcon, Building2, Link2 } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Department, Exam, ExamAssignmentResult, User } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { FieldGroup, Select } from "@/components/ui/Field";
import { Button, buttonClasses } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

function toLocal(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

export default function AssignExamForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const preExam = sp.get("examId") ?? "";

  const [exams, setExams] = useState<Exam[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [examId, setExamId] = useState(preExam);
  const [type, setType] = useState<"user" | "department">("user");
  const [userId, setUserId] = useState("");
  const [deptId, setDeptId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ExamAssignmentResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([
      apiFetch<Exam[]>("/api/v1/exams"),
      apiFetch<User[]>("/api/v1/users"),
      apiFetch<Department[]>("/api/v1/departments"),
    ])
      .then(([e, u, d]) => { setExams(e); setUsers(u.filter((x) => x.status === "ACTIVE")); setDepartments(d); })
      .catch((e) => setError(e.message));
    const now = new Date();
    setStartDate(toLocal(now.toISOString()));
    setEndDate(toLocal(new Date(now.getTime() + 7 * 864e5).toISOString()));
  }, []);

  useEffect(() => { if (preExam) setExamId(preExam); }, [preExam]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const r = await apiFetch<ExamAssignmentResult>("/api/v1/exams/assign", {
        method: "POST",
        body: JSON.stringify({
          examId: Number(examId),
          userId: type === "user" ? Number(userId) : null,
          departmentId: type === "department" ? Number(deptId) : null,
          startDate: startDate ? `${startDate}:00` : null,
          endDate: endDate ? `${endDate}:00` : null,
        }),
      });
      if (r.accessToken) setResult(r);
      else router.push("/exams");
    } catch (e) {
      setError(e instanceof Error ? e.message : "İmtahan təyin edilmədi");
      setSubmitting(false);
    }
  };

  const magicLink =
    result?.accessToken && typeof window !== "undefined" ? `${window.location.origin}/exam/token/${result.accessToken}` : "";

  const copy = async () => {
    if (!magicLink) return;
    await navigator.clipboard.writeText(magicLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (result?.accessToken) {
    return (
      <div className="mx-auto max-w-[640px]">
        <h2 className="mb-5 text-[22px] font-bold tracking-[-0.4px] text-fg">İmtahan təyin edildi</h2>
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2.5 text-success-fg">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-success-bg"><Check size={18} /></span>
            <span className="text-[14px] font-medium">
              <b>{result.examTitle}</b> — <b>{result.candidateName}</b> üçün hazırdır.
            </span>
          </div>
          <p className="mb-4 text-[13.5px] text-fg-muted">Bu birdəfəlik linki namizədlə paylaşın. Giriş tələb olunmur.</p>
          <div className="mb-4 flex items-center gap-2 break-all rounded-[10px] border border-line bg-surface-2 px-3.5 py-3 text-[13px] text-fg-soft">
            <Link2 size={15} className="shrink-0 text-fg-faint" /> {magicLink}
          </div>
          <div className="flex gap-3">
            <Button icon={copied ? <Check size={16} /> : <Copy size={16} />} onClick={copy}>{copied ? "Kopyalandı!" : "Linki kopyala"}</Button>
            <Link href="/exams" className={buttonClasses("secondary", "md")}>İmtahanlara qayıt</Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[760px]">
      <Link href="/exams" className="mb-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-fg-muted hover:text-fg">
        <ArrowLeft size={15} /> İmtahanlara qayıt
      </Link>
      <h2 className="mb-5 text-[22px] font-bold tracking-[-0.4px] text-fg">İmtahan təyini</h2>

      {error && <div className="mb-4 rounded-[11px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-danger-fg">{error}</div>}

      <Card className="p-6">
        <form onSubmit={submit} className="flex flex-col gap-5">
          <FieldGroup label="İmtahan seçin">
            <Select value={examId} onChange={(e) => setExamId(e.target.value)} required>
              <option value="">— İmtahan seçin —</option>
              {exams.map((ex) => <option key={ex.id} value={ex.id}>{ex.title}</option>)}
            </Select>
          </FieldGroup>

          <FieldGroup label="Kimə təyin edilsin">
            <div className="grid grid-cols-2 gap-3">
              {([
                { v: "user", label: "Fərdi istifadəçi", icon: <UserIcon size={18} /> },
                { v: "department", label: "Bütün şöbə", icon: <Building2 size={18} /> },
              ] as const).map((o) => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => setType(o.v)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-[12px] border-2 py-5 text-[13.5px] font-medium transition-colors",
                    type === o.v ? "border-blue-600 bg-blue-50 text-blue-700 dark:bg-blue-600/10" : "border-line text-fg-muted hover:bg-surface-2",
                  )}
                >
                  {o.icon}
                  {o.label}
                </button>
              ))}
            </div>
          </FieldGroup>

          {type === "user" ? (
            <FieldGroup label="İstifadəçi seçin">
              <Select value={userId} onChange={(e) => setUserId(e.target.value)} required>
                <option value="">— İstifadəçi seçin —</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email}){u.departmentName ? ` — ${u.departmentName}` : ""}</option>
                ))}
              </Select>
            </FieldGroup>
          ) : (
            <FieldGroup label="Şöbə seçin">
              <Select value={deptId} onChange={(e) => setDeptId(e.target.value)} required>
                <option value="">— Şöbə seçin —</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </Select>
            </FieldGroup>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FieldGroup label="Başlama tarixi">
              <input type="datetime-local" className="field num" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
            </FieldGroup>
            <FieldGroup label="Son tarix">
              <input type="datetime-local" className="field num" value={endDate} onChange={(e) => setEndDate(e.target.value)} required />
            </FieldGroup>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Link href="/exams" className={buttonClasses("secondary", "md")}>Ləğv et</Link>
            <Button type="submit" loading={submitting}>Təyin et</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
