"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { Category, Topic } from "@/lib/types";
import styles from "../../admin.module.css";

interface AvailableTopic {
  id: number;
  name: string;
  category: string;
  maxQuestions: number;
}

interface TopicConfig {
  topicId: number;
  topicName: string;
  questionCount: number;
  maxQuestions: number;
}

export default function CreateExamPage() {
  const router = useRouter();
  const [availableTopics, setAvailableTopics] = useState<AvailableTopic[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [examType, setExamType] = useState("EXAM");
  const [passMark, setPassMark] = useState(70);
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [topicConfigs, setTopicConfigs] = useState<TopicConfig[]>([]);
  const [selectedTopicId, setSelectedTopicId] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch<Category[]>("/api/v1/question-bank/categories")
      .then(async (cats) => {
        const topics: AvailableTopic[] = [];
        for (const cat of cats) {
          const catTopics = await apiFetch<Topic[]>(`/api/v1/question-bank/categories/${cat.id}/topics`);
          for (const t of catTopics) {
            const questions = await apiFetch<unknown[]>(`/api/v1/question-bank/topics/${t.id}/questions`);
            topics.push({
              id: t.id,
              name: t.name,
              category: cat.name,
              maxQuestions: questions.length,
            });
          }
        }
        setAvailableTopics(topics);
      })
      .catch((e) => setError(e.message));
  }, []);

  const handleAddTopic = () => {
    if (!selectedTopicId) return;
    const topic = availableTopics.find((t) => t.id === Number(selectedTopicId));
    if (!topic || topicConfigs.find((tc) => tc.topicId === topic.id)) return;

    setTopicConfigs([
      ...topicConfigs,
      {
        topicId: topic.id,
        topicName: topic.name,
        questionCount: Math.min(5, topic.maxQuestions || 1),
        maxQuestions: topic.maxQuestions,
      },
    ]);
    setSelectedTopicId("");
  };

  const handleRemoveTopic = (topicId: number) => {
    setTopicConfigs(topicConfigs.filter((tc) => tc.topicId !== topicId));
  };

  const handleQuestionCountChange = (topicId: number, count: number) => {
    setTopicConfigs(
      topicConfigs.map((tc) =>
        tc.topicId === topicId ? { ...tc, questionCount: Math.min(Math.max(1, count), tc.maxQuestions) } : tc
      )
    );
  };

  const totalQuestions = topicConfigs.reduce((sum, tc) => sum + tc.questionCount, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (topicConfigs.length === 0) {
      setError("Add at least one topic");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await apiFetch("/api/v1/exams", {
        method: "POST",
        body: JSON.stringify({
          title,
          description: description || null,
          type: examType,
          passMark: examType === "EXAM" ? passMark : null,
          durationMinutes,
          topicConfigs: topicConfigs.map((tc) => ({
            topicId: tc.topicId,
            questionCount: tc.questionCount,
          })),
        }),
      });
      router.push("/exams");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create exam");
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <div className={styles.pageHeader}>
        <div>
          <Link href="/exams" style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "0.5rem", display: "inline-block" }}>
            &larr; Back to Exams
          </Link>
          <h1 className={styles.title}>Create New Exam</h1>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className={styles.card} style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ fontWeight: 600, marginBottom: "1.5rem", fontSize: "1.1rem" }}>General Information</h3>

          <div className={styles.formGroup}>
            <label className={styles.label}>Exam Title</label>
            <input type="text" className={styles.input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Java Developer Assessment Q1" required />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Description</label>
            <textarea className={styles.input} style={{ minHeight: "80px", resize: "vertical" }} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description about this exam..." />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5rem" }}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Type</label>
              <select className={styles.input} value={examType} onChange={(e) => setExamType(e.target.value)}>
                <option value="EXAM">Exam (Scored)</option>
                <option value="SURVEY">Survey (No Score)</option>
              </select>
            </div>
            {examType === "EXAM" && (
              <div className={styles.formGroup}>
                <label className={styles.label}>Pass Mark (%)</label>
                <input type="number" className={styles.input} value={passMark} onChange={(e) => setPassMark(Number(e.target.value))} min={0} max={100} />
              </div>
            )}
            <div className={styles.formGroup}>
              <label className={styles.label}>Duration (minutes)</label>
              <input type="number" className={styles.input} value={durationMinutes} onChange={(e) => setDurationMinutes(Number(e.target.value))} min={1} required />
            </div>
          </div>
        </div>

        <div className={styles.card} style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
            <div>
              <h3 style={{ fontWeight: 600, fontSize: "1.1rem" }}>Topic Configuration</h3>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginTop: "0.25rem" }}>
                Select topics and define how many random questions each topic contributes.
              </p>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--primary-color)" }}>{totalQuestions}</div>
              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Total Questions</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.5rem", padding: "1rem", background: "var(--bg-secondary)", borderRadius: "var(--radius-md)" }}>
            <select className={styles.input} style={{ flex: 1 }} value={selectedTopicId} onChange={(e) => setSelectedTopicId(e.target.value)}>
              <option value="">-- Select a topic to add --</option>
              {availableTopics
                .filter((t) => !topicConfigs.find((tc) => tc.topicId === t.id))
                .map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.category} &gt; {t.name} ({t.maxQuestions} available)
                  </option>
                ))}
            </select>
            <button type="button" onClick={handleAddTopic} className={styles.primaryBtn}>
              + Add Topic
            </button>
          </div>

          {topicConfigs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
              <p>No topics added yet. Select a topic from the dropdown above.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {topicConfigs.map((tc) => (
                <div key={tc.topicId} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "1rem", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 500 }}>{tc.topicName}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Max {tc.maxQuestions} questions available</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <label style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Questions:</label>
                    <input
                      type="number"
                      className={styles.input}
                      style={{ width: "80px", textAlign: "center" }}
                      value={tc.questionCount}
                      onChange={(e) => handleQuestionCountChange(tc.topicId, Number(e.target.value))}
                      min={1}
                      max={tc.maxQuestions}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveTopic(tc.topicId)}
                    style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", padding: "0.5rem", fontSize: "1.25rem", lineHeight: 1 }}
                    title="Remove topic"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
          <Link href="/exams" style={{ padding: "0.75rem 1.5rem", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", color: "var(--text-primary)", textDecoration: "none", fontWeight: 500 }}>
            Cancel
          </Link>
          <button type="submit" className={styles.primaryBtn} style={{ padding: "0.75rem 1.5rem" }} disabled={submitting}>
            {submitting ? "Creating..." : "Create Exam"}
          </button>
        </div>
      </form>
    </div>
  );
}
