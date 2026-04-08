/**
 * Browser-facing API: use Route Handlers under `/api/backend/*` so the httpOnly
 * auth cookie is attached on the server. Build paths with `backendPath`.
 */
export function backendPath(segments: string[]): string {
  const clean = segments.map((s) => s.replace(/^\/+|\/+$/g, "")).filter(Boolean);
  return `/api/backend/${clean.join("/")}`;
}

export async function backendFetch(
  segments: string[],
  init?: RequestInit
): Promise<Response> {
  return fetch(backendPath(segments), {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
}

export async function backendJson<T>(segments: string[], init?: RequestInit): Promise<T> {
  const res = await backendFetch(segments, init);
  const text = await res.text();
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = JSON.parse(text) as { message?: string };
      if (j.message) msg = j.message;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  return text ? (JSON.parse(text) as T) : (null as T);
}
