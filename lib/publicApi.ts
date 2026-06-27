import { API_BASE } from "./api";

export async function publicFetch<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    let message = text || res.statusText;
    try {
      const json = JSON.parse(text);
      message = json.message || message;
      if (json.fieldErrors && typeof json.fieldErrors === "object") {
        const details = Object.values(json.fieldErrors).filter(Boolean).join(", ");
        if (details) message = details;
      }
    } catch {
      /* not JSON */
    }
    throw new Error(message);
  }
  // Some endpoints return 200/201 with an empty body — avoid "Unexpected end of JSON input".
  if (res.status === 204) return undefined as T;
  const body = await res.text();
  if (!body) return undefined as T;
  return JSON.parse(body) as T;
}
