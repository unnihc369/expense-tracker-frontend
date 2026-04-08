/**
 * Express API base URL (must include `/api`).
 * Local default: Next.js on :3000 proxies to Express on :8080 → `http://localhost:8080/api`.
 */
export function getApiBaseUrl(): string {
  return (
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "https://finvoicepro-back.vercel.app/api"
  ).replace(/\/$/, "");
}
