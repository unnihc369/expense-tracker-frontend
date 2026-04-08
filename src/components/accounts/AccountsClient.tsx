"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFinvoiceStore } from "@/store/finvoice.store";
import { accentPalette } from "@/colors";
import { fmtDateShort, fmtInr, fmtShort } from "@/utils/format";
import { Modal } from "@/components/ui/Modal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { useAppStore } from "@/store/app.store";
import { backendJson } from "@/lib/api";
import type { FinvoiceAccount, FinvoiceCreditCard } from "@/types/finvoice";

interface ApiBankAccount {
  _id: string;
  name: string;
  type?: string;
  color?: string;
  currentAmount?: number;
  initialAmount?: number;
  balance?: number;
}

function mapApiAccountToFinvoice(
  a: ApiBankAccount,
  fallbackColor: string,
): FinvoiceAccount {
  return {
    id: String(a._id),
    name: a.name,
    type: a.type || "Savings account",
    balance: Number(a.currentAmount ?? a.balance ?? a.initialAmount ?? 0),
    color: a.color || fallbackColor,
  };
}

interface ApiCreditCard {
  _id: string;
  name: string;
  limit?: number;
  outstanding?: number;
  dueDate?: string | null;
  color?: string;
}

function mapApiCardToFinvoice(
  c: ApiCreditCard,
  fallbackColor: string,
): FinvoiceCreditCard {
  return {
    id: String(c._id),
    name: c.name,
    limit: Number(c.limit ?? 0),
    outstanding: Number(c.outstanding ?? 0),
    dueDate: c.dueDate?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    color: c.color || fallbackColor,
  };
}

