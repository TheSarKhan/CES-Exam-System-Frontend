"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft, Check, Link2, MonitorSmartphone, Search, Users, Building2, CalendarClock, Plus, Mail, AlertCircle,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { AppSettings, BulkAssignment, Department, Exam, ExamAssignmentResult, User } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { FieldGroup, Input, Select } from "@/components/ui/Field";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { DatePicker } from "@/components/ui/DatePicker";
import { ShareActions } from "@/components/exam/ShareActions";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";

function toLocal(iso: string) {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

const roleLabel = (roles: { name: string }[]) => {
  if (roles.some((r) => r.name.includes("ADMIN"))) return "Admin";
  if (roles.some((r) => r.name.includes("EMPLOYEE"))) return "İşçi";
  return "Namizəd";
};

type Delivery = "link" | "internal";

export default function AssignExamForm() {
  const sp = useSearchParams();
  const preExam = sp.get("examId") ?? "";

  const [exams, setExams] = useState<Exam[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [examId, setExamId] = useState(preExam);
  const [delivery, setDelivery] = useState<Delivery>("link");
  const [candidateName, setCandidateName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [tab, setTab] = useState<"users" | "depts">("users");
  const [selUsers, setSelUsers] = useState<Set<number>>(new Set());
  const [selDepts, setSelDepts] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ExamAssignmentResult | null>(null);
  const [internalDone, setInternalDone] = useState<{ examTitle: string; created: number; skipped: number } | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<Exam[]>("/api/v1/exams"),
      apiFetch<User[]>("/api/v1/users"),
      apiFetch<Department[]>("/api/v1/departments"),
    ])
      .then(([e, u, d]) => { setExams(e); setUsers(u); setDepartments(d); })
      .catch((e) => setError(e.message));

    // Default the validity window from system settings (falls back to 7 days).
    const applyDates = (validityDays: number) => {
      const now = new Date();
      setStartDate(toLocal(now.toISOString()));
      setEndDate(toLocal(new Date(now.getTime() + validityDays * 864e5).toISOString()));
    };
    apiFetch<AppSettings>("/api/v1/admin/settings")
      .then((s) => applyDates(s.defaultLinkValidityDays || 7))
      .catch(() => applyDates(7));
  }, []);

  useEffect(() => { if (preExam) setExamId(preExam); }, [preExam]);

  // Internal delivery targets only real platform users (admins/employees), not link candidates.
  const platformUsers = useMemo(
    () => users.filter((u) =>
      u.status === "ACTIVE" &&
      u.roles.some((r) => r.name.includes("ADMIN") || r.name.includes("EMPLOYEE"))),
    [users],
  );

  const filteredUsers = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return platformUsers;
    return platformUsers.filter((u) =>
      `${u.firstName} ${u.lastName} ${u.email} ${u.departmentName ?? ""}`.toLowerCase().includes(s));
  }, [platformUsers, search]);

  const filteredDepts = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return departments;
    return departments.filter((d) => d.name.toLowerCase().includes(s));
  }, [departments, search]);

  const toggleUser = (id: number) =>
    setSelUsers((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleDept = (id: number) =>
    setSelDepts((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const selectedTotal = selUsers.size + selDepts.size;

  const dateError =
    startDate && endDate && new Date(endDate) <= new Date(startDate)
      ? "Son tarix başlama tarixindən sonra olmalıdır."
      : "";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (delivery === "internal" && selectedTotal === 0) { setError("Ən azı bir istifadəçi və ya şöbə seçin."); return; }
    if (dateError) { setError(dateError); return; }
    setSubmitting(true);
    try {
      const dates = { startDate: startDate ? `${startDate}:00` : null, endDate: endDate ? `${endDate}:00` : null };
      if (delivery === "link") {
        const r = await apiFetch<ExamAssignmentResult>("/api/v1/exams/assign", {
          method: "POST",
          body: JSON.stringify({
            examId: Number(examId),
            mode: "LINK",
            candidateName: candidateName.trim() || null,
            recipientEmail: recipientEmail.trim() || null,
            ...dates,
          }),
        });
        setResult(r);
      } else {
        const r = await apiFetch<BulkAssignment>("/api/v1/exams/assign-internal", {
          method: "POST",
          body: JSON.stringify({ examId: Number(examId), userIds: [...selUsers], departmentIds: [...selDepts], ...dates }),
        });
        setInternalDone({ examTitle: exams.find((x) => x.id === Number(examId))?.title ?? "İmtahan", created: r.created, skipped: r.skipped });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "İmtahan təyin edilmədi");
      setSubmitting(false);
    }
  };

  // Reset back to a blank form to issue another link for the same exam.
  const issueAnother = () => {
    setResult(null);
    setCandidateName("");
    setRecipientEmail("");
    setError("");
    setSubmitting(false);
  };

  // ---- result: link ----
  if (result?.accessToken) {
    const deadline = endDate ? `${endDate}:00` : null;
    return (
      <div className="mx-auto max-w-[640px]">
        <h2 className="mb-5 text-[22px] font-bold tracking-[-0.4px] text-fg">İmtahan linki hazırdır</h2>
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2.5 text-success-fg">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-success-bg"><Check size={18} /></span>
            <span className="text-[14px] font-medium">
              <b>{result.examTitle}</b>{result.candidateName ? <> — <b>{result.candidateName}</b> üçün</> : null} hazırdır.
            </span>
          </div>
          <p className="mb-4 text-[13.5px] text-fg-muted">
            Bu <b>tək istifadəlik</b> linki namizədlə paylaşın. Giriş tələb olunmur — bir dəfə işlədildikdən sonra link etibarsız olur{result.candidateName ? "" : "; namizəd açanda adını özü daxil edəcək"}.
          </p>

          {deadline && (
            <div className="mb-4 inline-flex items-center gap-1.5 rounded-[8px] bg-amber-50 px-3 py-1.5 text-[12.5px] font-medium text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
              <CalendarClock size={14} /> Son tarix: <span className="num">{formatDateTime(deadline)}</span>
            </div>
          )}

          {result.emailSent === true && (
            <div className="mb-4 flex items-center gap-2 rounded-[10px] border border-[#BBF7D0] bg-[#F0FDF4] px-3.5 py-2.5 text-[13px] text-success-fg">
              <Mail size={15} className="shrink-0" /> Link <b>{result.recipientEmail}</b> ünvanına e-poçtla göndərildi.
            </div>
          )}
          {result.emailSent === false && (
            <div className="mb-4 flex items-center gap-2 rounded-[10px] border border-[#FECACA] bg-[#FEF2F2] px-3.5 py-2.5 text-[13px] text-danger-fg">
              <AlertCircle size={15} className="shrink-0" /> E-poçt göndərilə bilmədi ({result.recipientEmail}). Linki aşağıdan əl ilə paylaşın.
            </div>
          )}

          <ShareActions
            token={result.accessToken}
            examTitle={result.examTitle}
            candidateName={result.candidateName}
            endDate={deadline}
          />

          <div className="mt-5 flex gap-3 border-t border-line pt-5">
            <Button icon={<Plus size={16} />} onClick={issueAnother}>Daha bir link yarat</Button>
            <Link href="/exams" className={buttonClasses("secondary", "md")}>İmtahanlara qayıt</Link>
          </div>
        </Card>
      </div>
    );
  }

  // ---- result: internal ----
  if (internalDone) {
    return (
      <div className="mx-auto max-w-[640px]">
        <h2 className="mb-5 text-[22px] font-bold tracking-[-0.4px] text-fg">İmtahan təyin edildi</h2>
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2.5 text-success-fg">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-success-bg"><Check size={18} /></span>
            <span className="text-[14px] font-medium">
              <b>{internalDone.examTitle}</b> — <b className="num">{internalDone.created}</b> təyinat yaradıldı
              {internalDone.skipped > 0 && <span className="text-fg-muted"> · {internalDone.skipped} təkrar buraxıldı</span>}.
            </span>
          </div>
          <p className="mb-5 text-[13.5px] text-fg-muted">İmtahan təyin olunanların idarə panelində (“Mənim imtahanlarım”) görünəcək. Link lazım deyil — daxil olub iştirak edəcəklər.</p>
          <div className="flex gap-3">
            <Link href="/exams" className={buttonClasses("primary", "md")}>İmtahanlara qayıt</Link>
            <button onClick={() => { setInternalDone(null); setSelUsers(new Set()); setSelDepts(new Set()); }} className={buttonClasses("secondary", "md")}>Daha bir təyinat</button>
          </div>
        </Card>
      </div>
    );
  }

  // ---- form ----
  const DELIVERY_OPTIONS = [
    { v: "link" as const, label: "Link ilə göndər", desc: "Xarici namizədə paylaşılan birdəfəlik link", icon: <Link2 size={19} /> },
    { v: "internal" as const, label: "Platforma daxili", desc: "Platforma istifadəçilərinə / şöbələrə — idarə panelində", icon: <MonitorSmartphone size={19} /> },
  ];

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
              {exams.filter((ex) => ex.status !== "DRAFT").map((ex) => <option key={ex.id} value={ex.id}>{ex.title}</option>)}
            </Select>
          </FieldGroup>

          {/* delivery mode */}
          <FieldGroup label="Çatdırılma üsulu">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {DELIVERY_OPTIONS.map((o) => (
                <button
                  key={o.v}
                  type="button"
                  onClick={() => setDelivery(o.v)}
                  className={cn(
                    "flex items-start gap-3 rounded-[12px] border-2 p-4 text-left transition-colors",
                    delivery === o.v ? "border-blue-600 bg-blue-50 dark:bg-blue-600/10" : "border-line hover:bg-surface-2",
                  )}
                >
                  <span className={cn("mt-0.5 shrink-0", delivery === o.v ? "text-blue-600" : "text-fg-muted")}>{o.icon}</span>
                  <span>
                    <span className={cn("block text-[13.5px] font-semibold", delivery === o.v ? "text-blue-700 dark:text-blue-300" : "text-fg")}>{o.label}</span>
                    <span className="mt-0.5 block text-[12px] text-fg-muted">{o.desc}</span>
                  </span>
                </button>
              ))}
            </div>
          </FieldGroup>

          {/* link target */}
          {delivery === "link" ? (
            <>
              <FieldGroup label="Namizədin adı (ixtiyari)" hint="Boş buraxsanız, namizəd linki açanda adını özü daxil edəcək. Link tək istifadəlikdir.">
                <Input value={candidateName} onChange={(e) => setCandidateName(e.target.value)} placeholder="məs. Aysel Məmmədova" />
              </FieldGroup>
              <FieldGroup
                label="Namizədin e-poçtu (ixtiyari)"
                hint="Doldursanız, link bu ünvana avtomatik e-poçtla göndəriləcək. Boş buraxsanız, linki özünüz paylaşarsınız."
              >
                <div className="relative">
                  <Mail size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="email"
                    className="pl-[36px]"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="məs. aysel@example.com"
                  />
                </div>
              </FieldGroup>
            </>
          ) : (
            <FieldGroup label="Kimə təyin edilsin" hint="Bir neçə istifadəçi və ya şöbə seçə bilərsiniz.">
              {/* tabs */}
              <div className="mb-2.5 flex gap-1.5">
                {([
                  { v: "users", label: "İstifadəçilər", icon: <Users size={15} />, count: selUsers.size },
                  { v: "depts", label: "Şöbələr", icon: <Building2 size={15} />, count: selDepts.size },
                ] as const).map((t) => (
                  <button
                    key={t.v}
                    type="button"
                    onClick={() => { setTab(t.v); setSearch(""); }}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-[9px] px-3 py-2 text-[13px] font-medium transition-colors",
                      tab === t.v ? "bg-blue-600 text-white" : "bg-surface-2 text-fg-muted hover:text-fg",
                    )}
                  >
                    {t.icon} {t.label}
                    {t.count > 0 && <span className={cn("num rounded-full px-1.5 text-[11px]", tab === t.v ? "bg-white/20" : "bg-blue-100 text-blue-700")}>{t.count}</span>}
                  </button>
                ))}
              </div>

              {/* search */}
              <div className="relative mb-2.5">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input className="field !h-9 w-full pl-9 text-[13px]" placeholder={tab === "users" ? "İstifadəçi axtar…" : "Şöbə axtar…"} value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>

              {/* list */}
              <div className="max-h-[330px] overflow-y-auto rounded-[12px] border border-line p-2">
                {tab === "users" ? (
                  filteredUsers.length === 0 ? (
                    <p className="py-8 text-center text-[13px] text-fg-muted">İstifadəçi tapılmadı.</p>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {filteredUsers.map((u) => {
                        const sel = selUsers.has(u.id);
                        const name = `${u.firstName} ${u.lastName}`;
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => toggleUser(u.id)}
                            className={cn(
                              "flex items-center gap-3 rounded-[10px] border p-2.5 text-left transition-colors",
                              sel ? "border-blue-500 bg-blue-50/60 dark:bg-blue-600/10" : "border-transparent hover:bg-surface-2",
                            )}
                          >
                            <Avatar name={name} size={36} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-[13.5px] font-semibold text-fg">{name}</span>
                                <span className="shrink-0 rounded-[5px] bg-slate-100 px-1.5 py-0.5 text-[10.5px] font-semibold text-slate-600 dark:bg-surface-2">{roleLabel(u.roles)}</span>
                              </div>
                              <div className="truncate text-[12px] text-fg-muted">
                                {u.email}{u.departmentName ? <span className="text-fg-faint"> · {u.departmentName}</span> : null}
                              </div>
                            </div>
                            <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border-2", sel ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300")}>
                              {sel && <Check size={13} />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )
                ) : (
                  filteredDepts.length === 0 ? (
                    <p className="py-8 text-center text-[13px] text-fg-muted">Şöbə tapılmadı.</p>
                  ) : (
                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {filteredDepts.map((d) => {
                        const sel = selDepts.has(d.id);
                        const members = platformUsers.filter((u) => u.departmentName === d.name).length;
                        return (
                          <button
                            key={d.id}
                            type="button"
                            onClick={() => toggleDept(d.id)}
                            className={cn(
                              "flex items-center gap-2.5 rounded-[10px] border p-2.5 text-left transition-colors",
                              sel ? "border-blue-500 bg-blue-50/60 dark:bg-blue-600/10" : "border-line hover:bg-surface-2",
                            )}
                          >
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-blue-50 text-blue-600 dark:bg-blue-600/10"><Building2 size={17} /></span>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-[13.5px] font-semibold text-fg">{d.name}</div>
                              <div className="num text-[11.5px] text-fg-muted">{members} üzv</div>
                            </div>
                            <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-[6px] border-2", sel ? "border-blue-600 bg-blue-600 text-white" : "border-slate-300")}>
                              {sel && <Check size={13} />}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )
                )}
              </div>

              {selectedTotal > 0 && (
                <p className="mt-2 text-[12.5px] text-fg-muted">
                  Seçildi: {selUsers.size > 0 && <b className="num text-fg">{selUsers.size}</b>}{selUsers.size > 0 && " istifadəçi"}
                  {selUsers.size > 0 && selDepts.size > 0 && " · "}
                  {selDepts.size > 0 && <b className="num text-fg">{selDepts.size}</b>}{selDepts.size > 0 && " şöbə"}
                </p>
              )}
            </FieldGroup>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FieldGroup label="Başlama tarixi">
              <DatePicker value={startDate} onChange={setStartDate} withTime />
            </FieldGroup>
            <FieldGroup label="Son tarix" error={dateError}>
              <DatePicker value={endDate} onChange={setEndDate} withTime />
            </FieldGroup>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Link href="/exams" className={buttonClasses("secondary", "md")}>Ləğv et</Link>
            <Button type="submit" loading={submitting} disabled={!!dateError}>{delivery === "link" ? "Link yarat" : `Təyin et${selectedTotal > 0 ? ` (${selectedTotal})` : ""}`}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
