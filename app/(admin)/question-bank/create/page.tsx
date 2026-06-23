"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import type { Category, Topic } from "@/lib/types";
import styles from "../../admin.module.css";

interface TopicOption {
  id: number;
  label: string;
}

export default function CreateQuestionPage() {
  const router = useRouter();
  const [topics, setTopics] = useState<TopicOption[]>([]);
  const [topicId, setTopicId] = useState("");
  const [qType, setQType] = useState("SINGLE_CHOICE");
  const [qText, setQText] = useState("");
  const [score, setScore] = useState(1.0);
  const [tfCorrect, setTfCorrect] = useState<"true" | "false">("true");
  const [options, setOptions] = useState([
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    apiFetch<Category[]>("/api/v1/question-bank/categories")
      .then(async (cats) => {
        const allTopics: TopicOption[] = [];
        for (const cat of cats) {
          const catTopics = await apiFetch<Topic[]>(`/api/v1/question-bank/categories/${cat.id}/topics`);
          catTopics.forEach((t) => {
            allTopics.push({ id: t.id, label: `${cat.name} > ${t.name}` });
          });
        }
        setTopics(allTopics);
        if (allTopics.length > 0) setTopicId(String(allTopics[0].id));
      })
      .catch((e) => setError(e.message));
  }, []);

  const handleAddOption = () => {
    setOptions([...options, { text: "", isCorrect: false }]);
  };

  const handleOptionChange = (index: number, field: "text" | "isCorrect", value: string | boolean) => {
    const newOptions = [...options];
    if (field === "isCorrect" && qType === "SINGLE_CHOICE" && value === true) {
      newOptions.forEach((o) => (o.isCorrect = false));
    }
    newOptions[index] = { ...newOptions[index], [field]: value };
    setOptions(newOptions);
  };

  const buildOptions = () => {
    if (qType === "TRUE_FALSE") {
      return [
        { text: "True", isCorrect: tfCorrect === "true", sortOrder: 0 },
        { text: "False", isCorrect: tfCorrect === "false", sortOrder: 1 },
      ];
    }
    if (qType === "SINGLE_CHOICE" || qType === "MULTIPLE_CHOICE") {
      return options.map((o, i) => ({ text: o.text, isCorrect: o.isCorrect, sortOrder: i }));
    }
    return undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicId) {
      setError("Select a topic");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await apiFetch("/api/v1/question-bank/questions", {
        method: "POST",
        body: JSON.stringify({
          topicId: Number(topicId),
          type: qType,
          text: qText,
          score,
          options: buildOptions(),
        }),
      });
      router.push("/question-bank");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create question");
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div className={styles.pageHeader}>
        <div>
          <Link href="/question-bank" style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "0.5rem", display: "inline-block" }}>
            &larr; Back to Question Bank
          </Link>
          <h1 className={styles.title}>Create New Question</h1>
        </div>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.card}>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Topic</label>
            <select className={styles.input} value={topicId} onChange={(e) => setTopicId(e.target.value)} required>
              {topics.length === 0 && <option value="">No topics available</option>}
              {topics.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "1.5rem" }}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Question Type</label>
              <select className={styles.input} value={qType} onChange={(e) => setQType(e.target.value)}>
                <option value="SINGLE_CHOICE">Single Choice</option>
                <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                <option value="TRUE_FALSE">True / False</option>
                <option value="SHORT_TEXT">Short Text (Manual Review)</option>
                <option value="LONG_TEXT">Long Text (Manual Review)</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Score</label>
              <input
                type="number"
                step="0.5"
                className={styles.input}
                value={score}
                onChange={(e) => setScore(parseFloat(e.target.value))}
                required
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Question Text</label>
            <textarea
              className={styles.input}
              style={{ minHeight: "100px", resize: "vertical" }}
              value={qText}
              onChange={(e) => setQText(e.target.value)}
              placeholder="Type your question here..."
              required
            />
          </div>

          {(qType === "SINGLE_CHOICE" || qType === "MULTIPLE_CHOICE") && (
            <div style={{ marginTop: "2rem", padding: "1.5rem", background: "var(--bg-secondary)", borderRadius: "var(--radius-md)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h4 style={{ fontWeight: 600 }}>Options</h4>
                <button type="button" onClick={handleAddOption} className={styles.badge} style={{ cursor: "pointer", border: "1px solid var(--border-color)" }}>
                  + Add Option
                </button>
              </div>

              {options.map((opt, idx) => (
                <div key={idx} style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1rem" }}>
                  <input
                    type={qType === "SINGLE_CHOICE" ? "radio" : "checkbox"}
                    checked={opt.isCorrect}
                    onChange={(e) => handleOptionChange(idx, "isCorrect", e.target.checked)}
                    style={{ width: "20px", height: "20px" }}
                  />
                  <input
                    type="text"
                    className={styles.input}
                    style={{ flex: 1 }}
                    value={opt.text}
                    onChange={(e) => handleOptionChange(idx, "text", e.target.value)}
                    placeholder={`Option ${idx + 1}`}
                    required
                  />
                </div>
              ))}
            </div>
          )}

          {qType === "TRUE_FALSE" && (
            <div style={{ marginTop: "2rem", padding: "1.5rem", background: "var(--bg-secondary)", borderRadius: "var(--radius-md)" }}>
              <h4 style={{ fontWeight: 600, marginBottom: "1rem" }}>Correct Answer</h4>
              <div style={{ display: "flex", gap: "2rem" }}>
                <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <input type="radio" name="tf" value="true" checked={tfCorrect === "true"} onChange={() => setTfCorrect("true")} /> True
                </label>
                <label style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <input type="radio" name="tf" value="false" checked={tfCorrect === "false"} onChange={() => setTfCorrect("false")} /> False
                </label>
              </div>
            </div>
          )}

          <div style={{ marginTop: "2rem", display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
            <Link href="/question-bank" style={{ padding: "0.75rem 1.5rem", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", color: "var(--text-primary)", textDecoration: "none", fontWeight: 500 }}>
              Cancel
            </Link>
            <button type="submit" className={styles.primaryBtn} style={{ padding: "0.75rem 1.5rem" }} disabled={submitting}>
              {submitting ? "Saving..." : "Save Question"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
