"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft, Users, CheckCircle2, Clock, TrendingUp, Link2, Check, BarChart3,
  Eye, X, ClipboardCheck, Loader2, Minus, AlertCircle, ShieldAlert, PieChart, Hourglass, Mail, Send,
} from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Exam, ExamResults, ExamResultPendingLink, SessionResult, SessionAnswerResult, Violation } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { KpiCard } from "@/components/ui/DataViz";
import { Table, Tr, Td } from "@/components/ui/Table";
import { Loading, EmptyState, Modal } from "@/components/ui/Feedback";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { ShareActions } from "@/components/exam/ShareActions";
import { questionTypeLabel } from "@/components/exam/QuestionInput";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";

type AnswerStatus = "pending" | "correct" | "partial" | "wrong" | "neutral";

function answerStatus(a: SessionAnswerResult): AnswerStatus {
  if (a.needsGrading) return "pending";
  if (a.isCorrect == null && a.awardedScore == null) return "neutral"; // e.g. survey free-text
  const earned = a.awardedScore ?? (a.isCorrect ? a.score : 0);
  if (earned >= a.score) return "correct";
  if (earned > 0) return "partial";
  return "wrong";
}

export default function ExamResultsPage() {
  const params = useParams();
  const id = params.id as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [results, setResults] = useState<ExamResults | null>(null);
  const [error, setError] = useState("");
  const [answers, setAnswers] = useState<{ userName: string; result: SessionResult } | null>(null);
  const [loadingAnswers, setLoadingAnswers] = useState<number | null>(null);
  const [violations, setViolations] = useState<Violation[]>([]);

  // manual grading
  const [grades, setGrades] = useState<Record<number, string>>({});
  const [savingGrades, setSavingGrades] = useState(false);
  const [gradeError, setGradeError] = useState("");

  // e-mail invite (server-side send / resend)
  const [inviteFor, setInviteFor] = useState<ExamResultPendingLink | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSentFor, setInviteSentFor] = useState<number | null>(null);

  const loadResults = useCallback(() => {
    return apiFetch<ExamResults>(`/api/v1/exams/${id}/results`)
      .then((r) => setResults(r))
      .catch((e) => setError(e instanceof Error ? e.message : "Nəticələr yüklənmədi"));
  }, [id]);

  useEffect(() => {
    Promise.all([
      apiFetch<Exam>(`/api/v1/exams/${id}`),
      apiFetch<ExamResults>(`/api/v1/exams/${id}/results`),
    ])
      .then(([e, r]) => { setExam(e); setResults(r); })
      .catch((e) => setError(e instanceof Error ? e.message : "Nəticələr yüklənmədi"));
  }, [id]);

  const openAnswers = async (sessionId: number, userName: string) => {
    setLoadingAnswers(sessionId);
    setError("");
    setGrades({});
    setGradeError("");
    setViolations([]);
    try {
      const [r, v] = await Promise.all([
        apiFetch<SessionResult>(`/api/v1/exams/sessions/${sessionId}/result`),
        apiFetch<Violation[]>(`/api/v1/exams/sessions/${sessionId}/violations`).catch(() => [] as Violation[]),
      ]);
      setAnswers({ userName, result: r });
      setViolations(v);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Cavablar yüklənmədi");
    } finally {
      setLoadingAnswers(null);
    }
  };

  const setGrade = (questionId: number, value: string) =>
    setGrades((g) => ({ ...g, [questionId]: value }));

  const saveGrades = async () => {
    if (!answers) return;
    const payload = answers.result.answers
      .filter((a) => a.needsGrading)
      .map((a) => ({ questionId: a.questionId, raw: grades[a.questionId] }))
      .filter((g) => g.raw !== undefined && g.raw !== "")
      .map((g) => ({ questionId: g.questionId, awardedScore: Number(g.raw) }))
      .filter((g) => !Number.isNaN(g.awardedScore));

    if (payload.length === 0) {
      setGradeError("Ən azı bir cavaba bal verin.");
      return;
    }
    setSavingGrades(true);
    setGradeError("");
    try {
      const updated = await apiFetch<SessionResult>(
        `/api/v1/exams/sessions/${answers.result.sessionId}/grade`,
        { method: "PUT", body: JSON.stringify({ grades: payload }) },
      );
      setAnswers((prev) => (prev ? { ...prev, result: updated } : prev));
      setGrades({});
      // refresh table scores + pending badges, and the KPI cards (avg/pass rate change)
      await Promise.all([
        loadResults(),
        apiFetch<Exam>(`/api/v1/exams/${id}`).then(setExam).catch(() => {}),
      ]);
    } catch (e) {
      setGradeError(e instanceof Error ? e.message : "Qiymətləndirmə yadda saxlanmadı");
    } finally {
      setSavingGrades(false);
    }
  };

  const openInvite = (l: ExamResultPendingLink) => {
    setInviteFor(l);
    setInviteEmail(l.recipientEmail ?? "");
    setInviteError("");
  };

  const sendInvite = async () => {
    if (!inviteFor) return;
    const email = inviteEmail.trim();
    if (!email) { setInviteError("E-poçt ünvanını daxil edin."); return; }
    setInviteSending(true);
    setInviteError("");
    try {
      await apiFetch<void>(`/api/v1/exams/assignments/${inviteFor.assignmentId}/send-invite`, {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setInviteSentFor(inviteFor.assignmentId);
      setInviteFor(null);
      await loadResults();
      setTimeout(() => setInviteSentFor(null), 4000);
    } catch (e) {
      setInviteError(e instanceof Error ? e.message : "E-poçt göndərilmədi");
    } finally {
      setInviteSending(false);
    }
  };

  const ready = exam && results;
  const pendingInModal = answers ? answers.result.answers.filter((a) => a.needsGrading).length : 0;

  return (
    <div className="mx-auto max-w-[1100px]">
      <div className="mb-3 flex items-center justify-between">
        <Link href="/exams" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-fg-muted hover:text-fg">
          <ArrowLeft size={15} /> İmtahanlara qayıt
        </Link>
        <Link href={`/exams/${id}/analytics`} className="inline-flex items-center gap-1.5 text-[13px] font-medium text-purple-600 hover:underline">
          <PieChart size={15} /> Analitika
        </Link>
      </div>

      {error && <div className="mb-4 rounded-[11px] border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-[13px] text-danger-fg">{error}</div>}

      {!ready ? (
        !error && <Loading />
      ) : (
        <>
          <div className="mb-5 flex items-center gap-2.5">
            <BarChart3 size={20} className="text-blue-600" />
            <h2 className="text-[22px] font-bold tracking-[-0.4px] text-fg">{results.examTitle}</h2>
          </div>

          {/* stats */}
          <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard icon={<Users size={19} />} tone="blue" value={exam.stats?.assigned ?? 0} label="Təyin olunub" />
            <KpiCard icon={<CheckCircle2 size={19} />} tone="green" value={exam.stats?.completed ?? 0} label="Bitirib" />
            <KpiCard icon={<Clock size={19} />} tone="amber" value={exam.stats?.inProgress ?? 0} label="Davam edir" />
            <KpiCard
              icon={<TrendingUp size={19} />}
              tone="purple"
              value={exam.stats?.avgScore != null ? `${exam.stats.avgScore}%` : "—"}
              label={exam.stats?.passRate != null ? `Orta · keçid ${exam.stats.passRate}%` : "Orta nəticə"}
            />
          </div>

          {/* sessions */}
          <Card className="mb-6 p-0">
            <div className="border-b border-line px-5 py-4">
              <h3 className="text-[15px] font-semibold text-fg">İştirakçılar</h3>
            </div>
            {results.sessions.length === 0 ? (
              <EmptyState icon={<Users size={22} />} title="Hələ iştirak yoxdur" description="Kimsə imtahana başlayanda burada görünəcək." />
            ) : (
              <Table headers={["Ad", "Status", "Bal", "Nəticə", "Başlama", "Bitmə", ""]}>
                {results.sessions.map((s) => (
                  <Tr key={s.sessionId}>
                    <Td className="font-semibold text-fg">{s.userName}</Td>
                    <Td>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className={cn(
                          "inline-flex rounded-full px-2.5 py-1 text-[11.5px] font-semibold",
                          s.status === "COMPLETED" ? "bg-success-bg text-success-fg" : "bg-warning-bg text-warning-fg",
                        )}>
                          {s.status === "COMPLETED" ? "Bitib" : "Davam edir"}
                        </span>
                        {s.pendingGrading > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                            <AlertCircle size={12} /> {s.pendingGrading} yoxlanılır
                          </span>
                        )}
                        {s.violationCount > 0 && (
                          <span
                            className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-[11px] font-semibold text-red-700 dark:bg-red-500/10 dark:text-red-400"
                            title="Proktorinq pozuntuları"
                          >
                            <ShieldAlert size={12} /> {s.violationCount}
                          </span>
                        )}
                      </div>
                    </Td>
                    <Td className="num">
                      {s.score != null ? (
                        <span className={s.pendingGrading > 0 ? "text-amber-600 dark:text-amber-400" : ""}>
                          {s.pendingGrading > 0 ? "~" : ""}{s.score}%
                        </span>
                      ) : "—"}
                    </Td>
                    <Td>
                      {s.pendingGrading > 0 ? (
                        <span className="text-fg-faint">gözləyir</span>
                      ) : s.passed == null ? (
                        <span className="text-fg-faint">—</span>
                      ) : s.passed ? (
                        <span className="font-semibold text-success-fg">Keçdi</span>
                      ) : (
                        <span className="font-semibold text-danger-fg">Kəsildi</span>
                      )}
                    </Td>
                    <Td className="num text-fg-muted">{formatDateTime(s.startTime)}</Td>
                    <Td className="num text-fg-muted">{formatDateTime(s.endTime)}</Td>
                    <Td>
                      {s.status === "COMPLETED" && (
                        <button
                          onClick={() => openAnswers(s.sessionId, s.userName)}
                          disabled={loadingAnswers === s.sessionId}
                          className={cn(
                            "inline-flex items-center gap-1.5 text-[13px] font-medium hover:underline disabled:opacity-50",
                            s.pendingGrading > 0 ? "text-amber-600 dark:text-amber-400" : "text-blue-600",
                          )}
                        >
                          {loadingAnswers === s.sessionId ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : s.pendingGrading > 0 ? (
                            <ClipboardCheck size={14} />
                          ) : (
                            <Eye size={14} />
                          )}
                          {s.pendingGrading > 0 ? "Qiymətləndir" : "Cavablar"}
                        </button>
                      )}
                    </Td>
                  </Tr>
                ))}
              </Table>
            )}
          </Card>

          {/* pending links */}
          {results.pendingLinks.length > 0 && (
            <Card className="p-0">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <div>
                  <h3 className="text-[15px] font-semibold text-fg">İstifadə olunmamış linklər</h3>
                  <p className="mt-0.5 text-[12.5px] text-fg-muted">Hələ açılmamış tək-istifadəlik linklər. Açıldıqdan sonra yuxarıdakı cədvəldə görünür.</p>
                </div>
                <span className="num shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[12px] font-semibold text-blue-700 dark:bg-blue-600/15 dark:text-blue-300">
                  {results.pendingLinks.length}
                </span>
              </div>
              <div className="flex flex-col gap-2.5 p-4">
                {results.pendingLinks.map((l) => {
                  const expired = l.endDate ? new Date(l.endDate).getTime() < Date.now() : false;
                  return (
                    <div key={l.assignmentId} className="flex flex-wrap items-center justify-between gap-3 rounded-[11px] border border-line p-3.5">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px] bg-blue-50 text-blue-600 dark:bg-blue-600/10"><Link2 size={16} /></span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-[13.5px] font-medium text-fg">{l.candidateName || "Anonim namizəd"}</span>
                            {expired ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-danger-bg px-2 py-0.5 text-[10.5px] font-semibold text-danger-fg"><AlertCircle size={11} /> Vaxtı bitib</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10.5px] font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"><Hourglass size={10} /> Gözləyir</span>
                            )}
                          </div>
                          {l.endDate && <div className="num text-[11.5px] text-fg-faint">Son tarix: {formatDateTime(l.endDate)}</div>}
                          {l.recipientEmail && (
                            <div className="mt-0.5 flex items-center gap-1 text-[11.5px] text-fg-muted">
                              <Mail size={11} /> {l.recipientEmail}
                              {inviteSentFor === l.assignmentId && <span className="text-success-fg">· göndərildi ✓</span>}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <button
                          onClick={() => openInvite(l)}
                          className="inline-flex items-center gap-1.5 rounded-[8px] border border-line px-2.5 py-1.5 text-[12.5px] font-medium text-fg-muted transition-colors hover:bg-surface-2 hover:text-fg"
                          title={l.recipientEmail ? "E-poçtu yenidən göndər" : "E-poçtla göndər"}
                        >
                          <Send size={14} /> {l.recipientEmail ? "Yenidən göndər" : "E-poçtla göndər"}
                        </button>
                        <ShareActions
                          layout="row"
                          token={l.accessToken}
                          examTitle={results.examTitle}
                          candidateName={l.candidateName}
                          endDate={l.endDate}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </>
      )}

      {/* e-mail invite modal */}
      <Modal
        open={!!inviteFor}
        onClose={() => { if (!inviteSending) setInviteFor(null); }}
        icon={<Mail size={20} />}
        title={inviteFor?.recipientEmail ? "E-poçtu yenidən göndər" : "Linki e-poçtla göndər"}
        footer={
          <>
            <Button variant="secondary" onClick={() => setInviteFor(null)} disabled={inviteSending}>Ləğv et</Button>
            <Button icon={<Send size={15} />} loading={inviteSending} onClick={sendInvite}>Göndər</Button>
          </>
        }
      >
        <div className="flex flex-col gap-3 pt-1">
          <p className="text-[13px] text-fg-muted">
            <b>{results?.examTitle}</b> imtahanının tək-istifadəlik linki bu ünvana göndəriləcək.
          </p>
          <Input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="namized@example.com"
            onKeyDown={(e) => { if (e.key === "Enter") sendInvite(); }}
          />
          {inviteError && (
            <div className="rounded-[9px] border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-[12.5px] text-danger-fg">{inviteError}</div>
          )}
        </div>
      </Modal>

      {/* answer review + manual grading */}
      {answers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]" onClick={() => setAnswers(null)}>
          <div className="flex max-h-[88vh] w-full max-w-[680px] flex-col overflow-hidden rounded-[16px] bg-surface shadow-[0_12px_32px_rgba(15,23,42,0.18)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <div>
                <h3 className="text-[16px] font-semibold text-fg">{answers.userName} — Cavablar</h3>
                <p className="num mt-0.5 text-[12.5px] text-fg-muted">
                  {pendingInModal > 0 ? "~" : ""}Nəticə {answers.result.score}%
                  {answers.result.maxScore != null && answers.result.earnedScore != null && (
                    <> · {answers.result.earnedScore}/{answers.result.maxScore} bal</>
                  )}
                  {pendingInModal === 0 && answers.result.passed != null && (
                    <> · <span className={answers.result.passed ? "text-success-fg" : "text-danger-fg"}>{answers.result.passed ? "Keçdi" : "Kəsildi"}</span></>
                  )}
                </p>
              </div>
              <button onClick={() => setAnswers(null)} className="rounded-md p-1 text-fg-muted hover:text-fg"><X size={18} /></button>
            </div>

            {pendingInModal > 0 && (
              <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-5 py-2.5 text-[12.5px] text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
                <AlertCircle size={15} className="shrink-0" />
                {pendingInModal} açıq sual qiymətləndirilməlidir. Bal verdikcə nəticə avtomatik yenilənəcək.
              </div>
            )}

            <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-5">
              {violations.length > 0 && (
                <div className="rounded-[11px] border border-red-200 bg-red-50/60 p-4 dark:border-red-500/20 dark:bg-red-500/5">
                  <p className="mb-2.5 flex items-center gap-1.5 text-[13px] font-semibold text-red-700 dark:text-red-400">
                    <ShieldAlert size={15} /> Proktorinq qeydləri ({violations.length})
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {violations.map((v, i) => (
                      <div key={i} className="flex items-center gap-2.5 text-[12.5px]">
                        <span
                          className={cn(
                            "h-2 w-2 shrink-0 rounded-full",
                            v.severity === "CRITICAL" ? "bg-red-600" : v.severity === "WARNING" ? "bg-amber-500" : "bg-slate-400",
                          )}
                        />
                        <span className="flex-1 text-fg">{v.label || v.type}</span>
                        <span className="num shrink-0 text-fg-faint">{formatDateTime(v.occurredAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {answers.result.answers.length === 0 ? (
                <p className="py-6 text-center text-[13px] text-fg-muted">Cavab qeydə alınmayıb.</p>
              ) : (
                answers.result.answers.map((a, i) => {
                  const given = a.selectedOptionText ?? a.textAnswer;
                  const status = answerStatus(a);
                  const earned = a.awardedScore ?? (a.isCorrect ? a.score : 0);
                  return (
                    <div key={a.questionId} className={cn(
                      "rounded-[11px] border p-4",
                      status === "pending" ? "border-amber-300 dark:border-amber-500/30" : "border-line",
                    )}>
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="num flex h-5 w-5 items-center justify-center rounded-full bg-surface-2 text-[11px] font-semibold text-fg-muted">{i + 1}</span>
                          <span className="rounded-[6px] bg-blue-50 px-1.5 py-0.5 text-[11px] font-semibold text-blue-700 dark:bg-blue-600/10">{questionTypeLabel(a.type)}</span>
                        </div>
                        {status === "pending" ? (
                          <span className="flex items-center gap-1 text-[11.5px] font-semibold text-amber-600 dark:text-amber-400"><Clock size={13} /> Qiymətləndirilməlidir</span>
                        ) : status === "correct" ? (
                          <span className="flex items-center gap-1 text-[11.5px] font-semibold text-success-fg"><Check size={13} /> Düzgün</span>
                        ) : status === "partial" ? (
                          <span className="flex items-center gap-1 text-[11.5px] font-semibold text-amber-600 dark:text-amber-400"><Minus size={13} /> Qismən</span>
                        ) : status === "neutral" ? (
                          <span className="flex items-center gap-1 text-[11.5px] font-medium text-fg-muted"><Check size={13} /> Qeydə alındı</span>
                        ) : (
                          <span className="flex items-center gap-1 text-[11.5px] font-semibold text-danger-fg"><X size={13} /> Səhv</span>
                        )}
                      </div>
                      <p className="text-[13.5px] font-medium text-fg">{a.questionText}</p>
                      <div className={cn(
                        "mt-2 rounded-[8px] border px-3 py-2 text-[13px] text-fg",
                        status === "correct" ? "border-success/20 bg-success-bg dark:bg-emerald-500/10"
                          : status === "partial" ? "border-amber-300/30 bg-amber-50 dark:bg-amber-500/10"
                            : status === "wrong" ? "border-danger/20 bg-danger-bg dark:bg-rose-500/10"
                              : "border-line bg-surface-2",
                      )}>
                        <span className="text-fg-muted">Cavab: </span>
                        <span className="font-medium">{given || "(cavabsız)"}</span>
                      </div>

                      {status === "pending" ? (
                        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3">
                          <span className="text-[12px] text-fg-muted">Bal:</span>
                          <input
                            type="number"
                            min={0}
                            max={a.score}
                            step="0.5"
                            value={grades[a.questionId] ?? ""}
                            onChange={(e) => setGrade(a.questionId, e.target.value)}
                            placeholder="0"
                            className="num h-8 w-20 rounded-[8px] border border-line bg-surface px-2.5 text-[13px] text-fg focus:border-blue-400 focus:outline-none"
                          />
                          <span className="num text-[12px] text-fg-faint">/ {a.score}</span>
                          <div className="ml-auto flex gap-1.5">
                            <button
                              type="button"
                              onClick={() => setGrade(a.questionId, String(a.score))}
                              className="rounded-[7px] border border-line px-2.5 py-1 text-[11.5px] font-medium text-success-fg hover:bg-success-bg"
                            >
                              Tam bal
                            </button>
                            <button
                              type="button"
                              onClick={() => setGrade(a.questionId, "0")}
                              className="rounded-[7px] border border-line px-2.5 py-1 text-[11.5px] font-medium text-danger-fg hover:bg-danger-bg"
                            >
                              Sıfır
                            </button>
                          </div>
                        </div>
                      ) : status === "neutral" ? null : (
                        <div className="mt-2 flex justify-end">
                          <span className="num text-[12.5px] font-semibold text-fg">{earned} / {a.score} bal</span>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {pendingInModal > 0 && (
              <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3.5">
                <span className="text-[12px] text-danger-fg">{gradeError}</span>
                <button
                  onClick={saveGrades}
                  disabled={savingGrades}
                  className="inline-flex items-center gap-1.5 rounded-[9px] bg-blue-600 px-4 py-2 text-[13px] font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {savingGrades ? <Loader2 size={15} className="animate-spin" /> : <ClipboardCheck size={15} />}
                  Qiymətləndirməni yadda saxla
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
