"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { FinvoiceTransaction, TxType } from "@/types/finvoice";
import { EXPENSE_CATS, INCOME_CATS } from "@/lib/constants";
import { fmtDateShort, fmtInr } from "@/utils/format";
import { useAppStore } from "@/store/app.store";
import { useFinvoiceStore } from "@/store/finvoice.store";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { backendJson } from "@/lib/api";
import { mapApiTransactionToFinvoice, type ApiTransaction } from "@/lib/map-api-transaction";

type Filter = "all" | TxType;
type TxModalType = "expense" | "income";
const PAGE_SIZE = 10;

type TxAccountOption = {
  id: string;
  name: string;
  kind: "bank" | "credit-card";
};

function catLabel(t: FinvoiceTransaction): string {
  if (t.type === "income") return INCOME_CATS[t.category]?.label || t.category;
  if (t.type === "cc_payment") return "CC Payment";
  return EXPENSE_CATS[t.category]?.label || t.category;
}

function rowStyle(t: FinvoiceTransaction) {
  if (t.type === "income") {
    const c = INCOME_CATS[t.category] || INCOME_CATS.other_income;
    return { bg: `${c.color}22`, color: c.color, icon: c.icon };
  }
  if (t.type === "cc_payment") {
    return { bg: "#DDF0FC", color: "#378ADD", icon: "CC" };
  }
  const c = EXPENSE_CATS[t.category] || EXPENSE_CATS.other;
  return { bg: `${c.color}22`, color: c.color, icon: c.icon };
}

