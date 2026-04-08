import type { DashboardAlert, DashboardMetrics, FinvoiceSnapshot } from "@/types/finvoice";
import { DEFAULT_BUDGETS } from "@/lib/constants";

function monthPrefix(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function filterMonthTransactions(
  transactions: FinvoiceSnapshot["transactions"],
  ym = monthPrefix()
) {
  return transactions.filter((t) => t.date?.startsWith(ym));
}

export function computeMonthSpend(transactions: FinvoiceSnapshot["transactions"], ym?: string) {
  return filterMonthTransactions(transactions, ym)
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);
}

export function computeMonthIncome(transactions: FinvoiceSnapshot["transactions"], ym?: string) {
  return filterMonthTransactions(transactions, ym)
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
}

export function computeCategorySpend(
  transactions: FinvoiceSnapshot["transactions"],
  ym?: string
): Record<string, number> {
  const map: Record<string, number> = {};
  for (const t of filterMonthTransactions(transactions, ym)) {
    if (t.type !== "expense") continue;
    map[t.category] = (map[t.category] || 0) + t.amount;
  }
  return map;
}

export function computeSixMonthTrend(transactions: FinvoiceSnapshot["transactions"]): {
  label: string;
  ym: string;
  total: number;
  current: boolean;
}[] {
  const now = new Date();
  const out: { label: string; ym: string; total: number; current: boolean }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const total = transactions
      .filter((t) => t.date?.startsWith(ym) && t.type === "expense")
      .reduce((s, t) => s + t.amount, 0);
    out.push({
      label: d.toLocaleString("default", { month: "short" }),
      ym,
      total,
      current: i === 0,
    });
  }
  return out;
}

export function buildAlerts(data: FinvoiceSnapshot): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];
  const now = new Date();

  for (const cc of data.creditCards) {
    const pct = cc.limit > 0 ? (cc.outstanding / cc.limit) * 100 : 0;
    if (pct > 70)
      alerts.push({
        type: "danger",
        message: `${cc.name} utilization is ${Math.round(pct)}% — high credit usage`,
      });
    else if (pct > 50)
      alerts.push({
        type: "warning",
        message: `${cc.name} at ${Math.round(pct)}% utilization — monitor spending`,
      });
    const due = new Date(cc.dueDate);
    const days = Math.ceil((due.getTime() - Date.now()) / 86400000);
    if (days >= 0 && days <= 5)
      alerts.push({
        type: "danger",
        message: `${cc.name} bill due in ${days === 0 ? "today" : `${days} day${days === 1 ? "" : "s"}`} — ₹${cc.outstanding.toLocaleString("en-IN")} outstanding`,
      });
  }

  for (const a of data.accounts) {
    if (a.balance < 5000)
      alerts.push({
        type: "warning",
        message: `Low balance: ${a.name} has only ₹${Math.round(a.balance).toLocaleString("en-IN")}`,
      });
  }

  const daysIn = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const dayOf = now.getDate();
  const ms = computeMonthSpend(data.transactions);
  const budTotal = Object.values({ ...DEFAULT_BUDGETS, ...data.budgets }).reduce(
    (s, v) => s + v,
    0
  );
  const expected = budTotal * (dayOf / daysIn);
  if (expected > 0 && ms > expected * 1.25)
    alerts.push({
      type: "warning",
      message: `Spending ${Math.round((ms / expected - 1) * 100)}% ahead of budget pace for this month`,
    });

  const totalBal = data.accounts.reduce((s, a) => s + a.balance, 0);
  const totalCC = data.creditCards.reduce((s, c) => s + c.outstanding, 0);
  if (totalBal - totalCC < 0)
    alerts.push({
      type: "danger",
      message: "Net assets negative — CC debt exceeds bank balance",
    });

  const mi = computeMonthIncome(data.transactions);
  if (mi > 0 && ms > mi)
    alerts.push({
      type: "warning",
      message: "Spending exceeds income this month",
    });

  return alerts;
}

export function buildMetrics(data: FinvoiceSnapshot): DashboardMetrics {
  const now = new Date();
  const ym = monthPrefix(now);
  const monthTx = filterMonthTransactions(data.transactions, ym);
  const totalBalance = data.accounts.reduce((s, a) => s + a.balance, 0);
  const ccOutstanding = data.creditCards.reduce((s, c) => s + c.outstanding, 0);
  const monthIncome = computeMonthIncome(data.transactions, ym);
  const monthSpend = computeMonthSpend(data.transactions, ym);

  return {
    totalBalance,
    monthIncome,
    monthSpend,
    netFlow: monthIncome - monthSpend,
    ccOutstanding,
    netAssets: totalBalance - ccOutstanding,
    monthLabel: now.toLocaleString("default", { month: "long", year: "numeric" }),
    monthShort: now.toLocaleString("default", { month: "short" }),
    incomeCount: monthTx.filter((t) => t.type === "income").length,
    expenseCount: monthTx.filter((t) => t.type === "expense").length,
    cardCount: data.creditCards.length,
  };
}
