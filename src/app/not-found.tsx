"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Avoid server `redirect("/")` here (can contribute to redirect issues). If `/` itself 404s
 * (e.g. root `app/` symlink + `src/app`), client `replace("/")` will spam GET / — fix the app root.
 */
export default function NotFound() {
  const router = useRouter();
  const once = useRef(false);

  useEffect(() => {
    if (once.current) return;
    once.current = true;
    router.replace("/");
  }, [router]);

  return (
    <div
      className="min-h-screen flex items-center justify-center text-sm"
      style={{ color: "var(--fv-t2)" }}
    >
      Redirecting…
    </div>
  );
}
