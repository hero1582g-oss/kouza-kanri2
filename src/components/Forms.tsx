import { Save, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Account, Recurrence, Schedule, ScheduleDraft, ScheduleKind } from "../types";
import { todayString } from "../lib/date";

type Props = {
  accounts: Account[];
  schedules: Schedule[];
  demoMode: boolean;
  onSaveAccount: (account: Omit<Account, "id"> & { id?: string }) => Promise<void>;
  onSaveSchedule: (schedule: ScheduleDraft) => Promise<void>;
  onRemoveSchedule: (id: string) => Promise<void>;
  onSeed: () => Promise<void>;
};

export const ManageView = ({ accounts, schedules, demoMode, onSaveAccount, onSaveSchedule, onRemoveSchedule, onSeed }: Props) => {
  const [accountName, setAccountName] = useState("");
  const [balance, setBalance] = useState("");
  const [scheduleName, setScheduleName] = useState("");
  const [date, setDate] = useState(todayString());
  const [amount, setAmount] = useState("");
  const [kind, setKind] = useState<ScheduleKind>("expense");
  const [recurrence, setRecurrence] = useState<Recurrence>("once");
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");
  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id ?? "");
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id ?? accounts[0]?.id ?? "");
  const disabled = demoMode;

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

  const saveSchedule = async () => {
    if (!scheduleName || !amount || disabled) return;
    const base = { name: scheduleName, date, amount: Number(amount), kind, recurrence, memo: "" };
    if (kind === "transfer") {
      await onSaveSchedule({ ...base, kind, fromAccountId, toAccountId });
    } else {
      await onSaveSchedule({ ...base, kind, accountId });
    }
    setScheduleName("");
    setAmount("");
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
          <h2>予定を追加</h2>
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
              <option value="monthly">毎月</option>
              <option value="bimonthly">隔月</option>
              <option value="yearly">毎年</option>
              <option value="weekly">毎週</option>
            </select>
          </label>
          {kind === "transfer" ? (
            <>
              <label>
                出金口座
                <select value={fromAccountId} onChange={(event) => setFromAccountId(event.target.value)} disabled={disabled}>
                  {accounts.map((account) => <option value={account.id} key={account.id}>{account.name}</option>)}
                </select>
              </label>
              <label>
                入金口座
                <select value={toAccountId} onChange={(event) => setToAccountId(event.target.value)} disabled={disabled}>
                  {accounts.map((account) => <option value={account.id} key={account.id}>{account.name}</option>)}
                </select>
              </label>
            </>
          ) : (
            <label>
              対象口座
              <select value={accountId} onChange={(event) => setAccountId(event.target.value)} disabled={disabled}>
                {accounts.map((account) => <option value={account.id} key={account.id}>{account.name}</option>)}
              </select>
            </label>
          )}
          <button className="primary-button" onClick={saveSchedule} disabled={disabled}>
            <Save size={17} />
            保存
          </button>
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>登録済み予定</h2>
        </div>
        <div className="entry-list">
          {schedules.map((schedule) => (
            <div className="entry-row" key={schedule.id}>
              <time>{schedule.date.slice(5)}</time>
              <div>
                <strong>{schedule.name}</strong>
                <span>{schedule.recurrence}</span>
              </div>
              <button className="icon-button" disabled={disabled} onClick={() => onRemoveSchedule(schedule.id)} aria-label="削除">
                <Trash2 size={17} />
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
