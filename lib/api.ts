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
    const expired = /jwt|token/i.test(text) && /expired|invalid/i.test(text);

    // Session no longer valid → clear it and send the user back to login.
    if ((res.status === 401 || res.status === 403 || expired) && typeof window !== "undefined") {
      localStorage.removeItem("ces_token");
      localStorage.removeItem("ces_user");
      document.cookie = "ces_token=; path=/; max-age=0";
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
      throw new Error("Sessiyanın vaxtı bitib. Yenidən daxil olun.");
    }

    let message = text || res.statusText;
    try {
      const json = JSON.parse(text);
      message = json.message || text;
    } catch {
      /* not JSON */
    }
    throw new Error(message);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export { API_BASE };
