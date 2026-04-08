/**
 * App Router URL paths (FinVoice).
 *
 * Public — no auth required:
 *   /              Landing
 *   /login         Sign in
 *   /register      Sign up
 *
 * Protected — require auth cookie (middleware → /login?next=…):
 *   /dashboard     Overview, metrics, charts
 *   /transactions  List, filters, export
 *   /accounts      Bank accounts & credit cards
 *   /budget        Budget vs actual
 *   /loans         Loans & dues
 *
 * API (Next Route Handlers, not pages):
 *   /api/auth/login | logout | register
 *   /api/backend/* BFF proxy to Express
 */

export const PUBLIC_PATHS = ["/", "/login", "/register"] as const;

/** Prefixes matched for auth redirect to /login */
export const PROTECTED_PATH_PREFIXES = [
  "/dashboard",
  "/transactions",
  "/accounts",
  "/budget",
  "/loans",
] as const;

export type ProtectedPath = (typeof PROTECTED_PATH_PREFIXES)[number];

/** Human-readable nav (href → label) — same order as dashboard shell */
export const DASHBOARD_NAV_LINKS: { href: string; label: string }[] = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/transactions", label: "Transactions" },
  { href: "/accounts", label: "Accounts" },
  { href: "/budget", label: "Budget" },
  { href: "/loans", label: "Loans" },
];

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}
