/** Category metadata aligned with finvoice_pro.html */

export const EXPENSE_CATS: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  food: { label: "Food & dining", color: "#EF9F27", icon: "FD" },
  groceries: { label: "Groceries", color: "#1D9E75", icon: "GR" },
  transport: { label: "Transport", color: "#378ADD", icon: "TR" },
  shopping: { label: "Shopping", color: "#D4537E", icon: "SH" },
  entertainment: { label: "Entertainment", color: "#7F77DD", icon: "EN" },
  utilities: { label: "Utilities", color: "#888780", icon: "UT" },
  health: { label: "Health", color: "#E24B4A", icon: "HL" },
  travel: { label: "Travel", color: "#0F6E56", icon: "TV" },
  education: { label: "Education", color: "#BA7517", icon: "ED" },
  other: { label: "Other", color: "#888780", icon: "OT" },
};

export const INCOME_CATS: Record<
  string,
  { label: string; color: string; icon: string }
> = {
  salary: { label: "Salary", color: "#1D9E75", icon: "SA" },
  freelance: { label: "Freelance", color: "#378ADD", icon: "FL" },
  investment: { label: "Investment", color: "#7F77DD", icon: "IN" },
  business: { label: "Business", color: "#EF9F27", icon: "BU" },
  rental: { label: "Rental", color: "#0F6E56", icon: "RN" },
  other_income: { label: "Other income", color: "#888780", icon: "OT" },
};

export const DEFAULT_BUDGETS: Record<string, number> = {
  food: 8000,
  groceries: 6000,
  transport: 3000,
  shopping: 5000,
  entertainment: 2000,
  utilities: 3000,
  health: 2000,
  travel: 10000,
  education: 3000,
  other: 2000,
};

export const ACCOUNT_TYPES = [
  "Savings account",
  "Current account",
  "Cash in hand",
  "Wallet",
  "Fixed deposit",
  "Other",
] as const;
