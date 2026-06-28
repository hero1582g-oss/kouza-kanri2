import { Pencil, Save, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { yen } from "../lib/date";
import { todayString } from "../lib/date";
import type { Account, Recurrence, Schedule, ScheduleDraft, ScheduleKind } from "../types";

type Props = {
  accounts: Account[];
  schedules: Schedule[];
  demoMode: boolean;
  onSaveAccount: (account: Omit<Account, "id"> & { id?: string }) => Promise<void>;
  onSaveSchedule: (schedule: ScheduleDraft) => Promise<void>;
  onRemoveSchedule: (id: string) => Promise<void>;
  onSeed: () => Promise<void>;
};

const recurrenceLabels: Record<Recurrence, string> = {
  once: "単発",
  weekly: "毎週",
  monthly: "毎月",
  bimonthly: "隔月",
  yearly: "毎年",
};

const kindLabels: Record<ScheduleKind, string> = {
  income: "収入",
  expense: "支出",
  transfer: "振替",
};

export const ManageView = ({ accounts, schedules, demoMode, onSaveAccount, onSaveSchedule, onRemoveSchedule, onSeed }: Props) => {
  const [accountName, setAccountName] = useState("");
  const [balance, setBalance] = useState("");
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [scheduleName, setScheduleName] = useState("");
  const [date, setDate] = useState(todayString());
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [kind, setKind] = useState<ScheduleKind>("expense");
  const [recurrence, setRecurrence] = useState<Recurrence>("once");
  const [accountId, setAccountId] = useState("");
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const disabled = demoMode;
  const hasAccounts = accounts.length > 0;

  useEffect(() => {
    if (!accounts.length) return;
    setAccountId((current) => current || accounts[0].id);
    setFromAccountId((current) => current || accounts[0].id);
    setToAccountId((current) => current || accounts[1]?.id || accounts[0].id);
  }, [accounts]);

  const resetScheduleForm = () => {
    setEditingScheduleId(null);
    setScheduleName("");
    setDate(todayString());
    setAmount("");
    setMemo("");
    setKind("expense");
    setRecurrence("once");
    setAccountId(accounts[0]?.id ?? "");
    setFromAccountId(accounts[0]?.id ?? "");
    setToAccountId(accounts[1]?.id ?? accounts[0]?.id ?? "");
    setFormError(null);
  };

  const saveAccount = async () => {
    if (!accountName || disabled) return;
    await onSaveAccount({
      name: accountName,
      currentBalance: Number(balance || 0),
      displayOrder: accounts.length + 1,
    });
    setAccountName("");
    setBalance("");
  };

  const editSchedule = (schedule: Schedule) => {
    setEditingScheduleId(schedule.id);
    setScheduleName(schedule.name);
    setDate(schedule.date);
    setAmount(String(schedule.amount));
    setMemo(schedule.memo ?? "");
    setKind(schedule.kind);
    setRecurrence(schedule.recurrence);
    if (schedule.kind === "transfer") {
      setFromAccountId(schedule.fromAccountId);
      setToAccountId(schedule.toAccountId);
      setAccountId(accounts[0]?.id ?? "");
    } else {
      setAccountId(schedule.accountId);
      setFromAccountId(accounts[0]?.id ?? "");
      setToAccountId(accounts[1]?.id ?? accounts[0]?.id ?? "");
    }
    setFormError(null);
  };

  const saveSchedule = async () => {
    if (disabled) return;
    if (!scheduleName.trim()) {
      setFormError("名称を入力してください。");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setFormError("金額は1円以上で入力してください。");
      return;
    }
    if (!hasAccounts) {
      setFormError("先に口座を登録してください。");
      return;
    }

    const base = {
      id: editingScheduleId ?? undefined,
      name: scheduleName.trim(),
      date,
      amount: Number(amount),
      kind,
      recurrence,
      memo: memo.trim() || undefined,
    };

    if (kind === "transfer") {
      if (!fromAccountId || !toAccountId) {
        setFormError("出金口座と入金口座を選択してください。");
        return;
      }
      await onSaveSchedule({ ...base, kind, fromAccountId, toAccountId });
    } else {
      if (!accountId) {
        setFormError("対象口座を選択してください。");
        return;
      }
      await onSaveSchedule({ ...base, kind, accountId });
    }

    resetScheduleForm();
  };

  const removeSchedule = async (id: string) => {
    await onRemoveSchedule(id);
    if (editingScheduleId === id) resetScheduleForm();
  };

  return (
    <div className="page-stack">
      {demoMode && (
        <section className="notice">
          Firebase を設定して Google ログインすると登録できます。今はサンプルデータの閲覧モードです。
        </section>
      )}

      <section className="section">
        <div className="section-heading">
          <h2>口座を追加</h2>
        </div>
        <div className="form-grid">
          <label>
            口座名
            <input value={accountName} onChange={(event) => setAccountName(event.target.value)} placeholder="生活費口座" disabled={disabled} />
          </label>
          <label>
            現在残高
            <input value={balance} onChange={(event) => setBalance(event.target.value)} inputMode="numeric" placeholder="120000" disabled={disabled} />
          </label>
          <button className="primary-button" onClick={saveAccount} disabled={disabled}>
            <Save size={17} />
            保存
          </button>
          {!demoMode && accounts.length === 0 && (
            <button className="secondary-button" onClick={onSeed}>
              サンプル投入
            </button>
          )}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>{editingScheduleId ? "予定を編集" : "予定を追加"}</h2>
          {editingScheduleId && (
            <button className="secondary-button compact-button" onClick={resetScheduleForm} disabled={disabled}>
              <X size={16} />
              解除
            </button>
          )}
        </div>
        <div className="form-grid">
          <label>
            名称
            <input value={scheduleName} onChange={(event) => setScheduleName(event.target.value)} placeholder="住宅ローン" disabled={disabled} />
          </label>
          <label>
            日付
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} disabled={disabled} />
          </label>
          <label>
            金額
            <input value={amount} onChange={(event) => setAmount(event.target.value)} inputMode="numeric" placeholder="65000" disabled={disabled} />
          </label>
          <label>
            種別
            <select value={kind} onChange={(event) => setKind(event.target.value as ScheduleKind)} disabled={disabled}>
              <option value="income">収入</option>
              <option value="expense">支出</option>
              <option value="transfer">振替</option>
            </select>
          </label>
          <label>
            繰り返し
            <select value={recurrence} onChange={(event) => setRecurrence(event.target.value as Recurrence)} disabled={disabled}>
              <option value="once">単発</option>
              <option value="weekly">毎週</option>
              <option value="monthly">毎月</option>
              <option value="bimonthly">隔月</option>
              <option value="yearly">毎年</option>
            </select>
          </label>
          {kind === "transfer" ? (
            <>
              <label>
                出金口座
                <select value={fromAccountId} onChange={(event) => setFromAccountId(event.target.value)} disabled={disabled || !hasAccounts}>
                  {accounts.map((account) => <option value={account.id} key={account.id}>{account.name}</option>)}
                </select>
              </label>
              <label>
                入金口座
                <select value={toAccountId} onChange={(event) => setToAccountId(event.target.value)} disabled={disabled || !hasAccounts}>
                  {accounts.map((account) => <option value={account.id} key={account.id}>{account.name}</option>)}
                </select>
              </label>
            </>
          ) : (
            <label>
              対象口座
              <select value={accountId} onChange={(event) => setAccountId(event.target.value)} disabled={disabled || !hasAccounts}>
                {accounts.map((account) => <option value={account.id} key={account.id}>{account.name}</option>)}
              </select>
            </label>
          )}
          <label className="wide-field">
            メモ
            <input value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="任意" disabled={disabled} />
          </label>
          {formError && <p className="form-error wide-field">{formError}</p>}
          <button className="primary-button" onClick={saveSchedule} disabled={disabled}>
            <Save size={17} />
            {editingScheduleId ? "更新" : "保存"}
          </button>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>登録済み予定</h2>
        </div>
        <div className="entry-list">
          {schedules.map((schedule) => (
            <div className={`entry-row schedule-row ${editingScheduleId === schedule.id ? "editing" : ""}`} key={schedule.id}>
              <time>{schedule.date.slice(5)}</time>
              <div>
                <strong>{schedule.name}</strong>
                <span>
                  {kindLabels[schedule.kind]} / {recurrenceLabels[schedule.recurrence]} / {yen(schedule.amount)}
                </span>
              </div>
              <div className="row-actions">
                <button className="icon-button" disabled={disabled} onClick={() => editSchedule(schedule)} aria-label="編集">
                  <Pencil size={17} />
                </button>
                <button className="icon-button" disabled={disabled} onClick={() => removeSchedule(schedule.id)} aria-label="削除">
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
