"use client";

import { useEffect } from "react";
import type { FinvoiceSnapshot } from "@/types/finvoice";
import { useFinvoiceStore } from "@/store/finvoice.store";

/**
 * Merges RSC-fetched API snapshot into Zustand after localStorage rehydration
 * so persisted credit cards / loans / budgets are preserved.
 */
export function FinvoiceSsrBridge({ snapshot }: { snapshot: FinvoiceSnapshot }) {
  const mergeFromSsr = useFinvoiceStore((s) => s.mergeFromSsr);

  useEffect(() => {
    const apply = () => mergeFromSsr(snapshot);
    if (useFinvoiceStore.persist.hasHydrated()) {
      apply();
      return;
    }
    return useFinvoiceStore.persist.onFinishHydration(apply);
  }, [snapshot, mergeFromSsr]);

  return null;
}
