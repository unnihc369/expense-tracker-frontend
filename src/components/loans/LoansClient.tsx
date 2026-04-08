"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { FinvoiceLoan, LoanDirection } from "@/types/finvoice";
import { useFinvoiceStore } from "@/store/finvoice.store";
import { fmtDateShort, fmtInr } from "@/utils/format";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useAppStore } from "@/store/app.store";
import { backendJson } from "@/lib/api";

interface ApiLoan {
  _id: string;
  name: string;
  direction: LoanDirection;
  amount: number;
  remaining: number;
  date?: string;
  accountId?: string | null;
  note?: string;
  status?: "active" | "settled";
}

export function LoansClient() {
  const router = useRouter();
  const loans = useFinvoiceStore((s) => s.loans);
  const accounts = useFinvoiceStore((s) => s.accounts);
  const showToast = useAppStore((s) => s.showToast);

  const [open, setOpen] = useState(false);
  const [editingLoanId, setEditingLoanId] = useState<string | null>(null);
  const [payOpen, setPayOpen] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState<string | null>(null);
  const [payAmt, setPayAmt] = useState("");
  const [dir, setDir] = useState<LoanDirection>("lent");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [remaining, setRemaining] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [account, setAccount] = useState("");
  const [note, setNote] = useState("");

  const lent = loans.filter((l) => l.direction === "lent");
  const borrowed = loans.filter((l) => l.direction === "borrowed");
  const lentTotal = lent.filter((l) => l.status === "active").reduce((s, l) => s + l.remaining, 0);
  const borTotal = borrowed
    .filter((l) => l.status === "active")
    .reduce((s, l) => s + l.remaining, 0);

  function accountIdByName(accountName: string) {
    return accounts.find((a) => a.name === accountName)?.id || null;
  }

  function openLoanModal(initialDir: LoanDirection, id?: string) {
    const loan = id ? loans.find((l) => String(l.id) === String(id)) : null;
    setEditingLoanId(id || null);
    setDir(loan?.direction || initialDir);
    setName(loan?.name || "");
    setAmount(loan ? String(loan.amount) : "");
    setRemaining(loan ? String(loan.remaining) : "");
    setDate(loan?.date || new Date().toISOString().slice(0, 10));
    setAccount(loan?.account || "");
    setNote(loan?.note || "");
    setOpen(true);
  }

  async function saveLoan() {
    const n = name.trim();
    const am = parseFloat(amount) || 0;
    const rem = parseFloat(remaining) || am;
    if (!n || !am) {
      showToast("Fill name and amount");
      return;
    }
    try {
      const payload = {
        name: n,
        direction: dir,
        amount: am,
        remaining: rem,
        date,
        accountId: accountIdByName(account || accounts[0]?.name || ""),
        note,
        status: rem <= 0 ? "settled" : "active",
      };
      if (editingLoanId) {
        await backendJson<ApiLoan>(["loans", editingLoanId], {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await backendJson<ApiLoan>(["loans"], {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setOpen(false);
      setEditingLoanId(null);
      setName("");
      setAmount("");
      setRemaining("");
      setNote("");
      router.refresh();
      showToast(editingLoanId ? "Loan updated" : "Loan added");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not save loan");
    }
  }

  async function doPay() {
    if (!payOpen) return;
    const n = parseFloat(payAmt);
    if (!n || n <= 0) {
      showToast("Enter payment amount");
      return;
    }
    try {
      await backendJson<ApiLoan>(["loans", payOpen, "payment"], {
        method: "POST",
        body: JSON.stringify({ amount: n }),
      });
      setPayOpen(null);
      setPayAmt("");
      router.refresh();
      showToast("Payment recorded");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not record payment");
    }
  }

  async function confirmDeleteLoan() {
    if (!deleteOpen) return;
    try {
      await backendJson<{ message: string }>(["loans", deleteOpen], {
        method: "DELETE",
      });
      setDeleteOpen(null);
      router.refresh();
      showToast("Loan deleted");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not delete loan");
    }
  }

  return (
    <main>
      <div className="fv-pg-hdr">
        <div className="fv-pg-title">Loans &amp; dues</div>
        <div className="fv-pg-sub">Track money lent and borrowed</div>
      </div>

      <div className="fv-ls">
        <div className="fv-ls-card">
          <div className="fv-ls-lbl">They owe me</div>
          <div className="fv-ls-val" style={{ color: "var(--fv-acc)" }}>
            {fmtInr(lentTotal)}
          </div>
        </div>
        <div className="fv-ls-card">
          <div className="fv-ls-lbl">I owe them</div>
          <div className="fv-ls-val" style={{ color: "var(--fv-dan)" }}>
            {fmtInr(borTotal)}
          </div>
        </div>
        <div className="fv-ls-card">
          <div className="fv-ls-lbl">Net position</div>
          <div
            className="fv-ls-val"
            style={{ color: lentTotal - borTotal >= 0 ? "var(--fv-acc)" : "var(--fv-dan)" }}
          >
            {fmtInr(Math.abs(lentTotal - borTotal))}
          </div>
        </div>
      </div>

      <div className="fv-sec-lbl">
        Money I lent
        <button
          type="button"
          className="fv-sec-add"
          onClick={() => {
            openLoanModal("lent");
          }}
        >
          + Add
        </button>
      </div>
      {lent.length ? (
        lent.map((l) => (
          <LoanRow
            key={l.id}
            loan={l}
            onPay={() => {
              setPayOpen(String(l.id));
              setPayAmt(String(l.remaining));
            }}
            onEdit={() => openLoanModal("lent", String(l.id))}
            onDelete={() => setDeleteOpen(String(l.id))}
          />
        ))
      ) : (
        <div className="fv-empty fv-card">No money lent</div>
      )}

      <div className="fv-sec-lbl mt-6">
        Money I borrowed
        <button
          type="button"
          className="fv-sec-add"
          onClick={() => {
            openLoanModal("borrowed");
          }}
        >
          + Add
        </button>
      </div>
      {borrowed.length ? (
        borrowed.map((l) => (
          <LoanRow
            key={l.id}
            loan={l}
            onPay={() => {
              setPayOpen(String(l.id));
              setPayAmt(String(l.remaining));
            }}
            onEdit={() => openLoanModal("borrowed", String(l.id))}
            onDelete={() => setDeleteOpen(String(l.id))}
          />
        ))
      ) : (
        <div className="fv-empty fv-card">No borrowed money tracked</div>
      )}

      <Modal
        open={open}
        title={editingLoanId ? "Edit loan entry" : "Add loan entry"}
        onClose={() => {
          setOpen(false);
          setEditingLoanId(null);
        }}
      >
        <div className="fv-fg">
          <label className="fv-fl">Person / entity</label>
          <input className="fv-fi" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        {!editingLoanId ? (
          <div className="flex border border-[var(--fv-bdm)] rounded-lg overflow-hidden mb-3">
            <button
              type="button"
              className={`flex-1 py-2 text-sm ${dir === "lent" ? "bg-[var(--fv-bs)] font-medium" : ""}`}
              onClick={() => setDir("lent")}
            >
              I lent them
            </button>
            <button
              type="button"
              className={`flex-1 py-2 text-sm ${dir === "borrowed" ? "bg-[var(--fv-bs)] font-medium" : ""}`}
              onClick={() => setDir("borrowed")}
            >
              They lent me
            </button>
          </div>
        ) : null}
        <div className="fv-form-row">
          <div className="fv-fg">
            <label className="fv-fl">Original (₹)</label>
            <input
              className="fv-fi"
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (!remaining) setRemaining(e.target.value);
              }}
            />
          </div>
          <div className="fv-fg">
            <label className="fv-fl">Remaining (₹)</label>
            <input
              className="fv-fi"
              type="number"
              value={remaining}
              onChange={(e) => setRemaining(e.target.value)}
            />
          </div>
        </div>
        <div className="fv-form-row">
          <div className="fv-fg">
            <label className="fv-fl">Date</label>
            <input
              className="fv-fi"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="fv-fg">
            <label className="fv-fl">Account</label>
            <select className="fv-fi" value={account} onChange={(e) => setAccount(e.target.value)}>
              <option value="">Select</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.name}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="fv-fg">
          <label className="fv-fl">Note</label>
          <input className="fv-fi" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="fv-modal-footer">
          <button type="button" className="fv-btn-cancel" onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button type="button" className="fv-btn-ok" onClick={saveLoan}>
            Save
          </button>
        </div>
      </Modal>

      <Modal
        open={Boolean(payOpen)}
        title="Record payment"
        small
        onClose={() => setPayOpen(null)}
      >
        <div className="fv-fg">
          <label className="fv-fl">Amount (₹)</label>
          <input
            className="fv-fi"
            type="number"
            value={payAmt}
            onChange={(e) => setPayAmt(e.target.value)}
          />
        </div>
        <div className="fv-modal-footer">
          <button type="button" className="fv-btn-cancel" onClick={() => setPayOpen(null)}>
            Cancel
          </button>
          <button type="button" className="fv-btn-ok" onClick={doPay}>
            Record
          </button>
        </div>
      </Modal>

      <ConfirmModal
        open={Boolean(deleteOpen)}
        title="Delete this loan entry?"
        onClose={() => setDeleteOpen(null)}
        onConfirm={confirmDeleteLoan}
      />
    </main>
  );
}

function LoanRow({
  loan: l,
  onPay,
  onEdit,
  onDelete,
}: {
  loan: FinvoiceLoan;
  onPay: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const initials = l.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const color = l.direction === "lent" ? "#1D9E75" : "#E24B4A";
  const bgc = l.direction === "lent" ? "rgba(29,158,117,0.12)" : "rgba(226,75,74,0.12)";
  const pct = l.amount > 0 ? Math.round((1 - l.remaining / l.amount) * 100) : 100;

  return (
    <div className="fv-loan-card">
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
        style={{ background: bgc, color }}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium">{l.name}</div>
        <div className="text-xs mt-0.5" style={{ color: "var(--fv-t2)" }}>
          {fmtDateShort(l.date)} · {l.account}
          {l.note ? ` · ${l.note}` : ""}
        </div>
        {l.status === "active" && l.amount > 0 ? (
          <>
            <div className="fv-b-bar h-1 my-1">
              <div className="fv-b-fill" style={{ width: `${pct}%`, background: color }} />
            </div>
            <div className="text-[10px]" style={{ color: "var(--fv-t2)" }}>
              {pct}% paid back
            </div>
          </>
        ) : null}
        <span
          className="inline-block text-[10px] px-2 py-0.5 rounded-full mt-1"
          style={
            l.status === "settled"
              ? { background: "#EAF3DE", color: "#27500A" }
              : { background: "#E6F1FB", color: "#0C447C" }
          }
        >
          {l.status === "settled" ? "Settled" : "Active"}
        </span>
      </div>
      <div className="text-right shrink-0">
        <div className="font-medium" style={{ fontFamily: "var(--fv-mono)", color }}>
          {fmtInr(l.remaining)}
        </div>
        <div className="text-xs" style={{ color: "var(--fv-t2)" }}>
          of {fmtInr(l.amount)}
        </div>
        <div className="flex gap-1 justify-end mt-2">
          {l.status === "active" ? (
            <button type="button" className="fv-btn-cancel text-xs py-1" onClick={onPay}>
              Pay
            </button>
          ) : null}
          <button type="button" className="fv-btn-cancel text-xs py-1" onClick={onEdit}>
            Edit
          </button>
          <button type="button" className="fv-btn-del text-xs py-1" onClick={onDelete}>
            Del
          </button>
        </div>
      </div>
    </div>
  );
}
