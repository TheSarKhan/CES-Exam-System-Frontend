const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function apiFetch<T = unknown>(path: string, options?: RequestInit): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('ces_token') : null;
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();

    // Only a genuine 401 (missing / expired / invalid token) ends the session.
    // 403 (forbidden action) and all other errors just surface their message —
    // they must NOT log the user out.
    if (res.status === 401 && typeof window !== "undefined") {
      const hadToken = !!localStorage.getItem("ces_token");
      const onLogin = window.location.pathname.startsWith("/login");
      if (hadToken && !onLogin) {
        localStorage.removeItem("ces_token");
        localStorage.removeItem("ces_user");
        document.cookie = "ces_token=; path=/; max-age=0";
        window.location.href = "/login";
        throw new Error("Sessiyanın vaxtı bitib. Yenidən daxil olun.");
      }
    }

    let message = text || res.statusText;
    try {
      const json = JSON.parse(text);
      message = json.message || message;
      // Bean-validation errors come back as { message: "Validation failed", fieldErrors: {field: msg} }.
      // Surface the specific field message(s) instead of the generic "Validation failed".
      if (json.fieldErrors && typeof json.fieldErrors === "object") {
        const details = Object.values(json.fieldErrors).filter(Boolean).join(", ");
        if (details) message = details;
      }
    } catch {
      /* not JSON */
    }
    throw new Error(message);
  }
  // Some endpoints return 200/201 with an empty body (e.g. ResponseEntity.ok().build()).
  // Reading as text first avoids "Unexpected end of JSON input" on an empty response.
  if (res.status === 204) return undefined as T;
  const body = await res.text();
  if (!body) return undefined as T;
  return JSON.parse(body) as T;
}

/** Absolute URL for a stored image (backend returns a relative /api/v1/public/images/... path). */
export function imageSrc(url?: string | null): string | undefined {
  if (!url) return undefined;
  return /^https?:\/\//.test(url) ? url : `${API_BASE}${url}`;
}

/** Upload an image (admin) and get back its public URL. */
export async function uploadImage(file: File): Promise<{ filename: string; url: string }> {
  const token = typeof window !== "undefined" ? localStorage.getItem("ces_token") : null;
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API_BASE}/api/v1/images`, {
    method: "POST",
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) }, // no Content-Type: browser sets the multipart boundary
    body: form,
  });
  if (!res.ok) {
    let message = res.statusText;
    try {
      const j = await res.json();
      message = j.message || message;
    } catch {
      /* not JSON */
    }
    throw new Error(message);
  }
  return res.json();
}

export { API_BASE };
