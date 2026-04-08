import { Suspense } from "react";
import { LoginForm } from "@/components/forms/LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="fv-empty">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
