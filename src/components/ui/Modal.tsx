"use client";

import { useEffect } from "react";

export function Modal({
  open,
  title,
  onClose,
  children,
  small,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  small?: boolean;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fv-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="fv-modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`fv-modal ${small ? "fv-modal-sm" : ""}`}>
        <h2 id="fv-modal-title" className="fv-modal-title">
          {title}
        </h2>
        {children}
      </div>
    </div>
  );
}
