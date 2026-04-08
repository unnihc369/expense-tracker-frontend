import { loadFinvoiceSnapshotForSsr } from "@/lib/ssr-snapshot";
import { FinvoiceSsrBridge } from "@/components/providers/FinvoiceSsrBridge";
import { DashboardShell } from "@/components/layout/DashboardShell";

export const dynamic = "force-dynamic";

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { snapshot, apiError } = await loadFinvoiceSnapshotForSsr();

  return (
    <>
      <FinvoiceSsrBridge snapshot={snapshot} />
      <DashboardShell apiWarning={apiError}>{children}</DashboardShell>
    </>
  );
}
