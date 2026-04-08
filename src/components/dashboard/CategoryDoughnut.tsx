"use client";

import { Chart as ChartJS, ArcElement, Tooltip } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { fmtInr } from "@/utils/format";

ChartJS.register(ArcElement, Tooltip);

export function CategoryDoughnut({
  labels,
  data,
  colors,
}: {
  labels: string[];
  data: number[];
  colors: string[];
}) {
  if (!data.length || !data.some((d) => d > 0)) {
    return (
      <div className="fv-empty" style={{ padding: "1rem 0" }}>
        No expenses this month
      </div>
    );
  }

  return (
    <div style={{ position: "relative", width: "100%", height: 185 }}>
      <Doughnut
        data={{
          labels,
          datasets: [
            {
              data,
              backgroundColor: colors,
              borderWidth: 2,
              borderColor: "transparent",
              hoverBorderColor: "transparent",
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          cutout: "62%",
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (ctx) => ` ${fmtInr(Number(ctx.raw))}`,
              },
            },
          },
        }}
      />
    </div>
  );
}
