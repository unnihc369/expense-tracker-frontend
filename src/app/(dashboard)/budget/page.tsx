import { loadFinvoiceSnapshotForSsr } from "@/lib/ssr-snapshot";
import { computeCategorySpend } from "@/lib/dashboard-compute";
import { BudgetClient } from "@/components/budget/BudgetClient";

export const dynamic = "force-dynamic";

export default async function BudgetPage() {
  const { snapshot } = await loadFinvoiceSnapshotForSsr();
  const monthSpend = computeCategorySpend(snapshot.transactions);
  return <BudgetClient monthSpend={monthSpend} />;
}
