import type { FinvoiceTransaction, TxType } from "@/types/finvoice";

type ApiCategory = { _id?: string; name?: string; type?: string } | string | null;
type ApiAccount = { _id?: string; name?: string } | string | null;

export interface ApiTransaction {
  _id: string;
  amount: number;
  type: "income" | "expense" | "cc_payment";
  date: string;
  description?: string;
  merchant?: string;
  note?: string;
  category?: string;
  categoryId?: ApiCategory;
  bankAccountId?: ApiAccount;
  isCreditCard?: boolean;
}

function normalizeCategoryKey(raw: string | undefined | null): string {
  if (!raw || !String(raw).trim()) return "other";
  return String(raw)
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

function catKey(c: ApiCategory, fallback?: string): string {
  if (fallback && String(fallback).trim()) return normalizeCategoryKey(fallback);
  if (!c) return "other";
  if (typeof c === "string") return normalizeCategoryKey(c);
  const n = c.name ? normalizeCategoryKey(c.name) : "other";
  return n || "other";
}

function acctName(a: ApiAccount): string {
  if (!a) return "—";
  if (typeof a === "string") return a;
  return a.name || "—";
}

function mapType(t: ApiTransaction["type"]): TxType {
  if (t === "cc_payment") return "cc_payment";
  if (t === "income") return "income";
  return "expense";
}

export function mapApiTransactionToFinvoice(t: ApiTransaction): FinvoiceTransaction {
  const merchantText = (t.merchant || t.description || "—").trim() || "—";
  const categoryStr =
    typeof t.category === "string"
      ? t.category
      : typeof t.categoryId === "object" && t.categoryId && "name" in t.categoryId
        ? String((t.categoryId as { name?: string }).name)
        : undefined;

  return {
    id: String(t._id),
    merchant: merchantText,
    amount: Number(t.amount) || 0,
    category: catKey(t.categoryId ?? null, categoryStr),
    date: t.date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    account: acctName(t.bankAccountId ?? null),
    note: t.note || t.description || "",
    type: mapType(t.type),
    ccPurchase: Boolean(t.isCreditCard),
  };
}
