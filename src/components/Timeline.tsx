import { AlertTriangle, ArrowRight } from "lucide-react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Ref } from "react";
import type { Account, LedgerEntry, Schedule, ScheduleOccurrenceOverride } from "../types";
import { parseLocalDate, todayString, yen } from "../lib/date";
import { expandSchedulesForRange } from "../lib/projection";

type Props = { accounts: Account[]; schedules: Schedule[]; occurrenceOverrides: ScheduleOccurrenceOverride[] };

const longDate = (value: string) => new Intl.DateTimeFormat("ja-JP", {
  year: "numeric", month: "long", day: "numeric", weekday: "short",
}).format(parseLocalDate(value));

export const Timeline = ({ accounts, schedules, occurrenceOverrides }: Props) => {
  const currentYear = Number(todayString().slice(0, 4));
  const [accountId, setAccountId] = useState("all");
  const [year, setYear] = useState(currentYear);
  const todayRef = useRef<HTMLDivElement>(null);
  const firstRef = useRef<HTMLDivElement>(null);
  const lastRef = useRef<HTMLDivElement>(null);
  const sortedAccounts = useMemo(() => [...accounts].sort((a, b) => a.displayOrder - b.displayOrder), [accounts]);
  const accountMap = useMemo(() => new Map(accounts.map((account) => [account.id, account])), [accounts]);
  const years = useMemo(() => {
    const values = [currentYear - 1, currentYear, currentYear + 1];
    schedules.forEach((item) => values.push(Number(item.date.slice(0, 4))));
    occurrenceOverrides.forEach((item) => values.push(Number(item.date.slice(0, 4))));
    return [...new Set(values)].sort((a, b) => a - b);
  }, [currentYear, schedules, occurrenceOverrides]);

  const entries = useMemo(() => {
    const raw = expandSchedulesForRange(schedules, `${year}-01-01`, `${year}-12-31`, occurrenceOverrides)
      .filter((entry) => accountId === "all" || entry.accountId === accountId);
    const today = todayString();
    const balanceAfter = new Map<string, number>();

    accounts.forEach((account) => {
      const accountEntries = raw.filter((entry) => entry.accountId === account.id);
      const pastAndToday = accountEntries.filter((entry) => entry.date <= today);
      let pastBalance = account.currentBalance;

      // The current balance already contains historical activity. Walk
      // backwards so each historical row shows the balance at that time.
      [...pastAndToday].reverse().forEach((entry) => {
        balanceAfter.set(entry.id, pastBalance);
        pastBalance -= entry.amount;
      });

      // Future activity starts from the actual current balance and is applied
      // forwards in display order.
      let futureBalance = account.currentBalance;
      accountEntries.filter((entry) => entry.date > today).forEach((entry) => {
        futureBalance += entry.amount;
        balanceAfter.set(entry.id, futureBalance);
      });
    });

    return raw.map((entry) => ({ ...entry, balanceAfter: balanceAfter.get(entry.id) ?? 0 } as LedgerEntry));
  }, [accounts, schedules, occurrenceOverrides, accountId, year]);

  const groups = useMemo(() => entries.reduce<Record<string, LedgerEntry[]>>((result, entry) => {
    (result[entry.date] ??= []).push(entry);
    return result;
  }, {}), [entries]);
  const dates = Object.keys(groups).sort();

  useLayoutEffect(() => {
    const target = year === currentYear ? todayRef.current : year > currentYear ? firstRef.current : lastRef.current;
    requestAnimationFrame(() => target?.scrollIntoView({ block: year < currentYear ? "end" : "center", behavior: "auto" }));
  }, [year, accountId, currentYear, entries.length]);

  const renderToday = year === currentYear;
  let todayInserted = false;
  return <div className="page-stack timeline-stack">
    <section className="section timeline-filters" aria-label="タイムライン絞り込み">
      <label>口座<select value={accountId} onChange={(event) => setAccountId(event.target.value)}><option value="all">すべて</option>{sortedAccounts.map((account) => <option key={account.id} value={account.id}>{account.name}</option>)}</select></label>
      <label>年<select value={year} onChange={(event) => setYear(Number(event.target.value))}>{years.map((value) => <option key={value} value={value}>{value}</option>)}</select></label>
    </section>
    <section className="section grouped-timeline">
      {dates.map((date, index) => {
        const showTodayBefore = renderToday && !todayInserted && date >= todayString();
        if (showTodayBefore) todayInserted = true;
        return <div key={date} ref={index === 0 ? firstRef : index === dates.length - 1 ? lastRef : undefined}>
          {showTodayBefore && <TodayLine ref={todayRef} />}
          <div className="timeline-date-group">
            <h2>{longDate(date)}</h2>
            {groups[date].map((entry) => {
              const account = accountMap.get(entry.accountId);
              const pair = entry.transferPairAccountId ? accountMap.get(entry.transferPairAccountId) : undefined;
              return <article className={`timeline-entry ${entry.balanceAfter < 0 ? "shortage" : ""}`} key={entry.id}>
                {accountId === "all" && <span className="timeline-account-name">{account?.name}</span>}
                <div className="timeline-entry-main"><strong>{entry.name}{entry.isOverride ? "（今回変更）" : ""}</strong><b className={entry.amount < 0 ? "negative" : "positive"}>{yen(entry.amount)}</b></div>
                {entry.kind === "transfer" && <span className="transfer-label">振替：{entry.amount < 0 ? account?.name : pair?.name} <ArrowRight size={14} /> {entry.amount < 0 ? pair?.name : account?.name}</span>}
                <span className={entry.balanceAfter < 0 ? "balance negative" : "balance"}>{entry.balanceAfter < 0 && <AlertTriangle size={14} />}残高 {yen(entry.balanceAfter)}</span>
              </article>;
            })}
          </div>
        </div>;
      })}
      {renderToday && !todayInserted && <TodayLine ref={todayRef} />}
      {!dates.length && <p className="empty-message">この年の予定はありません。</p>}
    </section>
  </div>;
};

const TodayLine = ({ ref }: { ref: Ref<HTMLDivElement> }) => <div className="today-line" ref={ref}><span>★ 今日</span></div>;
