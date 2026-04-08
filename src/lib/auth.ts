/**
 * Auth helpers for client code. The session cookie is httpOnly — use Route Handlers
 * (`/api/auth/*`, `/api/backend/*`) for authenticated server calls.
 */
export type AuthUser = { id: string; email: string; name?: string };

export function parseUserFromLoginResponse(data: unknown): AuthUser | null {
  if (!data || typeof data !== "object") return null;
  const u = (data as { user?: AuthUser }).user;
  if (!u?.id || !u?.email) return null;
  return u;
}
