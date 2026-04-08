import { cache } from "react";
import { serverFetchJson } from "@/lib/server-fetch";
import { mapApiTransactionToFinvoice, type ApiTransaction } from "@/lib/map-api-transaction";
import type { FinvoiceAccount, FinvoiceSnapshot } from "@/types/finvoice";
import { DEFAULT_BUDGETS } from "@/lib/constants";
import { accentPalette } from "@/colors";

interface ApiBankAccount {
  _id: string;
  name: string;
  type?: string;
  color?: string;
  currentAmount?: number;
  initialAmount?: number;
  balance?: number;
}

interface ApiCreditCard {
  _id: string;
  name: string;
  limit?: number;
  outstanding?: number;
  dueDate?: string | null;
  color?: string;
}

interface ApiLoan {
  _id: string;
  name: string;
  direction: "lent" | "borrowed";
  amount?: number;
  remaining?: number;
  date?: string;
  accountId?: string | null;
  note?: string;
  status?: "active" | "settled";
}

/**
 * Loads user-linked data from the expense API for SSR.
 * Credit cards, loans, and extended budgets are client-hydrated from localStorage
 * until backend parity exists.
 */
export const loadFinvoiceSnapshotForSsr = cache(async (): Promise<{
  snapshot: FinvoiceSnapshot;
  apiError?: string;
}> => {
  const empty: FinvoiceSnapshot = {
    transactions: [],
    accounts: [],
    creditCards: [],
    budgets: { ...DEFAULT_BUDGETS },
    loans: [],
  };

  const [txRes, acRes, ccRes, loanRes] = await Promise.all([
    serverFetchJson<ApiTransaction[]>("/transactions"),
    serverFetchJson<ApiBankAccount[]>("/bank-accounts"),
    serverFetchJson<ApiCreditCard[]>("/credit-cards"),
    serverFetchJson<ApiLoan[]>("/loans"),
  ]);

  if (!txRes.ok && txRes.status === 401) {
    return { snapshot: empty, apiError: "unauthorized" };
  }

  const transactions =
    txRes.ok && Array.isArray(txRes.data)
      ? txRes.data.map(mapApiTransactionToFinvoice)
      : [];

  const accounts: FinvoiceAccount[] =
    acRes.ok && Array.isArray(acRes.data)
      ? acRes.data.map((a, i) => ({
          id: String(a._id),
          name: a.name,
          type: a.type || "Savings account",
          balance: Number(a.currentAmount ?? a.balance ?? a.initialAmount ?? 0),
          color: a.color || accentPalette[i % accentPalette.length],
        }))
      : [];

  const accountNameById = new Map(accounts.map((a) => [String(a.id), a.name]));

  const creditCards =
    ccRes.ok && Array.isArray(ccRes.data)
      ? ccRes.data.map((c, i) => ({
          id: String(c._id),
          name: c.name,
          limit: Number(c.limit ?? 0),
          outstanding: Number(c.outstanding ?? 0),
          dueDate: c.dueDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
          color: c.color || accentPalette[(i + 3) % accentPalette.length],
        }))
      : [];

  const loans =
    loanRes.ok && Array.isArray(loanRes.data)
      ? loanRes.data.map((l) => ({
          id: String(l._id),
          name: l.name,
          direction: l.direction,
          amount: Number(l.amount ?? 0),
          remaining: Number(l.remaining ?? 0),
          date: l.date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
          account: accountNameById.get(String(l.accountId || "")) || "—",
          note: l.note || "",
          status: l.status || (Number(l.remaining ?? 0) <= 0 ? "settled" : "active"),
        }))
      : [];

  return {
    snapshot: {
      ...empty,
      transactions,
      accounts,
      creditCards,
      loans,
    },
    apiError:
      !txRes.ok && txRes.status !== 401
        ? txRes.message
        : !acRes.ok
          ? acRes.message
          : !ccRes.ok
            ? ccRes.message
            : !loanRes.ok
              ? loanRes.message
              : undefined,
  };
});
