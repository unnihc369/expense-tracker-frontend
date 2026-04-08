import Link from "next/link";
import type { FinvoiceTransaction } from "@/types/finvoice";
import { EXPENSE_CATS, INCOME_CATS } from "@/lib/constants";
import { fmtDateShort, fmtInr } from "@/utils/format";

function catStyle(t: FinvoiceTransaction) {
  if (t.type === "income") {
    const c = INCOME_CATS[t.category] || INCOME_CATS.other_income;
    return { label: c.label, bg: `${c.color}22`, color: c.color, icon: c.icon };
  }
  if (t.type === "cc_payment") {
    return { label: "CC Payment", bg: "#DDF0FC", color: "#378ADD", icon: "CC" };
  }
  const c = EXPENSE_CATS[t.category] || EXPENSE_CATS.other;
  return { label: c.label, bg: `${c.color}22`, color: c.color, icon: c.icon };
}

export function RecentTransactions({ items }: { items: FinvoiceTransaction[] }) {
  const sorted = [...items].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const top = sorted.slice(0, 5);

  if (!top.length) {
    return (
      <div className="fv-empty">
        No transactions yet — add income or expense from the toolbar.
      </div>
    );
  }

  return (
    <div>
      {top.map((t) => {
        const st = catStyle(t);
        const sign = t.type === "income" ? "+" : "−";
        const amtClass =
          t.type === "income" ? "fv-tx-amt-inc" : t.type === "cc_payment" ? "fv-tx-amt-ccp" : "fv-tx-amt-exp";
        return (
          <div key={t.id} className="fv-tx">
            <div
              className="fv-tx-ico"
              style={{ background: st.bg, color: st.color }}
            >
              {st.icon}
            </div>
            <div className="fv-tx-body">
              <div className="fv-tx-name">{t.merchant}</div>
              <div className="fv-tx-cat">
                {st.label}
                {t.note ? ` · ${t.note}` : ""}
              </div>
            </div>
            <div className="fv-tx-right">
              <div className="fv-tx-info">
                <div className={`fv-tx-amt ${amtClass}`}>
                  {sign}
                  {fmtInr(t.amount)}
                </div>
                <div className="fv-tx-date">
                  {fmtDateShort(t.date)} · {t.account}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <div className="mt-3 text-center">
        <Link href="/transactions" className="fv-card-link">
          View all
        </Link>
      </div>
    </div>
  );
}
