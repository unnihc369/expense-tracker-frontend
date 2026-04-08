"use client";

import { useMemo, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { EXPENSE_CATS, DEFAULT_BUDGETS } from "@/lib/constants";
import { useFinvoiceStore } from "@/store/finvoice.store";
import { fmtInr, fmtShort } from "@/utils/format";
import { Modal } from "@/components/ui/Modal";
import { useAppStore } from "@/store/app.store";
import { useDarkMode } from "@/hooks/useDarkMode";
import { semantic } from "@/colors";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

export function BudgetClient({
  monthSpend,
}: {
  monthSpend: Record<string, number>;
}) {
  const dark = useDarkMode();
  const budgets = useFinvoiceStore((s) => s.budgets);
  const setBudgetLines = useFinvoiceStore((s) => s.setBudgetLines);
  const showToast = useAppStore((s) => s.showToast);
  const [editOpen, setEditOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});

  const mergedBudgets = useMemo(
    () => ({ ...DEFAULT_BUDGETS, ...budgets }),
    [budgets],
  );
  const cats = useMemo(
    () => Object.keys(mergedBudgets).filter((k) => EXPENSE_CATS[k]),
    [mergedBudgets],
  );

  const chartData = useMemo(() => {
    const labels = cats.map((k) => (EXPENSE_CATS[k]?.label || k).split(" ")[0]);
    return {
      labels,
      datasets: [
        {
          label: "Budget",
          data: cats.map((k) => mergedBudgets[k] ?? 0),
          backgroundColor: "rgba(55,138,221,0.22)",
          borderRadius: 3,
        },
        {
          label: "Actual",
          data: cats.map((k) => monthSpend[k] || 0),
          backgroundColor: semantic.light.dan,
          borderRadius: 3,
        },
      ],
    };
  }, [cats, mergedBudgets, monthSpend]);

  const tick = dark ? semantic.dark.t3 : "#888780";
  const grid = dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";

  function openEdit() {
    const d: Record<string, string> = {};
    cats.forEach((k) => {
      d[k] = String(mergedBudgets[k] ?? 0);
    });
    setDraft(d);
    setEditOpen(true);
  }

  function saveBudgets() {
    const next: Record<string, number> = {};
    cats.forEach((k) => {
      next[k] = parseFloat(draft[k]) || 0;
    });
    setBudgetLines(next);
    setEditOpen(false);
    showToast("Budgets updated");
  }

  const now = new Date();

  return (
    <main>
      <div className="fv-pg-hdr">
        <div className="fv-pg-title">Budget tracker</div>
        <div className="fv-pg-sub">
          {now.toLocaleString("default", { month: "long", year: "numeric" })}{" "}
          budget performance
        </div>
      </div>

      <div className="fv-g2">
        <div className="fv-card mb-0">
          <div className="fv-card-hdr">
            <span className="fv-card-title">Budget vs actual</span>
            <button type="button" className="fv-card-link" onClick={openEdit}>
              Edit budgets
            </button>
          </div>
          {cats.map((cat) => {
            const bud = mergedBudgets[cat] ?? 0;
            const act = monthSpend[cat] || 0;
            const pct =
              bud > 0 ? Math.min(Math.round((act / bud) * 100), 100) : 0;
            const over = act > bud;
            const bc = over ? "#E24B4A" : pct > 75 ? "#EF9F27" : "#1D9E75";
            return (
              <div key={cat} className="fv-b-row">
                <div className="fv-b-hdr">
                  <div>
                    {EXPENSE_CATS[cat]?.label || cat}
                    {over ? (
                      <span
                        className="text-[10px] px-1 rounded ml-1"
                        style={{ background: "#FCEBEB", color: "#A32D2D" }}
                      >
                        over
                      </span>
                    ) : null}
                  </div>
                  <div
                    className="fv-b-nums"
                    style={{ fontFamily: "var(--fv-mono)" }}
                  >
                    {fmtInr(act)} / {fmtInr(bud)}
                  </div>
                </div>
                <div className="fv-b-bar">
                  <div
                    className="fv-b-fill"
                    style={{ width: `${pct}%`, background: bc }}
                  />
                </div>
              </div>
            );
          })}
        </div>
        <div className="fv-card mb-0">
          <div className="fv-card-hdr">
            <span className="fv-card-title">Utilization overview</span>
          </div>
          <div style={{ position: "relative", width: "100%", height: 340 }}>
            <Bar
              data={chartData}
              options={{
                indexAxis: "y",
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
                    grid: { color: grid },
                    ticks: {
                      font: { size: 10 },
                      color: tick,
                      callback: (v) => fmtShort(Number(v)),
                    },
                  },
                  y: {
                    grid: { display: false },
                    ticks: { font: { size: 10 }, color: tick },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      <Modal
        open={editOpen}
        title="Edit monthly budgets"
        onClose={() => setEditOpen(false)}
      >
        <div
          className="grid gap-2"
          style={{
            gridTemplateColumns: "1fr 1fr",
            maxHeight: "50vh",
            overflowY: "auto",
          }}
        >
          {cats.map((cat) => (
            <div key={cat} className="fv-fg">
              <label className="fv-fl">{EXPENSE_CATS[cat]?.label || cat}</label>
              <input
                className="fv-fi"
                type="number"
                min={0}
                value={draft[cat] ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, [cat]: e.target.value }))
                }
              />
            </div>
          ))}
        </div>
        <div className="fv-modal-footer">
          <button
            type="button"
            className="fv-btn-cancel"
            onClick={() => setEditOpen(false)}
          >
            Cancel
          </button>
          <button type="button" className="fv-btn-ok" onClick={saveBudgets}>
            Save
          </button>
        </div>
      </Modal>
    </main>
  );
}
