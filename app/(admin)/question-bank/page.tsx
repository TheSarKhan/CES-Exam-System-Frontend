"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import type { Category, Question, Topic } from "@/lib/types";
import styles from "../admin.module.css";

interface CategoryWithTopics extends Category {
  topics: Topic[];
}

export default function QuestionBankPage() {
  const [categories, setCategories] = useState<CategoryWithTopics[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [questionCounts, setQuestionCounts] = useState<Record<number, number>>({});
  const [loading, setLoading] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [error, setError] = useState("");

  const loadCategories = useCallback(async () => {
    try {
      const cats = await apiFetch<Category[]>("/api/v1/question-bank/categories");
      const withTopics = await Promise.all(
        cats.map(async (cat) => {
          const topics = await apiFetch<Topic[]>(`/api/v1/question-bank/categories/${cat.id}/topics`);
          return { ...cat, topics };
        })
      );
      setCategories(withTopics);
      const firstTopic = withTopics.find((c) => c.topics.length > 0)?.topics[0];
      if (firstTopic) setSelectedTopic(firstTopic.id);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load question bank");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const [newCategoryName, setNewCategoryName] = useState("");
  const [newTopicName, setNewTopicName] = useState("");
  const [addingTopicToCategory, setAddingTopicToCategory] = useState<number | null>(null);

  useEffect(() => {
    if (!selectedTopic) {
      setQuestions([]);
      return;
    }
    setLoadingQuestions(true);
    apiFetch<Question[]>(`/api/v1/question-bank/topics/${selectedTopic}/questions`)
      .then((data) => {
        setQuestions(data);
        setQuestionCounts((prev) => ({ ...prev, [selectedTopic]: data.length }));
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoadingQuestions(false));
  }, [selectedTopic]);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      await apiFetch("/api/v1/question-bank/categories", {
        method: "POST",
        body: JSON.stringify({ name: newCategoryName }),
      });
      setNewCategoryName("");
      loadCategories();
    } catch (e: any) {
      setError(e.message || "Failed to create category");
    }
  };

  const handleCreateTopic = async (e: React.FormEvent, categoryId: number) => {
    e.preventDefault();
    if (!newTopicName.trim()) return;
    try {
      await apiFetch("/api/v1/question-bank/topics", {
        method: "POST",
        body: JSON.stringify({ categoryId, name: newTopicName }),
      });
      setNewTopicName("");
      setAddingTopicToCategory(null);
      loadCategories();
    } catch (e: any) {
      setError(e.message || "Failed to create topic");
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <h1 className={styles.title}>Question Bank</h1>
        <Link href="/question-bank/create" className={styles.primaryBtn}>
          + Add New Question
        </Link>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      {loading ? (
        <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "250px 1fr", gap: "2rem" }}>
          <div className={styles.card} style={{ padding: "1rem" }}>
            <h3 style={{ fontSize: "1rem", fontWeight: 600, marginBottom: "1rem", color: "var(--text-secondary)" }}>
              Categories
            </h3>
            
            <form onSubmit={handleCreateCategory} style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
              <input type="text" className={styles.input} style={{ padding: "0.35rem 0.5rem", fontSize: "0.875rem" }} placeholder="New Category..." value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} required />
              <button type="submit" className={styles.primaryBtn} style={{ padding: "0.35rem 0.5rem", fontSize: "0.875rem" }}>Add</button>
            </form>

            {categories.length === 0 ? (
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>No categories yet.</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {categories.map((cat) => (
                  <li key={cat.id} style={{ marginBottom: "1rem" }}>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "0.5rem" }}>
                      {cat.name}
                    </div>
                    <ul style={{ listStyle: "none", paddingLeft: "1rem", margin: 0 }}>
                      {cat.topics.map((top) => (
                        <li
                          key={top.id}
                          onClick={() => setSelectedTopic(top.id)}
                          style={{
                            padding: "0.5rem",
                            cursor: "pointer",
                            borderRadius: "var(--radius-md)",
                            backgroundColor:
                              selectedTopic === top.id ? "rgba(59, 130, 246, 0.1)" : "transparent",
                            color: selectedTopic === top.id ? "var(--primary-color)" : "var(--text-secondary)",
                            fontWeight: selectedTopic === top.id ? 500 : 400,
                          }}
                        >
                          {top.name}
                          {questionCounts[top.id] != null && (
                            <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>
                              {" "}({questionCounts[top.id]})
                            </span>
                          )}
                        </li>
                      ))}
                      <li style={{ marginTop: "0.5rem" }}>
                        {addingTopicToCategory === cat.id ? (
                          <form onSubmit={(e) => handleCreateTopic(e, cat.id)} style={{ display: "flex", gap: "0.25rem", flexDirection: "column" }}>
                            <input type="text" autoFocus className={styles.input} style={{ padding: "0.25rem 0.5rem", fontSize: "0.875rem" }} placeholder="Topic name..." value={newTopicName} onChange={e => setNewTopicName(e.target.value)} required />
                            <div style={{ display: "flex", gap: "0.25rem" }}>
                              <button type="submit" className={styles.primaryBtn} style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", flex: 1 }}>Save</button>
                              <button type="button" onClick={() => { setAddingTopicToCategory(null); setNewTopicName(""); }} style={{ padding: "0.25rem 0.5rem", fontSize: "0.75rem", flex: 1, background: "transparent", border: "1px solid var(--border-color)", cursor: "pointer", borderRadius: "var(--radius-sm)" }}>Cancel</button>
                            </div>
                          </form>
                        ) : (
                          <button type="button" onClick={() => setAddingTopicToCategory(cat.id)} style={{ background: "transparent", border: "none", color: "var(--primary-color)", fontSize: "0.75rem", cursor: "pointer", padding: "0.25rem 0" }}>+ Add Topic</button>
                        )}
                      </li>
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={styles.card} style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "1.5rem", borderBottom: "1px solid var(--border-color)" }}>
              <h3 style={{ fontWeight: 600 }}>Questions for Selected Topic</h3>
            </div>
            {loadingQuestions ? (
              <p style={{ padding: "1.5rem", color: "var(--text-secondary)" }}>Loading questions...</p>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Question</th>
                    <th>Type</th>
                    <th>Score</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((q) => (
                    <tr key={q.id}>
                      <td
                        style={{
                          fontWeight: 500,
                          maxWidth: "300px",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {q.text}
                      </td>
                      <td>
                        <span className={styles.badge}>{q.type}</span>
                      </td>
                      <td>{q.score}</td>
                      <td>
                        <span className={`${styles.badge} ${q.isActive ? styles.active : ""}`}>
                          {q.isActive ? "ACTIVE" : "INACTIVE"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {!loadingQuestions && selectedTopic && questions.length === 0 && (
              <p style={{ padding: "1.5rem", color: "var(--text-secondary)" }}>No questions in this topic.</p>
            )}
            {!selectedTopic && (
              <p style={{ padding: "1.5rem", color: "var(--text-secondary)" }}>Select a topic to view questions.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
