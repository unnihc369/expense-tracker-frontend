"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuthStore } from "@/store/auth.store";
import { parseUserFromLoginResponse } from "@/lib/auth";
import { isValidEmail } from "@/utils/validators";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const setUser = useAuthStore((s) => s.setUser);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!isValidEmail(email)) {
      setError("Enter a valid email");
      return;
    }
    if (!password) {
      setError("Password required");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data as { message?: string }).message || "Login failed");
        return;
      }
      const user = parseUserFromLoginResponse(data);
      if (user) setUser(user);
      const next = searchParams.get("next") || "/dashboard";
      router.push(next.startsWith("/") ? next : "/dashboard");
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <h1 className="fv-modal-title">Sign in</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="fv-fg">
          <label className="fv-fl" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            className="fv-fi"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="fv-fg">
          <label className="fv-fl" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            className="fv-fi"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error ? (
          <p className="text-sm" style={{ color: "var(--fv-dan)" }}>
            {error}
          </p>
        ) : null}
        <div className="fv-modal-footer" style={{ marginTop: 16 }}>
          <Link
            href="/"
            className="fv-btn-cancel no-underline inline-flex items-center"
          >
            Back
          </Link>
          <button type="submit" className="fv-btn-ok" disabled={pending}>
            {pending ? "…" : "Sign in"}
          </button>
        </div>
      </form>
      <p className="text-sm mt-4" style={{ color: "var(--fv-t2)" }}>
        No account?{" "}
        <Link href="/register" style={{ color: "var(--fv-acc)" }}>
          Register
        </Link>
      </p>
    </div>
  );
}
