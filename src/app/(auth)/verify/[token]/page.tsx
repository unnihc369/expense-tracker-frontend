import Link from "next/link";
import { getApiBaseUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

type VerifyResult = {
  ok: boolean;
  message: string;
  code?: string;
};

async function verifyEmailToken(token: string): Promise<VerifyResult> {
  const base = getApiBaseUrl();
  const url = `${base}/auth/verify/${encodeURIComponent(token)}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    const raw = await res.text();
    const trimmed = raw.trim();

    if (!trimmed) {
      return {
        ok: false,
        message: "Verification service returned an empty response. Please try again.",
        code: "EMPTY_RESPONSE",
      };
    }

    const data = JSON.parse(trimmed) as { message?: string; code?: string };
    return {
      ok: res.ok,
      message:
        data.message ||
        (res.ok ? "Email verified successfully." : "Verification failed. Please try again."),
      code: data.code,
    };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Unknown error";
    return {
      ok: false,
      message: `Could not complete email verification. ${detail}`,
      code: "VERIFY_UNREACHABLE",
    };
  }
}

export default async function VerifyEmailPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await verifyEmailToken(token);

  return (
    <div className="space-y-5">
      <div className="text-center space-y-3">
        <div
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-sm font-semibold"
          style={{
            background: result.ok ? "rgba(29, 158, 117, 0.12)" : "rgba(226, 75, 74, 0.12)",
            color: result.ok ? "var(--fv-acc)" : "var(--fv-dan)",
            border: `1px solid ${result.ok ? "rgba(29, 158, 117, 0.18)" : "rgba(226, 75, 74, 0.18)"}`,
          }}
        >
          {result.ok ? "OK" : "ERR"}
        </div>
        <div>
          <p className="fv-modal-title mb-1">{result.ok ? "Email verified" : "Verification failed"}</p>
          <p className="text-sm" style={{ color: "var(--fv-t2)" }}>
            {result.ok
              ? "Your FinVoice account is ready. You can continue to sign in."
              : "This verification link is invalid, expired, or could not be completed."}
          </p>
        </div>
      </div>

      <div
        className="rounded-2xl border px-4 py-4"
        style={{
          background: result.ok ? "rgba(29, 158, 117, 0.08)" : "rgba(226, 75, 74, 0.08)",
          borderColor: result.ok ? "rgba(29, 158, 117, 0.18)" : "rgba(226, 75, 74, 0.18)",
        }}
      >
        <p
          className="text-sm font-medium"
          style={{ color: result.ok ? "var(--fv-acc)" : "var(--fv-dan)" }}
        >
          {result.message}
        </p>
        {result.code ? (
          <p className="mt-2 text-xs" style={{ color: "var(--fv-t3)" }}>
            Reference: {result.code}
          </p>
        ) : null}
      </div>

      <div className="rounded-2xl border px-4 py-4" style={{ borderColor: "var(--fv-bd)" }}>
        <p
          className="text-[11px] font-medium uppercase tracking-[0.08em]"
          style={{ color: "var(--fv-t3)" }}
        >
          Next step
        </p>
        <p className="mt-2 text-sm" style={{ color: "var(--fv-t2)" }}>
          {result.ok
            ? "Sign in to access your dashboard, accounts, budgets, and analytics."
            : "If the link expired, register again or request a fresh verification email from support."}
        </p>
      </div>

      <div className="fv-modal-footer" style={{ marginTop: 0 }}>
        <Link href="/" className="fv-btn-cancel no-underline inline-flex items-center">
          Home
        </Link>
        <Link
          href={result.ok ? "/login" : "/register"}
          className={`${result.ok ? "fv-btn-exp" : "fv-btn-inc"} no-underline inline-flex items-center justify-center`}
        >
          {result.ok ? "Sign in" : "Create account"}
        </Link>
      </div>
    </div>
  );
}
