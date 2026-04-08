"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { fmtInr, fmtShort } from "@/utils/format";
import { semantic } from "@/colors";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export function SpendTrendChart({
  labels,
  values,
  currentIndex,
  dark,
}: {
  labels: string[];
  values: number[];
  currentIndex: number;
  dark: boolean;
}) {
  const tick = dark ? semantic.dark.t3 : "#888780";
  const grid = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const barColors = values.map((_, i) =>
    i === currentIndex ? semantic.light.dan : "#D3D1C7"
  );

  return (
    <div style={{ position: "relative", width: "100%", height: 185 }}>
      <Bar
        data={{
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: barColors,
              borderRadius: 4,
              borderSkipped: false,
            },
          ],
        }}
        options={{
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (c) => ` ${fmtInr(Number(c.raw))}`,
              },
            },
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { font: { size: 11 }, color: tick },
            },
            y: {
              grid: { color: grid },
              ticks: {
                font: { size: 11 },
                color: tick,
                callback: (v) => fmtShort(Number(v)),
              },
            },
          },
        }}
      />
    </div>
  );
}
