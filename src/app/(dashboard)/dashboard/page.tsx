import { loadFinvoiceSnapshotForSsr } from "@/lib/ssr-snapshot";
import {
  buildAlerts,
  buildMetrics,
  computeCategorySpend,
  computeSixMonthTrend,
} from "@/lib/dashboard-compute";
import { AlertsList } from "@/components/dashboard/AlertsList";
import { MetricsGrid } from "@/components/dashboard/MetricsGrid";
import { DashboardChartsBlock } from "@/components/dashboard/DashboardChartsBlock";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";

export const dynamic = "force-dynamic";

/**
 * SSR: metrics, alerts, recent transactions, and chart inputs are computed on the server
 * from the cached snapshot (same request as layout — single fetch via React `cache()`).
 */
export default async function DashboardPage() {
  const { snapshot } = await loadFinvoiceSnapshotForSsr();
  const alerts = buildAlerts(snapshot);
  const metrics = buildMetrics(snapshot);
  const spend = computeCategorySpend(snapshot.transactions);
  const categorySpend = Object.entries(spend).map(([key, value]) => ({ key, value }));
  const trend = computeSixMonthTrend(snapshot.transactions);

  return (
    <main>
      <AlertsList alerts={alerts} />
      <MetricsGrid m={metrics} />
      <DashboardChartsBlock
        monthLabel={metrics.monthLabel}
        categorySpend={categorySpend}
        trend={trend}
      />
      <div style={{ height: "0.875rem" }} />
      <section className="fv-card">
        <div className="fv-card-hdr">
          <span className="fv-card-title">Recent transactions</span>
        </div>
        <RecentTransactions items={snapshot.transactions} />
      </section>
    </main>
  );
}