export function TransactionsClient({ transactions }: { transactions: FinvoiceTransaction[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showToast = useAppStore((s) => s.showToast);
  const accounts = useFinvoiceStore((s) => s.accounts);
  const creditCards = useFinvoiceStore((s) => s.creditCards);
  const [rows, setRows] = useState(transactions);
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FinvoiceTransaction | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [txType, setTxType] = useState<TxModalType>("expense");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState("other");
  const [accountId, setAccountId] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    setRows(transactions);
  }, [transactions]);

  useEffect(() => {
    setPage(1);
  }, [search, from, to, filter]);

  const accountOptions = useMemo<TxAccountOption[]>(
    () => [
      ...accounts.map((a) => ({ id: String(a.id), name: a.name, kind: "bank" as const })),
      ...(txType === "expense"
        ? creditCards.map((c) => ({
            id: String(c.id),
            name: c.name,
            kind: "credit-card" as const,
          }))
        : []),
    ],
    [accounts, creditCards, txType]
  );

  const categoryOptions = txType === "income" ? INCOME_CATS : EXPENSE_CATS;

  function openTxModal(type: TxModalType, tx?: FinvoiceTransaction) {
    setEditing(tx || null);
    setTxType(tx?.type === "income" ? "income" : type);
    setAmount(tx ? String(tx.amount) : "");
    setDate(tx?.date || new Date().toISOString().slice(0, 10));
    setMerchant(tx?.merchant || "");
    setCategory(tx?.category || (type === "income" ? "salary" : "other"));

    const bankMatch = accounts.find((a) => a.name === tx?.account);
    const ccMatch = creditCards.find((c) => c.name === tx?.account);
    setAccountId(bankMatch?.id ? String(bankMatch.id) : ccMatch?.id ? String(ccMatch.id) : "");
    setNote(tx?.note || "");
    setOpen(true);
  }

  useEffect(() => {
    const add = searchParams.get("add");
    if (add === "income" || add === "expense") {
      openTxModal(add);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const filtered = useMemo(() => {
    let txs = rows
      .map((t, index) => ({ t, index }))
      .sort((a, b) => {
        const byDate = new Date(b.t.date).getTime() - new Date(a.t.date).getTime();
        return byDate !== 0 ? byDate : a.index - b.index;
      })
      .map(({ t }) => t);
    const q = search.toLowerCase();
    if (q)
      txs = txs.filter(
        (t) =>
          t.merchant.toLowerCase().includes(q) ||
          (t.note || "").toLowerCase().includes(q) ||
          catLabel(t).toLowerCase().includes(q)
      );
    if (from) txs = txs.filter((t) => t.date >= from);
    if (to) txs = txs.filter((t) => t.date <= to);
    if (filter === "expense") txs = txs.filter((t) => t.type === "expense");
    else if (filter === "income") txs = txs.filter((t) => t.type === "income");
    else if (filter === "cc_payment") txs = txs.filter((t) => t.type === "cc_payment");
    return txs;
  }, [rows, search, from, to, filter]);

  const inc = filtered.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const exp = filtered.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    setPage((p) => Math.min(p, pageCount));
  }, [pageCount]);

  const exportExcel = useCallback(async () => {
    try {
      const XLSX = await import("xlsx");
      const exportRows = rows.map((t) => ({
        Date: t.date,
        Merchant: t.merchant,
        Type: t.type,
        Category: catLabel(t),
        Amount: t.amount,
        Account: t.account,
        Note: t.note || "",
        CC: t.ccPurchase ? "Yes" : "No",
      }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(exportRows), "Transactions");
      XLSX.writeFile(wb, `finvoice_${new Date().toISOString().slice(0, 10)}.xlsx`);
      showToast("Exported to Excel");
    } catch {
      showToast("Export failed — check connection");
    }
  }, [rows, showToast]);

  const hasFilters = Boolean(search || from || to || filter !== "all");

  async function saveTransaction() {
    const n = parseFloat(amount);
    if (!n || n <= 0) {
      showToast("Enter a valid amount");
      return;
    }
    if (!merchant.trim()) {
      showToast(txType === "income" ? "Enter source name" : "Enter merchant name");
      return;
    }
    if (!accountId) {
      showToast("Select an account");
      return;
    }

    const selected = accountOptions.find((a) => a.id === accountId);
    try {
      if (editing) {
        const updated = await backendJson<ApiTransaction>(["transactions", String(editing.id)], {
          method: "PUT",
          body: JSON.stringify({
            merchant: merchant.trim(),
            category,
            note,
            date,
          }),
        });
        const mapped = mapApiTransactionToFinvoice(updated);
        setRows((prev) => prev.map((t) => (String(t.id) === String(editing.id) ? mapped : t)));
        showToast("Transaction updated");
      } else {
        const created = await backendJson<ApiTransaction>(["transactions"], {
          method: "POST",
          body: JSON.stringify({
            type: txType,
            amount: n,
            merchant: merchant.trim(),
            category,
            note,
            date,
            accountId,
            isCreditCard: selected?.kind === "credit-card",
          }),
        });
        const mapped = mapApiTransactionToFinvoice(created);
        setRows((prev) => [mapped, ...prev]);
        showToast(`Added ${txType === "income" ? "+" : "-"}${fmtInr(n)} ${merchant.trim()}`);
      }
      setOpen(false);
      setEditing(null);
      router.refresh();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not save transaction");
    }
  }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await backendJson<{ message: string }>(["transactions", deleteId], {
        method: "DELETE",
      });
      setRows((prev) => prev.filter((t) => String(t.id) !== String(deleteId)));
      setDeleteId(null);
      router.refresh();
      showToast("Transaction deleted");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not delete transaction");
    }
  }

  return (
    <main>
      <div className="fv-pg-hdr">
        <div className="fv-pg-title">Transactions</div>
        <div className="fv-pg-sub">
          {filtered.length} entries · In {fmtInr(inc)} · Out {fmtInr(exp)} · Net {fmtInr(inc - exp)}
        </div>
      </div>

      <div className="fv-filter-bar">
        <div style={{ position: "relative", flex: 1, minWidth: 150 }}>
          <span
            style={{
              position: "absolute",
              left: 9,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--fv-t3)",
              fontSize: 12,
            }}
          >
            ⌕
          </span>
          <input
            className="fv-fi-search"
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search"
          />
        </div>
        <input
          type="date"
          className="fv-fi-date"
          value={from}
          onChange={(e) => setFrom(e.target.value)}
          aria-label="From date"
        />
        <input
          type="date"
          className="fv-fi-date"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          aria-label="To date"
        />
        {hasFilters ? (
          <button
            type="button"
            className="fv-f-btn"
            onClick={() => {
              setSearch("");
              setFrom("");
              setTo("");
              setFilter("all");
            }}
          >
            Clear filters
          </button>
        ) : null}
        <button type="button" className="fv-exp-btn" onClick={exportExcel}>
          Export Excel
        </button>
      </div>

      <div className="fv-filter-bar" style={{ marginBottom: "0.75rem" }}>
        {(["all", "expense", "income", "cc_payment"] as const).map((f) => (
          <button
            key={f}
            type="button"
            className={`fv-f-btn ${filter === f ? "fv-f-btn-on" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "all"
              ? "All"
              : f === "cc_payment"
                ? "CC Payments"
                : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button type="button" className="fv-btn-inc" onClick={() => openTxModal("income")}>
            + Income
          </button>
          <button type="button" className="fv-btn-exp" onClick={() => openTxModal("expense")}>
            + Expense
          </button>
        </div>
      </div>

      <div className="fv-card">
        {paginated.length ? (
          paginated.map((t) => {
            const st = rowStyle(t);
            const sign = t.type === "income" ? "+" : "−";
            const amtClass =
              t.type === "income"
                ? "fv-tx-amt-inc"
                : t.type === "cc_payment"
                  ? "fv-tx-amt-ccp"
                  : "fv-tx-amt-exp";
            return (
              <div key={t.id} className="fv-tx">
                <div className="fv-tx-ico" style={{ background: st.bg, color: st.color }}>
                  {st.icon}
                </div>
                <div className="fv-tx-body">
                  <div className="fv-tx-name">{t.merchant}</div>
                  <div className="fv-tx-cat">
                    {catLabel(t)}
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
                  {t.type !== "cc_payment" ? (
                    <div className="flex gap-1 justify-end mt-2">
                      <button
                        type="button"
                        className="fv-btn-cancel text-xs py-1"
                        onClick={() => openTxModal(t.type === "income" ? "income" : "expense", t)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="fv-btn-del text-xs py-1"
                        onClick={() => setDeleteId(String(t.id))}
                      >
                        Delete
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })
        ) : (
          <div className="fv-empty">No transactions match your filters</div>
        )}
      </div>

      {filtered.length > PAGE_SIZE ? (
        <div
          className="flex items-center justify-between mt-3"
          style={{ color: "var(--fv-t2)", fontSize: 13 }}
        >
          <div>
            Showing {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} of{" "}
            {filtered.length}
          </div>
          <div className="flex gap-2 items-center">
            <button
              type="button"
              className="fv-f-btn"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Prev
            </button>
            <span>
              Page {page} / {pageCount}
            </span>
            <button
              type="button"
              className="fv-f-btn"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={page === pageCount}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}

      <Modal
        open={open}
        title={`${editing ? "Edit" : "Add"} ${txType === "income" ? "income" : "expense"}`}
        onClose={() => {
          setOpen(false);
          setEditing(null);
        }}
      >
        {!editing ? (
          <div className="flex border border-[var(--fv-bdm)] rounded-lg overflow-hidden mb-3">
            <button
              type="button"
              className={`flex-1 py-2 text-sm ${txType === "expense" ? "bg-[var(--fv-bs)] font-medium" : ""}`}
              onClick={() => setTxType("expense")}
            >
              Expense
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-sm ${txType === "income" ? "bg-[var(--fv-bs)] font-medium" : ""}`}
              onClick={() => setTxType("income")}
            >
              Income
            </button>
          </div>
        ) : null}
        <div className="fv-form-row">
          <div className="fv-fg">
            <label className="fv-fl">Amount (₹)</label>
            <input className="fv-fi" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div className="fv-fg">
            <label className="fv-fl">Date</label>
            <input className="fv-fi" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
        </div>
        <div className="fv-fg">
          <label className="fv-fl">{txType === "income" ? "Source / from" : "Merchant / where"}</label>
          <input className="fv-fi" value={merchant} onChange={(e) => setMerchant(e.target.value)} />
        </div>
        <div className="fv-form-row">
          <div className="fv-fg">
            <label className="fv-fl">Category</label>
            <select className="fv-fi" value={category} onChange={(e) => setCategory(e.target.value)}>
              {Object.entries(categoryOptions).map(([key, meta]) => (
                <option key={key} value={key}>
                  {meta.label}
                </option>
              ))}
            </select>
          </div>
          <div className="fv-fg">
            <label className="fv-fl">Account</label>
            <select className="fv-fi" value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              <option value="">Select</option>
              {accountOptions.map((a) => (
                <option key={`${a.kind}-${a.id}`} value={a.id}>
                  {a.kind === "credit-card" ? `[CC] ${a.name}` : a.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        {txType === "expense" && accountOptions.find((a) => a.id === accountId)?.kind === "credit-card" ? (
          <div
            style={{
              fontSize: 12,
              background: "rgba(55,138,221,.1)",
              color: "#185FA5",
              padding: "7px 10px",
              borderRadius: "var(--fv-r8, 10px)",
              marginBottom: 9,
            }}
          >
            This will be added to the selected card&apos;s outstanding balance.
          </div>
        ) : null}
        <div className="fv-fg">
          <label className="fv-fl">Note (optional)</label>
          <input className="fv-fi" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="fv-modal-footer">
          <button
            type="button"
            className="fv-btn-cancel"
            onClick={() => {
              setOpen(false);
              setEditing(null);
            }}
          >
            Cancel
          </button>
          <button type="button" className="fv-btn-ok" onClick={saveTransaction}>
            Save
          </button>
        </div>
      </Modal>

      <ConfirmModal
        open={Boolean(deleteId)}
        title="Delete this transaction?"
        subtitle="This cannot be undone."
        onClose={() => setDeleteId(null)}
        onConfirm={confirmDelete}
      />
    </main>
  );
}
