import type { Account, Schedule, ScheduleDraft } from "../types";

const STORAGE_KEY = "kouza-kanri:finance-data:v1";

type FinanceData = {
  accounts: Account[];
  schedules: Schedule[];
};

const emptyData = (): FinanceData => ({ accounts: [], schedules: [] });

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

const load = (): FinanceData => {
  if (typeof localStorage === "undefined") return emptyData();

  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return emptyData();

  try {
    const parsed = JSON.parse(raw);
    return isFinanceData(parsed) ? parsed : emptyData();
  } catch {
    return emptyData();
  }
};

const persist = (data: FinanceData) => {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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
    const index = data.accounts.findIndex((item) => item.id === nextAccount.id);
    const accounts = index >= 0 ? data.accounts.map((item) => (item.id === nextAccount.id ? nextAccount : item)) : [...data.accounts, nextAccount];
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
  removeAccount(id: string) {
    const data = load();
    persist({
      accounts: data.accounts.filter((account) => account.id !== id),
      schedules: data.schedules.filter((schedule) => {
        if (schedule.kind === "transfer") return schedule.fromAccountId !== id && schedule.toAccountId !== id;
        return schedule.accountId !== id;
      }),
    });
  },
  removeSchedule(id: string) {
    const data = load();
    persist({ ...data, schedules: data.schedules.filter((schedule) => schedule.id !== id) });
  },
};
