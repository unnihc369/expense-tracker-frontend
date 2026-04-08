"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { toggleThemeClass } from "@/components/providers/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { useAppStore } from "@/store/app.store";
import { useEffect } from "react";
import { DASHBOARD_NAV_LINKS } from "@/lib/routes";

export function DashboardShell({
  children,
  apiWarning,
}: {
  children: React.ReactNode;
  apiWarning?: string;
}) {
  const pathname = usePathname();
  const { logout } = useAuth();
  const toast = useAppStore((s) => s.toast);

  useEffect(() => {
    if (apiWarning && apiWarning !== "unauthorized") {
      useAppStore.getState().showToast(apiWarning);
    }
  }, [apiWarning]);

  return (
    <div className="fv-wrap">
      {apiWarning && apiWarning !== "unauthorized" ? (
        <div className="fv-alert fv-alert-warning mb-3" role="status">
          API: {apiWarning} (showing cached / partial data)
        </div>
      ) : null}
      <header className="fv-nav">
        <Link href="/dashboard" className="fv-logo">
          Fin<em>Voice</em>{" "}
          <span
            style={{
              fontSize: 10,
              fontWeight: 400,
              color: "var(--fv-t2)",
              background: "var(--fv-bs)",
              padding: "1px 6px",
              borderRadius: 10,
              letterSpacing: "0.03em",
            }}
          >
            PRO
          </span>
        </Link>
        <nav className="fv-nav-tabs" aria-label="Main">
          {DASHBOARD_NAV_LINKS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`fv-tab ${pathname === t.href ? "fv-tab-active" : ""}`}
            >
              {t.label}
            </Link>
          ))}
        </nav>
        <div className="fv-nav-right">
          <button
            type="button"
            className="fv-icon-btn"
            title="Toggle theme"
            aria-label="Toggle dark mode"
            onClick={() => toggleThemeClass()}
          >
            ◐
          </button>
          <Link href="/transactions?add=income" className="fv-btn-inc">
            + Income
          </Link>
          <Link href="/transactions?add=expense" className="fv-btn-exp">
            + Expense
          </Link>
          <button type="button" className="fv-fi fv-btn-cancel" onClick={() => logout()}>
            Log out
          </button>
        </div>
      </header>
      {children}
      <div className="fv-toast-wrap" aria-live="polite">
        {toast ? <div className="fv-toast">{toast}</div> : null}
      </div>
    </div>
  );
}
