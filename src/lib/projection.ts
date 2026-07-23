import type { Account, AccountProjection, DashboardMetrics, LedgerEntry, Schedule, ScheduleOccurrenceOverride, TransferSuggestion } from "../types";
import { addDays, addMonths, addYears, formatDate, parseLocalDate, todayString } from "./date";

const horizonEnd = (days: number): string => addDays(todayString(), days);

export const daysUntilNextMonthEnd = (): number => {
  const today = parseLocalDate(todayString());
  const end = new Date(today.getFullYear(), today.getMonth() + 2, 0);
  return Math.max(0, Math.ceil((end.getTime() - today.getTime()) / (24 * 60 * 60 * 1000)));
};

const nextOccurrence = (date: string, recurrence: Schedule["recurrence"]): string => {
  if (recurrence === "weekly") return addDays(date, 7);
  if (recurrence === "monthly") return addMonths(date, 1);
  if (recurrence === "bimonthly") return addMonths(date, 2);
  if (recurrence === "yearly") return addYears(date, 1);
  return date;
};

export const expandSchedules = (
  schedules: Schedule[],
  days = 180,
  overrides: ScheduleOccurrenceOverride[] = [],
  start = todayString(),
): Omit<LedgerEntry, "balanceAfter">[] => {
  const end = horizonEnd(days);
  const entries: Omit<LedgerEntry, "balanceAfter">[] = [];

  schedules.forEach((schedule) => {
    const scheduleOverrides = overrides.filter((item) => item.scheduleId === schedule.id);
    const relevantOverrides = scheduleOverrides.filter((item) => item.date >= start && item.date <= end);
    const firstRelevantOriginalDate = relevantOverrides.reduce(
      (earliest, item) => item.originalDate < earliest ? item.originalDate : earliest,
      start,
    );
    const lastRelevantOriginalDate = relevantOverrides.reduce(
      (latest, item) => item.originalDate > latest ? item.originalDate : latest,
      end,
    );
    const iterationEnd = lastRelevantOriginalDate > end ? lastRelevantOriginalDate : end;
    let occurrenceDate = schedule.date;
    let guard = 0;

    while (occurrenceDate < firstRelevantOriginalDate && schedule.recurrence !== "once" && guard < 5000) {
      occurrenceDate = nextOccurrence(occurrenceDate, schedule.recurrence);
      guard += 1;
    }

    while (occurrenceDate <= iterationEnd && guard < 5000) {
      const override = scheduleOverrides.find((item) => item.originalDate === occurrenceDate);
      const entryDate = override?.date ?? occurrenceDate;
      const entryName = override?.name ?? schedule.name;
      const entryAmount = override?.amount ?? schedule.amount;
      const entryMemo = override?.memo ?? schedule.memo;

      if (entryDate >= start && entryDate <= end && schedule.kind === "transfer") {
        entries.push({
          id: `${schedule.id}-${occurrenceDate}-out`, scheduleId: schedule.id, date: entryDate,
          name: entryName, accountId: schedule.fromAccountId, amount: -Math.abs(entryAmount),
          kind: schedule.kind, memo: entryMemo, transferPairAccountId: schedule.toAccountId,
          originalDate: occurrenceDate, isOverride: Boolean(override),
        });
        entries.push({
          id: `${schedule.id}-${occurrenceDate}-in`, scheduleId: schedule.id, date: entryDate,
          name: entryName, accountId: schedule.toAccountId, amount: Math.abs(entryAmount),
          kind: schedule.kind, memo: entryMemo, transferPairAccountId: schedule.fromAccountId,
          originalDate: occurrenceDate, isOverride: Boolean(override),
        });
      } else if (entryDate >= start && entryDate <= end && schedule.kind !== "transfer") {
        entries.push({
          id: `${schedule.id}-${occurrenceDate}`, scheduleId: schedule.id, date: entryDate,
          name: entryName, accountId: schedule.accountId,
          amount: schedule.kind === "income" ? Math.abs(entryAmount) : -Math.abs(entryAmount),
          kind: schedule.kind, memo: entryMemo, originalDate: occurrenceDate,
          isOverride: Boolean(override),
        });
      }

      if (schedule.recurrence === "once") break;
      occurrenceDate = nextOccurrence(occurrenceDate, schedule.recurrence);
      guard += 1;
    }
  });

  return entries.sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
};

