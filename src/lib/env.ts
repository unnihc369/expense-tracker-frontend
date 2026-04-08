/**
 * Express API base URL (must include `/api`).
 * Local default: Next.js on :3000 proxies to Express on :8080 → `http://localhost:8080/api`.
 * Production frontend `https://finvoicepro.vercel.app/login` should set this
 * explicitly to `https://finvoicepro-back.vercel.app/api`.
 */
export function getApiBaseUrl(): string {
  return (
    process.env.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:8080/api"
  ).replace(/\/$/, "");
}