export function AccountsClient() {
  const router = useRouter();
  const accounts = useFinvoiceStore((s) => s.accounts);
  const addAccount = useFinvoiceStore((s) => s.addAccount);
  const creditCards = useFinvoiceStore((s) => s.creditCards);
  const addCreditCard = useFinvoiceStore((s) => s.addCreditCard);
  const updateCreditCard = useFinvoiceStore((s) => s.updateCreditCard);
  const removeCreditCard = useFinvoiceStore((s) => s.removeCreditCard);
  const showToast = useAppStore((s) => s.showToast);

  const [accountOpen, setAccountOpen] = useState(false);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [deletingAccountId, setDeletingAccountId] = useState<string | null>(
    null,
  );
  const [accountName, setAccountName] = useState("");
  const [accountBalance, setAccountBalance] = useState("");
  const [accountType, setAccountType] = useState("Savings account");
  const [accountColor, setAccountColor] = useState<string>(accentPalette[0]);
  const [savingAccount, setSavingAccount] = useState(false);

  const [ccOpen, setCcOpen] = useState(false);
  const [editingCcId, setEditingCcId] = useState<string | null>(null);
  const [deletingCcId, setDeletingCcId] = useState<string | null>(null);
  const [payingCcId, setPayingCcId] = useState<string | null>(null);
  const [payAmt, setPayAmt] = useState("");
  const [payDate, setPayDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [payFromAccountId, setPayFromAccountId] = useState("");
  const [name, setName] = useState("");
  const [limit, setLimit] = useState("");
  const [outstanding, setOutstanding] = useState("0");
  const [dueDate, setDueDate] = useState("");
  const [color, setColor] = useState<string>(accentPalette[3]);

  async function saveAccount() {
    const n = accountName.trim();
    if (!n) {
      showToast("Enter account name");
      return;
    }

    setSavingAccount(true);
    try {
      const payload = {
        name: n,
        type: accountType.toLowerCase().includes("current")
          ? "current"
          : accountType.toLowerCase().includes("wallet")
            ? "wallet"
            : accountType.toLowerCase().includes("cash")
              ? "cash"
              : "savings",
        balance: parseFloat(accountBalance) || 0,
        color: accountColor,
      };
      const created = editingAccountId
        ? await backendJson<ApiBankAccount>(["accounts", editingAccountId], {
            method: "PUT",
            body: JSON.stringify(payload),
          })
        : await backendJson<ApiBankAccount>(["accounts"], {
            method: "POST",
            body: JSON.stringify(payload),
          });
      addAccount(mapApiAccountToFinvoice(created, accountColor));
      setAccountOpen(false);
      setEditingAccountId(null);
      setAccountName("");
      setAccountBalance("");
      setAccountType("Savings account");
      setAccountColor(accentPalette[0]);
      router.refresh();
      showToast(
        editingAccountId ? "Bank account updated" : "Bank account added",
      );
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Could not add bank account",
      );
    } finally {
      setSavingAccount(false);
    }
  }

  function openAccountModal(id?: string) {
    const account = id
      ? accounts.find((a) => String(a.id) === String(id))
      : null;
    setEditingAccountId(id || null);
    setAccountName(account?.name || "");
    setAccountBalance(account ? String(account.balance) : "");
    setAccountType(account?.type || "Savings account");
    setAccountColor(account?.color || accentPalette[0]);
    setAccountOpen(true);
  }

  async function confirmDeleteAccount() {
    if (!deletingAccountId) return;
    try {
      await backendJson<{ message: string }>(["accounts", deletingAccountId], {
        method: "DELETE",
      });
      setDeletingAccountId(null);
      router.refresh();
      showToast("Account deleted");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Could not delete account",
      );
    }
  }

  async function saveCc() {
    const n = name.trim();
    if (!n) {
      showToast("Enter card name");
      return;
    }
    try {
      const payload = {
        name: n,
        limit: parseFloat(limit) || 0,
        outstanding: parseFloat(outstanding) || 0,
        dueDate: dueDate || new Date().toISOString().slice(0, 10),
        color,
      };
      const saved = editingCcId
        ? await backendJson<ApiCreditCard>(["credit-cards", editingCcId], {
            method: "PUT",
            body: JSON.stringify(payload),
          })
        : await backendJson<ApiCreditCard>(["credit-cards"], {
            method: "POST",
            body: JSON.stringify(payload),
          });

      const mapped = mapApiCardToFinvoice(saved, color);
      if (editingCcId) updateCreditCard(mapped.id, mapped);
      else addCreditCard(mapped);

      setCcOpen(false);
      setEditingCcId(null);
      setName("");
      setLimit("");
      setOutstanding("0");
      setDueDate("");
      router.refresh();
      showToast(editingCcId ? "Credit card updated" : "Credit card added");
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Could not save credit card",
      );
    }
  }

  function openCcModal(id?: string) {
    const card = id
      ? creditCards.find((c) => String(c.id) === String(id))
      : null;
    setEditingCcId(id || null);
    setName(card?.name || "");
    setLimit(card ? String(card.limit) : "");
    setOutstanding(card ? String(card.outstanding) : "0");
    setDueDate(card?.dueDate || "");
    setColor(card?.color || accentPalette[3]);
    setCcOpen(true);
  }

  async function confirmDeleteCard() {
    if (!deletingCcId) return;
    try {
      await backendJson<{ message: string }>(["credit-cards", deletingCcId], {
        method: "DELETE",
      });
      removeCreditCard(deletingCcId);
      setDeletingCcId(null);
      router.refresh();
      showToast("Credit card deleted");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not delete card");
    }
  }

  async function payCardBill() {
    if (!payingCcId) return;
    try {
      const card = creditCards.find((c) => String(c.id) === String(payingCcId));
      if (!card) throw new Error("Credit card not found");
      if (!payFromAccountId) throw new Error("Select a bank account");
      const amount = parseFloat(payAmt);
      if (!amount || amount <= 0) throw new Error("Enter payment amount");

      await backendJson(["transactions"], {
        method: "POST",
        body: JSON.stringify({
          type: "cc_payment",
          amount,
          accountId: payFromAccountId,
          creditCardId: payingCcId,
          merchant: `${card.name} bill payment`,
          note: "Credit card bill",
          date: payDate,
        }),
      });

      setPayingCcId(null);
      setPayAmt("");
      setPayFromAccountId("");
      setPayDate(new Date().toISOString().slice(0, 10));
      router.refresh();
      showToast(`Paid ${fmtInr(amount)} towards ${card.name}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Could not pay card bill");
    }
  }

  return (
    <main>
      <div className="fv-pg-hdr">
        <div className="fv-pg-title">Accounts &amp; cards</div>
        <div className="fv-pg-sub">
          Manage balances, credit cards, and payments
        </div>
      </div>

      <div className="fv-sec-lbl">
        Bank accounts
        <button
          type="button"
          className="fv-sec-add"
          onClick={() => openAccountModal()}
        >
          + Add account
        </button>
      </div>
      <div className="fv-g3">
        {!accounts.length ? (
          <div className="fv-ac">
            <div className="fv-ac-name">No bank accounts yet</div>
            <div className="fv-ac-type">
              Click “Add account” to create your first bank account.
            </div>
          </div>
        ) : null}
        {accounts.map((a) => (
          <div key={a.id} className="fv-ac">
            <div className="fv-ac-name">
              <span className="fv-ac-dot" style={{ background: a.color }} />
              {a.name}
            </div>
            <div className="fv-ac-type">{a.type}</div>
            <div className="fv-ac-bal" style={{ color: a.color }}>
              {fmtInr(a.balance)}
            </div>
            <div className="flex gap-1 justify-end mt-2">
              <button
                type="button"
                className="fv-btn-cancel text-xs py-1"
                onClick={() => openAccountModal(String(a.id))}
              >
                Edit
              </button>
              <button
                type="button"
                className="fv-btn-del text-xs py-1"
                onClick={() => setDeletingAccountId(String(a.id))}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={accountOpen}
        title={editingAccountId ? "Edit account" : "Add account"}
        onClose={() => {
          setAccountOpen(false);
          setEditingAccountId(null);
        }}
      >
        <div className="fv-fg">
          <label className="fv-fl">Account name</label>
          <input
            className="fv-fi"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
          />
        </div>
        <div className="fv-form-row">
          <div className="fv-fg">
            <label className="fv-fl">Type</label>
            <select
              className="fv-fi"
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
            >
              <option>Savings account</option>
              <option>Current account</option>
            </select>
          </div>
          <div className="fv-fg">
            <label className="fv-fl">Opening balance (₹)</label>
            <input
              className="fv-fi"
              type="number"
              value={accountBalance}
              onChange={(e) => setAccountBalance(e.target.value)}
            />
          </div>
        </div>
        <div className="fv-fg">
          <label className="fv-fl">Color</label>
          <div className="flex flex-wrap gap-2 mt-1">
            {accentPalette.map((col) => (
              <button
                key={col}
                type="button"
                aria-label={`account color ${col}`}
                className="rounded-full w-6 h-6 border-2"
                style={{
                  background: col,
                  borderColor:
                    accountColor === col ? "var(--fv-t1)" : "transparent",
                }}
                onClick={() => setAccountColor(col)}
              />
            ))}
          </div>
        </div>
        <div className="fv-modal-footer">
          <button
            type="button"
            className="fv-btn-cancel"
            onClick={() => setAccountOpen(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="fv-btn-ok"
            onClick={saveAccount}
            disabled={savingAccount}
          >
            {savingAccount ? "…" : "Save"}
          </button>
        </div>
      </Modal>

      <div className="fv-sec-lbl">
        Credit cards
        <button
          type="button"
          className="fv-sec-add"
          onClick={() => openCcModal()}
        >
          + Add card
        </button>
      </div>
      <div className="fv-g3">
        {creditCards.map((c) => {
          const pct =
            c.limit > 0
              ? Math.min(Math.round((c.outstanding / c.limit) * 100), 100)
              : 0;
          const due = new Date(c.dueDate);
          const days = Math.ceil((due.getTime() - Date.now()) / 86400000);
          const bc = pct > 70 ? "#E24B4A" : pct > 50 ? "#EF9F27" : "#1D9E75";
          return (
            <div key={c.id} className="fv-ac">
              <div className="fv-ac-name">
                <span className="fv-ac-dot" style={{ background: c.color }} />
                {c.name}
              </div>
              <div className="fv-ac-type">
                Credit · {fmtShort(c.limit)} limit
              </div>
              <div className="fv-ac-bal" style={{ color: "#E24B4A" }}>
                {fmtInr(c.outstanding)}
              </div>
              <div className="fv-b-bar" style={{ marginTop: 8 }}>
                <div
                  className="fv-b-fill"
                  style={{ width: `${pct}%`, background: bc }}
                />
              </div>
              <div
                className="flex justify-between text-xs mt-1"
                style={{ color: "var(--fv-t2)" }}
              >
                <span>{pct}% utilized</span>
                <span>
                  Due {days > 0 ? `in ${days}d` : "today"} ·{" "}
                  {fmtDateShort(c.dueDate)}
                </span>
              </div>
              <div className="flex gap-1 justify-end mt-2">
                <button
                  type="button"
                  className="fv-btn-cancel text-xs py-1"
                  onClick={() => {
                    setPayingCcId(String(c.id));
                    setPayAmt(String(c.outstanding));
                    setPayDate(new Date().toISOString().slice(0, 10));
                    setPayFromAccountId(
                      accounts[0]?.id ? String(accounts[0].id) : "",
                    );
                  }}
                >
                  Pay
                </button>
                <button
                  type="button"
                  className="fv-btn-cancel text-xs py-1"
                  onClick={() => openCcModal(String(c.id))}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="fv-btn-del text-xs py-1"
                  onClick={() => setDeletingCcId(String(c.id))}
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        open={ccOpen}
        title={editingCcId ? "Edit credit card" : "Add credit card"}
        onClose={() => {
          setCcOpen(false);
          setEditingCcId(null);
        }}
      >
        <div className="fv-fg">
          <label className="fv-fl">Card name</label>
          <input
            className="fv-fi"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="fv-form-row">
          <div className="fv-fg">
            <label className="fv-fl">Limit (₹)</label>
            <input
              className="fv-fi"
              type="number"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
            />
          </div>
          <div className="fv-fg">
            <label className="fv-fl">Outstanding (₹)</label>
            <input
              className="fv-fi"
              type="number"
              value={outstanding}
              onChange={(e) => setOutstanding(e.target.value)}
            />
          </div>
        </div>
        <div className="fv-form-row">
          <div className="fv-fg">
            <label className="fv-fl">Due date</label>
            <input
              className="fv-fi"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className="fv-fg">
            <label className="fv-fl">Color</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {accentPalette.map((col) => (
                <button
                  key={col}
                  type="button"
                  aria-label={`color ${col}`}
                  className="rounded-full w-6 h-6 border-2"
                  style={{
                    background: col,
                    borderColor: color === col ? "var(--fv-t1)" : "transparent",
                  }}
                  onClick={() => setColor(col)}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="fv-modal-footer">
          <button
            type="button"
            className="fv-btn-cancel"
            onClick={() => setCcOpen(false)}
          >
            Cancel
          </button>
          <button type="button" className="fv-btn-ok" onClick={saveCc}>
            Save
          </button>
        </div>
      </Modal>

      <Modal
        open={Boolean(payingCcId)}
        title="Pay credit card bill"
        small
        onClose={() => setPayingCcId(null)}
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
        <div className="fv-form-row">
          <div className="fv-fg">
            <label className="fv-fl">Date</label>
            <input
              className="fv-fi"
              type="date"
              value={payDate}
              onChange={(e) => setPayDate(e.target.value)}
            />
          </div>
          <div className="fv-fg">
            <label className="fv-fl">Pay from account</label>
            <select
              className="fv-fi"
              value={payFromAccountId}
              onChange={(e) => setPayFromAccountId(e.target.value)}
            >
              <option value="">Select</option>
              {accounts.map((a) => (
                <option key={a.id} value={String(a.id)}>
                  {a.name} ({fmtInr(a.balance)})
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="fv-modal-footer">
          <button
            type="button"
            className="fv-btn-cancel"
            onClick={() => setPayingCcId(null)}
          >
            Cancel
          </button>
          <button type="button" className="fv-btn-ok" onClick={payCardBill}>
            Pay
          </button>
        </div>
      </Modal>

      <ConfirmModal
        open={Boolean(deletingAccountId)}
        title="Delete this account?"
        subtitle="Transactions linked to it will remain."
        onClose={() => setDeletingAccountId(null)}
        onConfirm={confirmDeleteAccount}
      />

      <ConfirmModal
        open={Boolean(deletingCcId)}
        title="Delete this credit card?"
        subtitle="All card outstanding tracking will be removed."
        onClose={() => setDeletingCcId(null)}
        onConfirm={confirmDeleteCard}
      />
    </main>
  );
}
