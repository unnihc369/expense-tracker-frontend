"use client";

import { useFinvoiceStore } from "@/store/finvoice.store";

export function useTransactions() {
  return useFinvoiceStore((s) => s.transactions);
}

export function useFinvoiceData() {
  return useFinvoiceStore((s) => ({
    transactions: s.transactions,
    accounts: s.accounts,
    creditCards: s.creditCards,
    budgets: s.budgets,
    loans: s.loans,
  }));
}
