"use client";

import { useEffect } from "react";

const STORAGE_KEY = "fv_dark";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const dark = typeof window !== "undefined" && localStorage.getItem(STORAGE_KEY) === "1";
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  return <>{children}</>;
}

export function toggleThemeClass() {
  const el = document.documentElement;
  const next = !el.classList.contains("dark");
  el.classList.toggle("dark", next);
  localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  return next;
}

export function isDarkMode() {
  return document.documentElement.classList.contains("dark");
}
