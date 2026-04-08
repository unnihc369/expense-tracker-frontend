"use client";

import { Modal } from "@/components/ui/Modal";

export function ConfirmModal({
  open,
  title,
  subtitle,
  confirmLabel = "Delete",
  onClose,
  onConfirm,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  confirmLabel?: string;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal open={open} title={title} small onClose={onClose}>
      {subtitle ? (
        <div style={{ fontSize: 13, color: "var(--fv-t2)", marginBottom: "1rem" }}>{subtitle}</div>
      ) : null}
      <div className="fv-modal-footer">
        <button type="button" className="fv-btn-cancel" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="fv-btn-del" onClick={onConfirm}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
