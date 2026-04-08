export type TxType = "expense" | "income" | "cc_payment";

export interface FinvoiceTransaction {
  id: string;
  merchant: string;
  amount: number;
  category: string;
  date: string;
  account: string;
  note?: string;
  type: TxType;
  ccPurchase?: boolean;
}

export interface FinvoiceAccount {
  id: string;
  name: string;
  type: string;
  balance: number;
  color: string;
}

export interface FinvoiceCreditCard {
  id: string;
  name: string;
  limit: number;
  outstanding: number;
  dueDate: string;
  color: string;
}

export type LoanDirection = "lent" | "borrowed";
export type LoanStatus = "active" | "settled";

export interface FinvoiceLoan {
  id: string;
  name: string;
  direction: LoanDirection;
  amount: number;
  remaining: number;
  date: string;
  account: string;
  note?: string;
  status: LoanStatus;
}

export type BudgetMap = Record<string, number>;

export interface FinvoiceSnapshot {
  transactions: FinvoiceTransaction[];
  accounts: FinvoiceAccount[];
  creditCards: FinvoiceCreditCard[];
  budgets: BudgetMap;
  loans: FinvoiceLoan[];
}

export interface DashboardAlert {
  type: "danger" | "warning";
  message: string;
}

export interface DashboardMetrics {
  totalBalance: number;
  monthIncome: number;
  monthSpend: number;
  netFlow: number;
  ccOutstanding: number;
  netAssets: number;
  monthLabel: string;
  monthShort: string;
  incomeCount: number;
  expenseCount: number;
  cardCount: number;
}
