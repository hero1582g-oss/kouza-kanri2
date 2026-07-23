import type { Account, Schedule, ScheduleDraft, ScheduleOccurrenceOverride, ScheduleOccurrenceOverrideDraft } from "../types";
import { todayString } from "./date";

const STORAGE_KEY = "kouza-kanri:finance-data:v1";

type FinanceData = {
  accounts: Account[];
  schedules: Schedule[];
  occurrenceOverrides: ScheduleOccurrenceOverride[];
};

const emptyData = (): FinanceData => ({ accounts: [], schedules: [], occurrenceOverrides: [] });

const createId = (prefix: string) => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
};

const isFinanceData = (value: unknown): value is FinanceData => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<FinanceData>;
  return Array.isArray(candidate.accounts) && Array.isArray(candidate.schedules);
};

const persist = (data: FinanceData) => {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

const load = (): FinanceData => {
  if (typeof localStorage === "undefined") return emptyData();

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return emptyData();

  try {
    const parsed = JSON.parse(raw);
    if (!isFinanceData(parsed)) return emptyData();
    const fallbackBaseDate = todayString();
    let migrated = false;
    const accounts = parsed.accounts.map((account: Account) => {
      if (typeof account.balanceBaseDate === "string" && account.balanceBaseDate) return account;
      migrated = true;
      return { ...account, balanceBaseDate: fallbackBaseDate };
    });
    const data = {
      ...parsed,
      accounts,
      occurrenceOverrides: Array.isArray(parsed.occurrenceOverrides) ? parsed.occurrenceOverrides : [],
    } as FinanceData;
    if (migrated) {
      try {
        persist(data);
      } catch {
        // Keep migrated data available even if storage is full.
      }
    }
    return data;
  } catch {
    return emptyData();
  }
};

const withoutUndefined = <T extends object>(value: T): T =>
  Object.fromEntries(Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined)) as T;

export const financeStorage = {
  load,
  saveAccount(account: Omit<Account, "id"> & { id?: string }) {
    const data = load();
    const nextAccount: Account = {
      ...account,
      id: account.id ?? createId("account"),
    };
    const accounts = data.accounts.some((item) => item.id === nextAccount.id)
      ? data.accounts.map((item) => (item.id === nextAccount.id ? nextAccount : item))
      : [...data.accounts, nextAccount];
    persist({ ...data, accounts });
    return nextAccount;
  },
  saveSchedule(schedule: ScheduleDraft) {
    const data = load();
    const nextSchedule = withoutUndefined({
      ...schedule,
      id: schedule.id ?? createId("schedule"),
    }) as Schedule;
    const schedules = data.schedules.some((item) => item.id === nextSchedule.id)
      ? data.schedules.map((item) => (item.id === nextSchedule.id ? nextSchedule : item))
      : [...data.schedules, nextSchedule];
    persist({ ...data, schedules });
    return nextSchedule;
  },
  saveOccurrenceOverride(override: ScheduleOccurrenceOverrideDraft) {
    const data = load();
    const now = new Date().toISOString();
    const existing = data.occurrenceOverrides.find(
      (item) => item.scheduleId === override.scheduleId && item.originalDate === override.originalDate,
    );
    const nextOverride: ScheduleOccurrenceOverride = withoutUndefined({
      ...override,
      id: override.id ?? existing?.id ?? createId("override"),
      updatedAt: now,
    }) as ScheduleOccurrenceOverride;
    const occurrenceOverrides = existing
      ? data.occurrenceOverrides.map((item) => (item.id === existing.id ? nextOverride : item))
      : [...data.occurrenceOverrides, nextOverride];
    persist({ ...data, occurrenceOverrides });
    return nextOverride;
  },
  removeAccount(id: string) {
    const data = load();
    persist({
      accounts: data.accounts.filter((account) => account.id !== id),
      schedules: data.schedules.filter((schedule) => {
        if (schedule.kind === "transfer") return schedule.fromAccountId !== id && schedule.toAccountId !== id;
        return schedule.accountId !== id;
      }),
      occurrenceOverrides: data.occurrenceOverrides.filter((override) => {
        const schedule = data.schedules.find((item) => item.id === override.scheduleId);
        if (!schedule) return true;
        if (schedule.kind === "transfer") return schedule.fromAccountId !== id && schedule.toAccountId !== id;
        return schedule.accountId !== id;
      }),
    });
  },
  removeSchedule(id: string) {
    const data = load();
    persist({
      ...data,
      schedules: data.schedules.filter((schedule) => schedule.id !== id),
      occurrenceOverrides: data.occurrenceOverrides.filter((override) => override.scheduleId !== id),
    });
  },
};
