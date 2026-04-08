"use client";

import { useState } from "react";
import Link from "next/link";
import { isValidEmail } from "@/utils/validators";

export function RegisterForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!name.trim()) {
      setError("Name required");
      return;
    }
    if (!isValidEmail(email)) {
      setError("Valid email required");
      return;
    }
    if (password.length < 6) {
      setError("Password at least 6 characters");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const d = data as {
          message?: string;
          details?: Record<string, string>;
          code?: string;
        };
        let msg = d.message || "Registration failed";
        if (d.details && typeof d.details === "object") {
          const parts = Object.values(d.details).filter(Boolean);
          if (parts.length) msg = `${msg}: ${parts.join("; ")}`;
        }
        setError(msg);
        return;
      }
      const ok = data as { message?: string; devAutoVerified?: boolean };
      let text =
        ok.message ||
        "Check your email to verify your account, then sign in.";
      if (ok.devAutoVerified) {
        text += " You can sign in now.";
      }
      setMessage(text);
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      <h1 className="fv-modal-title">Create account</h1>
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="fv-fg">
          <label className="fv-fl" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            name="name"
            className="fv-fi"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
        </div>
        <div className="fv-fg">
          <label className="fv-fl" htmlFor="reg-email">
            Email
          </label>
          <input
            id="reg-email"
            name="email"
            type="email"
            className="fv-fi"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        <div className="fv-fg">
          <label className="fv-fl" htmlFor="reg-password">
            Password
          </label>
          <input
            id="reg-password"
            name="password"
            type="password"
            className="fv-fi"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </div>
        {error ? (
          <p className="text-sm" style={{ color: "var(--fv-dan)" }}>
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="text-sm" style={{ color: "var(--fv-acc)" }}>
            {message}
          </p>
        ) : null}
        <div className="fv-modal-footer" style={{ marginTop: 16 }}>
          <Link href="/login" className="fv-btn-cancel no-underline inline-flex items-center">
            Sign in
          </Link>
          <button type="submit" className="fv-btn-ok" disabled={pending}>
            {pending ? "…" : "Register"}
          </button>
        </div>
      </form>
    </div>
  );
}
