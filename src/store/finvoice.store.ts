import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  FinvoiceCreditCard,
  FinvoiceLoan,
  FinvoiceSnapshot,
} from "@/types/finvoice";
import { DEFAULT_BUDGETS } from "@/lib/constants";

interface FinvoiceState extends FinvoiceSnapshot {
  mergeFromSsr: (s: FinvoiceSnapshot) => void;
  setSnapshot: (s: FinvoiceSnapshot) => void;
  addAccount: (a: FinvoiceSnapshot["accounts"][number]) => void;
  addCreditCard: (c: FinvoiceCreditCard) => void;
  updateCreditCard: (id: string, patch: Partial<FinvoiceCreditCard>) => void;
  removeCreditCard: (id: string) => void;
  addLoan: (l: FinvoiceLoan) => void;
  updateLoan: (id: string, patch: Partial<FinvoiceLoan>) => void;
  removeLoan: (id: string) => void;
  recordLoanPayment: (id: string, amount: number) => void;
  setBudgetLines: (b: Record<string, number>) => void;
}

const empty: FinvoiceSnapshot = {
  transactions: [],
  accounts: [],
  creditCards: [],
  budgets: { ...DEFAULT_BUDGETS },
  loans: [],
};

function nextId() {
  return `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

export const useFinvoiceStore = create<FinvoiceState>()(
  persist(
    (set, get) => ({
      ...empty,
      mergeFromSsr: (s) => {
        set({
          transactions: s.transactions,
          accounts: s.accounts,
          budgets: { ...DEFAULT_BUDGETS, ...get().budgets, ...s.budgets },
          creditCards: s.creditCards,
          loans: s.loans,
        });
      },
      setSnapshot: (s) => set({ ...s }),
      addAccount: (a) =>
        set((s) => ({
          accounts: [a, ...s.accounts.filter((x) => String(x.id) !== String(a.id))],
        })),
      addCreditCard: (c) =>
        set((s) => ({ creditCards: [...s.creditCards, { ...c, id: c.id || nextId() }] })),
      updateCreditCard: (id, patch) =>
        set((s) => ({
          creditCards: s.creditCards.map((x) => (x.id === id ? { ...x, ...patch } : x)),
        })),
      removeCreditCard: (id) =>
        set((s) => ({ creditCards: s.creditCards.filter((x) => x.id !== id) })),
      addLoan: (l) =>
        set((s) => ({ loans: [...s.loans, { ...l, id: l.id || nextId() }] })),
      updateLoan: (id, patch) =>
        set((s) => ({
          loans: s.loans.map((x) => (String(x.id) === String(id) ? { ...x, ...patch } : x)),
        })),
      removeLoan: (id) =>
        set((s) => ({ loans: s.loans.filter((x) => String(x.id) !== String(id)) })),
      recordLoanPayment: (id, amount) =>
        set((s) => ({
          loans: s.loans.map((x) => {
            if (String(x.id) !== String(id)) return x;
            const remaining = Math.max(0, x.remaining - amount);
            return {
              ...x,
              remaining,
              status: remaining <= 0 ? "settled" : "active",
            };
          }),
        })),
      setBudgetLines: (b) =>
        set((s) => ({ budgets: { ...DEFAULT_BUDGETS, ...s.budgets, ...b } })),
    }),
    {
      name: "fv-finvoice-persist",
      partialize: (state) => ({
        budgets: state.budgets,
      }),
    }
  )
);
