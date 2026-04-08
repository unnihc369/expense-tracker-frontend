"use client";

import { CategoryDoughnut } from "@/components/dashboard/CategoryDoughnut";
import { SpendTrendChart } from "@/components/dashboard/SpendTrendChart";
import { useDarkMode } from "@/hooks/useDarkMode";
import { EXPENSE_CATS } from "@/lib/constants";
import { fmtShort } from "@/utils/format";

type CatEntry = { key: string; value: number };

export function DashboardChartsBlock({
  monthLabel,
  categorySpend,
  trend,
}: {
  monthLabel: string;
  categorySpend: CatEntry[];
  trend: { label: string; total: number; current: boolean }[];
}) {
  const dark = useDarkMode();
  const entries = categorySpend.filter((e) => e.value > 0).sort((a, b) => b.value - a.value);
  const data = entries.map((e) => e.value);
  const colors = entries.map((e) => EXPENSE_CATS[e.key]?.color || "#888780");

  const trendLabels = trend.map((t) => t.label);
  const trendValues = trend.map((t) => t.total);
  const currentIndex = trend.findIndex((t) => t.current);

  return (
    <div className="fv-g2">
      <div className="fv-card mb-0">
        <div className="fv-card-hdr">
          <span className="fv-card-title">Spending by category</span>
          <span style={{ fontSize: 11, color: "var(--fv-t2)" }}>{monthLabel}</span>
        </div>
        <CategoryDoughnut
          labels={entries.map((e) => EXPENSE_CATS[e.key]?.label || e.key)}
          data={data}
          colors={colors}
        />
        <div className="fv-c-legend">
          {entries.slice(0, 6).map((e) => (
            <div key={e.key} className="fv-c-leg">
              <span
                className="fv-c-dot"
                style={{ background: EXPENSE_CATS[e.key]?.color || "#888" }}
              />
              {EXPENSE_CATS[e.key]?.label || e.key}{" "}
              <strong style={{ color: "var(--fv-t1)", marginLeft: 2 }}>{fmtShort(e.value)}</strong>
            </div>
          ))}
        </div>
      </div>
      <div className="fv-card mb-0">
        <div className="fv-card-hdr">
          <span className="fv-card-title">6-month spend trend</span>
        </div>
        <SpendTrendChart
          labels={trendLabels}
          values={trendValues}
          currentIndex={currentIndex >= 0 ? currentIndex : trend.length - 1}
          dark={dark}
        />
      </div>
    </div>
  );
}
