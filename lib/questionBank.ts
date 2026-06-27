import { apiFetch } from "@/lib/api";
import type { Category, Department, Difficulty, Topic } from "@/lib/types";

export interface TopicOption {
  topicId: number;
  topicName: string;
  categoryId: number;
  categoryName: string;
  departmentId: number;
  departmentName: string;
}

/** Loads the full department → category → topic hierarchy flattened to topic options. */
export async function loadTopicOptions(): Promise<TopicOption[]> {
  const departments = await apiFetch<Department[]>("/api/v1/departments");
  const out: TopicOption[] = [];
  for (const d of departments) {
    const cats = await apiFetch<Category[]>(`/api/v1/question-bank/categories?departmentId=${d.id}`);
    for (const c of cats) {
      const topics = await apiFetch<Topic[]>(`/api/v1/question-bank/categories/${c.id}/topics`);
      for (const t of topics) {
        out.push({
          topicId: t.id,
          topicName: t.name,
          categoryId: c.id,
          categoryName: c.name,
          departmentId: d.id,
          departmentName: d.name,
        });
      }
    }
  }
  return out;
}

export const DIFFICULTY_META: Record<Difficulty, { label: string; cls: string }> = {
  EASY: { label: "Asan", cls: "bg-success-bg text-success-fg" },
  MEDIUM: { label: "Orta", cls: "bg-warning-bg text-warning-fg" },
  HARD: { label: "Çətin", cls: "bg-danger-bg text-danger-fg" },
};
