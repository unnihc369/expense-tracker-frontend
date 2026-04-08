import { getApiBaseUrl } from "./env";

const ENV_HINT =
  "In .env.local set API_BASE_URL=http://localhost:8080/api (Express on 8080, Next on 3000).";

/**
 * POST JSON to the Express API. Never returns empty data silently: connection,
 * empty body, and non-JSON responses become { message, code } with a 502 or upstream status.
 */
export async function postToBackend(
  path: string,
  body: unknown
): Promise<{ status: number; data: Record<string, unknown> }> {
  const base = getApiBaseUrl();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch (err) {
    const cause = err instanceof Error ? err.message : String(err);
    return {
      status: 502,
      data: {
        message: `Cannot reach API at ${url}. ${cause} ${ENV_HINT}`,
        code: "API_UNREACHABLE",
      },
    };
  }

  const raw = await res.text();
  const trimmed = raw.trim();

  if (!trimmed) {
    return {
      status: res.ok ? 502 : res.status,
      data: {
        message: res.ok
          ? `API returned an empty success response from ${url}. ${ENV_HINT}`
          : `API returned an empty body (HTTP ${res.status}). ${ENV_HINT}`,
        code: "API_EMPTY_RESPONSE",
      },
    };
  }

  try {
    const data = JSON.parse(trimmed) as Record<string, unknown>;
    return { status: res.status, data };
  } catch {
    return {
      status: 502,
      data: {
        message: `API returned non-JSON (HTTP ${res.status}): ${trimmed.slice(0, 280)}`,
        code: "API_BAD_JSON",
      },
    };
  }
}
