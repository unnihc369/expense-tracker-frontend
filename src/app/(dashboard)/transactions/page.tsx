import { loadFinvoiceSnapshotForSsr } from "@/lib/ssr-snapshot";
import { TransactionsClient } from "@/components/transactions/TransactionsClient";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const { snapshot } = await loadFinvoiceSnapshotForSsr();
  return <TransactionsClient transactions={snapshot.transactions} />;
}
