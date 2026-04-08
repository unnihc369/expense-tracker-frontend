import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ background: "var(--fv-bp2)" }}>
      <div className="max-w-lg text-center space-y-6">
        <h1 className="text-2xl font-semibold" style={{ color: "var(--fv-t1)" }}>
          Fin<em style={{ color: "var(--fv-acc)", fontStyle: "normal" }}>Voice</em>{" "}
          <span
            className="text-xs font-normal align-middle px-2 py-0.5 rounded-full"
            style={{ color: "var(--fv-t2)", background: "var(--fv-bs)" }}
          >
            PRO
          </span>
        </h1>
        <p className="text-sm" style={{ color: "var(--fv-t2)" }}>
          Expense tracker with dashboard analytics, budgets, accounts, and loans — aligned with the
          FinVoice Pro experience.
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <Link
            href="/login"
            className="fv-btn-exp no-underline inline-flex items-center justify-center"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="fv-btn-inc no-underline inline-flex items-center justify-center"
          >
            Create account
          </Link>
        </div>
      </div>
    </div>
  );
}
