import { AlertTriangle, ArrowDownCircle, ArrowUpCircle, Pencil, Save, Wallet, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { AccountProjection, DashboardMetrics, LedgerEntry, Schedule, ScheduleDraft, ScheduleOccurrenceOverrideDraft, TransferSuggestion } from "../types";
import { formatJapaneseDate, yen } from "../lib/date";

type Props = {
  metrics: DashboardMetrics;
  projections: AccountProjection[];
  nextMonthEndProjections: AccountProjection[];
  upcomingEntries: LedgerEntry[];
  suggestions: TransferSuggestion[];
  schedules: Schedule[];
  onSaveSchedule: (schedule: ScheduleDraft) => Promise<void>;
  onSaveOccurrenceOverride: (override: ScheduleOccurrenceOverrideDraft) => Promise<void>;
};

export const Dashboard = ({ metrics, projections, nextMonthEndProjections, upcomingEntries, suggestions, schedules, onSaveSchedule, onSaveOccurrenceOverride }: Props) => {
  const alertProjections = projections.filter((projection) => projection.firstShortage);
  const [editingEntry, setEditingEntry] = useState<LedgerEntry | null>(null);

  return (
    <div className="page-stack">
      <section className={alertProjections.length ? "warning-band" : "safe-band"}>
        <div>
          <span className="eyebrow">{alertProjections.length ? "要確認" : "現在の見通し"}</span>
          <h2>{alertProjections.length ? "残高不足の予定があります" : "直近の残高不足はありません"}</h2>
        </div>
        {alertProjections.map((projection) => (
          <div className="alert-row" key={projection.account.id}>
            <AlertTriangle size={18} />
            <span>{projection.account.name} は {formatJapaneseDate(projection.firstShortage!.date)} に残高不足になります</span>
          </div>
        ))}
      </section>

      <section className="metric-grid">
        <Metric icon={Wallet} label="現在残高合計" value={yen(metrics.currentBalanceTotal)} />
        <Metric icon={Wallet} label="翌月末予測合計" value={yen(metrics.nextMonthEndTotal)} />
        <Metric icon={ArrowDownCircle} label="30日以内支出" value={yen(metrics.next30Expense)} />
        <Metric icon={ArrowUpCircle} label="30日以内収入" value={yen(metrics.next30Income)} />
        <Metric icon={AlertTriangle} label="残高不足件数" value={`${metrics.shortageCount}件`} danger={metrics.shortageCount > 0} />
      </section>

      <section className="section">
        <div className="section-heading"><h2>口座別残高</h2></div>
        <div className="account-forecast-grid">
          {projections.map((projection) => (
            <article className="account-forecast-card" key={projection.account.id}>
              <h3>{projection.account.name}</h3>
              <dl>
                <div><dt>現在残高</dt><dd>{yen(projection.account.currentBalance)}</dd></div>
                <div><dt>翌月末予測残高</dt><dd>{yen(nextMonthEndProjections.find((item) => item.account.id === projection.account.id)?.endBalance ?? projection.todayBalance)}</dd></div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      {suggestions.length > 0 && (
        <section className="section">
          <div className="section-heading"><h2>資金移動提案</h2></div>
          <div className="suggestion-list">
            {suggestions.map((suggestion) => (
              <article className="suggestion-card" key={`${suggestion.sourceAccount.id}-${suggestion.shortageAccount.id}`}>
                <strong>{formatJapaneseDate(suggestion.moveByDate)}までに {suggestion.sourceAccount.name} から {suggestion.shortageAccount.name} へ</strong>
                <span>{yen(suggestion.suggestedAmount)} 移動してください</span>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <div className="section-heading"><h2>直近の予定</h2></div>
        <div className="entry-list">
          {upcomingEntries.slice(0, 8).map((entry) => (
            <div className="entry-row" key={entry.id}>
              <time>{formatJapaneseDate(entry.date)}</time>
              <div>
                <strong>{entry.name}{entry.isOverride ? "（今回変更）" : ""}</strong>
                <span>{entry.amount > 0 ? "入金" : "出金"}</span>
              </div>
              <b className={entry.amount < 0 ? "negative" : "positive"}>{yen(entry.amount)}</b>
              <button className="icon-button" onClick={() => setEditingEntry(entry)} aria-label="今回分を編集"><Pencil size={17} /></button>
            </div>
          ))}
        </div>
      </section>

      {editingEntry && (
        <OccurrenceEditor
          entry={editingEntry}
          schedule={schedules.find((schedule) => schedule.id === editingEntry.scheduleId)}
          onClose={() => setEditingEntry(null)}
          onSaveSchedule={onSaveSchedule}
          onSaveOccurrenceOverride={onSaveOccurrenceOverride}
        />
      )}
    </div>
  );
};

const OccurrenceEditor = ({ entry, schedule, onClose, onSaveSchedule, onSaveOccurrenceOverride }: { entry: LedgerEntry; schedule?: Schedule; onClose: () => void; onSaveSchedule: (schedule: ScheduleDraft) => Promise<void>; onSaveOccurrenceOverride: (override: ScheduleOccurrenceOverrideDraft) => Promise<void> }) => {
  const [name, setName] = useState(entry.name);
  const [date, setDate] = useState(entry.date);
  const [amount, setAmount] = useState(String(Math.abs(entry.amount)));
  const [memo, setMemo] = useState(entry.memo ?? "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setName(entry.name); setDate(entry.date); setAmount(String(Math.abs(entry.amount))); setMemo(entry.memo ?? ""); setError(null);
  }, [entry]);

  const save = async () => {
    if (!schedule) return setError("元の予定が見つかりません。");
    if (!name.trim()) return setError("名称を入力してください。");
    if (!amount || Number(amount) <= 0) return setError("金額は1円以上で入力してください。");
    const next = { name: name.trim(), date, amount: Number(amount), memo: memo.trim() || undefined };
    if (schedule.recurrence === "once") await onSaveSchedule({ ...schedule, ...next });
    else await onSaveOccurrenceOverride({ scheduleId: schedule.id, originalDate: entry.originalDate, ...next });
    onClose();
  };

  return <div className="modal-backdrop"><section className="section modal-card"><div className="section-heading"><h2>今回分だけ変更</h2><button className="icon-button" onClick={onClose}><X size={17} /></button></div><div className="form-grid"><label>名称<input value={name} onChange={(e) => setName(e.target.value)} /></label><label>日付<input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label><label>金額<input value={amount} inputMode="numeric" onChange={(e) => setAmount(e.target.value)} /></label><label className="wide-field">メモ<input value={memo} onChange={(e) => setMemo(e.target.value)} /></label>{error && <p className="form-error wide-field">{error}</p>}<button className="primary-button" onClick={save}><Save size={17} />今回分だけ変更</button></div></section></div>;
};

const Metric = ({ icon: Icon, label, value, danger = false }: { icon: typeof Wallet; label: string; value: string; danger?: boolean }) => (
  <article className={`metric-card ${danger ? "danger" : ""}`}>
    <Icon size={19} />
    <span>{label}</span>
    <strong>{value}</strong>
  </article>
);
