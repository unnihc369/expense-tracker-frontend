export default function VerifyEmailLoading() {
  return (
    <div className="space-y-5">
      <div className="text-center space-y-3">
        <div
          className="mx-auto h-14 w-14 animate-pulse rounded-2xl"
          style={{ background: "var(--fv-bs)" }}
        />
        <div>
          <p className="fv-modal-title mb-1">Verifying email</p>
          <p className="text-sm" style={{ color: "var(--fv-t2)" }}>
            Please wait while we confirm your account.
          </p>
        </div>
      </div>

      <div
        className="rounded-2xl border px-4 py-4 text-sm"
        style={{ background: "var(--fv-bs)", borderColor: "var(--fv-bd)", color: "var(--fv-t2)" }}
      >
        Checking your verification link and preparing your account.
      </div>
    </div>
  );
}
