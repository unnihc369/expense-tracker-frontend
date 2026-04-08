import type { DashboardMetrics } from "@/types/finvoice";
import { fmtShort } from "@/utils/format";

export function MetricsGrid({ m }: { m: DashboardMetrics }) {
  return (
    <div className="fv-metrics">
      <div className="fv-mc">
        <div className="fv-mc-lbl">Total balance</div>
        <div className="fv-mc-val fv-mc-val-g">{fmtShort(m.totalBalance)}</div>
        <div className="fv-mc-sub">All accounts</div>
      </div>
      <div className="fv-mc">
        <div className="fv-mc-lbl">Income · {m.monthShort}</div>
        <div className="fv-mc-val fv-mc-val-g">{fmtShort(m.monthIncome)}</div>
        <div className="fv-mc-sub">{m.incomeCount} entries</div>
      </div>
      <div className="fv-mc">
        <div className="fv-mc-lbl">Spent · {m.monthShort}</div>
        <div className="fv-mc-val fv-mc-val-r">{fmtShort(m.monthSpend)}</div>
        <div className="fv-mc-sub">{m.expenseCount} transactions</div>
      </div>
      <div className="fv-mc">
        <div className="fv-mc-lbl">Net flow</div>
        <div
          className={`fv-mc-val ${m.netFlow >= 0 ? "fv-mc-val-g" : "fv-mc-val-r"}`}
        >
          {fmtShort(Math.abs(m.netFlow))}
        </div>
        <div className="fv-mc-sub">{m.netFlow >= 0 ? "Surplus" : "Deficit"}</div>
      </div>
      <div className="fv-mc">
        <div className="fv-mc-lbl">CC outstanding</div>
        <div className="fv-mc-val fv-mc-val-a">{fmtShort(m.ccOutstanding)}</div>
        <div className="fv-mc-sub">{m.cardCount} cards</div>
      </div>
      <div className="fv-mc">
        <div className="fv-mc-lbl">Net assets</div>
        <div
          className={`fv-mc-val ${m.netAssets >= 0 ? "fv-mc-val-g" : "fv-mc-val-r"}`}
        >
          {fmtShort(m.netAssets)}
        </div>
        <div className="fv-mc-sub">Balance − CC</div>
      </div>
    </div>
  );
}