export const buildProjections = (
  accounts: Account[], schedules: Schedule[], days = 180, overrides: ScheduleOccurrenceOverride[] = [],
): AccountProjection[] => {
  const today = todayString();
  const earliestBaseDate = accounts.reduce(
    (earliest, account) => account.balanceBaseDate < earliest ? account.balanceBaseDate : earliest,
    today,
  );
  const entries = expandSchedules(schedules, days, overrides, addDays(earliestBaseDate, 1));

  return [...accounts]
    .sort((a, b) => a.displayOrder - b.displayOrder || a.name.localeCompare(b.name))
    .map((account) => {
      let balance = account.currentBalance;
      const accountEntries = entries
        .filter((entry) => entry.accountId === account.id && entry.date > account.balanceBaseDate)
        .map((entry) => {
          balance += entry.amount;
          return { ...entry, balanceAfter: balance };
        });
      const todayEntries = accountEntries.filter((entry) => entry.date <= today);
      const todayBalance = todayEntries.length ? todayEntries[todayEntries.length - 1].balanceAfter : account.currentBalance;
      const futureEntries = accountEntries.filter((entry) => entry.date >= today);
      const minimumBalance = futureEntries.reduce((minimum, entry) => Math.min(minimum, entry.balanceAfter), todayBalance);
      return {
        account,
        entries: accountEntries,
        todayBalance,
        endBalance: accountEntries.length ? accountEntries[accountEntries.length - 1].balanceAfter : account.currentBalance,
        minimumBalance,
        firstShortage: futureEntries.find((entry) => entry.balanceAfter < 0),
      };
    });
};

export const getDashboardMetrics = (
  projections: AccountProjection[], entries: Omit<LedgerEntry, "balanceAfter">[],
): DashboardMetrics => {
  const today = todayString();
  const limit = addDays(today, 30);
  const next30 = entries.filter((entry) => entry.date >= today && entry.date <= limit);
  return {
    baseBalanceTotal: projections.reduce((sum, projection) => sum + projection.account.currentBalance, 0),
    todayBalanceTotal: projections.reduce((sum, projection) => sum + projection.todayBalance, 0),
    next30Expense: Math.abs(next30.filter((entry) => entry.amount < 0).reduce((sum, entry) => sum + entry.amount, 0)),
    next30Income: next30.filter((entry) => entry.amount > 0).reduce((sum, entry) => sum + entry.amount, 0),
    shortageCount: 0,
  };
};

export const createTransferSuggestions = (projections: AccountProjection[]): TransferSuggestion[] => {
  const healthyAccounts = projections.filter((projection) => projection.minimumBalance > 0);
  return projections
    .filter((projection) => projection.firstShortage)
    .map((projection) => {
      const shortage = projection.firstShortage!;
      const shortageAmount = Math.abs(shortage.balanceAfter);
      const source = healthyAccounts
        .filter((candidate) => candidate.account.id !== projection.account.id)
        .sort((a, b) => b.minimumBalance - a.minimumBalance)[0];
      if (!source) return null;
      const suggestedAmount = Math.ceil((shortageAmount + 10000) / 10000) * 10000;
      return {
        shortageAccount: projection.account,
        sourceAccount: source.account,
        shortageDate: shortage.date,
        shortageAmount,
        suggestedAmount,
        moveByDate: formatDate(new Date(parseLocalDate(shortage.date).getTime() - 24 * 60 * 60 * 1000)),
      };
    })
    .filter((suggestion): suggestion is TransferSuggestion => Boolean(suggestion));
};
