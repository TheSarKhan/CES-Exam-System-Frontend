"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { publicFetch } from "@/lib/publicApi";
import type { SessionStart, SessionQuestion } from "@/lib/types";
import styles from "../../../../employee/employee.module.css";

type AnswerState = Record<number, { selectedOptionId?: number; textAnswer?: string }>;

function CountdownTimer({
  startTime,
  durationMinutes,
  onExpire,
}: {
  startTime: string;
  durationMinutes: number | null;
  onExpire: () => void;
}) {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    if (!durationMinutes) return;
    const endMs = new Date(startTime).getTime() + durationMinutes * 60 * 1000;
    const tick = () => {
      const left = Math.max(0, endMs - Date.now());
      setRemaining(left);
      if (left === 0) onExpire();
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTime, durationMinutes, onExpire]);

  if (remaining === null) return null;
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  return (
    <div className={styles.timer}>
      Time left: {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
    </div>
  );
}

function QuestionInput({
  question,
  answer,
  onChange,
}: {
  question: SessionQuestion;
  answer?: { selectedOptionId?: number; textAnswer?: string };
  onChange: (a: { selectedOptionId?: number; textAnswer?: string }) => void;
}) {
  const type = question.type;
  if (type === "SHORT_TEXT" || type === "LONG_TEXT") {
    return (
      <textarea
        className={styles.textarea}
        value={answer?.textAnswer ?? ""}
        onChange={(e) => onChange({ textAnswer: e.target.value })}
        rows={type === "LONG_TEXT" ? 8 : 3}
        placeholder="Your answer..."
      />
    );
  }
  return (
    <div>
      {question.options?.map((opt) => (
        <label key={opt.id} className={styles.option}>
          <input
            type="radio"
            name={`q-${question.id}`}
            checked={answer?.selectedOptionId === opt.id}
            onChange={() => onChange({ selectedOptionId: opt.id })}
          />
          <span>{opt.text}</span>
        </label>
      ))}
    </div>
  );
}

export default function CandidateTakeExamPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;
  const sessionId = Number(params.sessionId);

  const [session, setSession] = useState<SessionStart | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submitExam = useCallback(async () => {
    if (!session || submitting) return;
    setSubmitting(true);
    try {
      const payload = {
        answers: session.questions.map((q) => ({
          questionId: q.id,
          selectedOptionId: answers[q.id]?.selectedOptionId ?? null,
          textAnswer: answers[q.id]?.textAnswer ?? null,
        })),
      };
      await publicFetch(`/api/v1/public/exam-token/${token}/sessions/${sessionId}/submit`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
      router.push(`/exam/token/${token}/${sessionId}/result`);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Submit failed");
      setSubmitting(false);
    }
  }, [session, sessionId, token, answers, router, submitting]);

  useEffect(() => {
    publicFetch<SessionStart>(`/api/v1/public/exam-token/${token}/sessions/${sessionId}`)
      .then(setSession)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token, sessionId]);

  if (loading) return <p>Loading exam...</p>;
  if (error || !session) {
    return (
      <div>
        <div className={styles.error}>{error || "Session not found"}</div>
        <a href={`/exam/token/${token}`} className={styles.secondaryBtn} style={{ marginTop: "1rem", display: "inline-block" }}>
          Back
        </a>
      </div>
    );
  }

  const questions = session.questions;
  const current = questions[currentIndex];
  const isAnswered = (q: SessionQuestion) => {
    const a = answers[q.id];
    return a && (a.selectedOptionId != null || (a.textAnswer && a.textAnswer.trim()));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 className={styles.title}>{session.examTitle}</h1>
          <p className={styles.meta}>
            Question {currentIndex + 1} of {questions.length}
          </p>
        </div>
        <CountdownTimer
          startTime={session.startTime}
          durationMinutes={session.durationMinutes}
          onExpire={submitExam}
        />
      </div>

      <div className={styles.examLayout}>
        <aside className={styles.questionNav}>
          <p className={styles.meta} style={{ marginBottom: "0.75rem" }}>Questions</p>
          <div className={styles.questionGrid}>
            {questions.map((q, i) => (
              <button
                key={q.id}
                type="button"
                className={
                  i === currentIndex
                    ? styles.navDotActive
                    : isAnswered(q)
                    ? styles.navDotAnswered
                    : styles.navDot
                }
                onClick={() => setCurrentIndex(i)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </aside>

        <div className={styles.questionPanel}>
          <p className={styles.questionText}>{current.text}</p>
          <QuestionInput
            question={current}
            answer={answers[current.id]}
            onChange={(a) => setAnswers((prev) => ({ ...prev, [current.id]: a }))}
          />

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.secondaryBtn}
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => i - 1)}
            >
              Previous
            </button>
            {currentIndex < questions.length - 1 ? (
              <button type="button" className={styles.primaryBtn} onClick={() => setCurrentIndex((i) => i + 1)}>
                Next
              </button>
            ) : (
              <button type="button" className={styles.primaryBtn} disabled={submitting} onClick={submitExam}>
                {submitting ? "Submitting..." : "Submit Exam"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
