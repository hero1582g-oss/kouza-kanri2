export type Account = {
  id: string;
  name: string;
  balanceBaseDate: string;
  currentBalance: number;
  displayOrder: number;
  memo?: string;
};

export type ScheduleKind = "income" | "expense" | "transfer";
export type Recurrence = "once" | "monthly" | "bimonthly" | "yearly" | "weekly";

export type BaseSchedule = {
  id: string;
  name: string;
  date: string;
  amount: number;
  kind: ScheduleKind;
  memo?: string;
  recurrence: Recurrence;
};

export type IncomeExpenseSchedule = BaseSchedule & {
  kind: "income" | "expense";
  accountId: string;
};

export type TransferSchedule = BaseSchedule & {
  kind: "transfer";
  fromAccountId: string;
  toAccountId: string;
};

export type Schedule = IncomeExpenseSchedule | TransferSchedule;

export type ScheduleOccurrenceOverride = {
  id: string;
  scheduleId: string;
  originalDate: string;
  date: string;
  amount: number;
  name: string;
  memo?: string;
  updatedAt: string;
};

export type ScheduleOccurrenceOverrideDraft = Omit<ScheduleOccurrenceOverride, "id" | "updatedAt"> & { id?: string };

export type ScheduleDraft =
  | (Omit<IncomeExpenseSchedule, "id"> & { id?: string })
  | (Omit<TransferSchedule, "id"> & { id?: string });

export type LedgerEntry = {
  id: string;
  scheduleId: string;
  date: string;
  name: string;
  accountId: string;
  amount: number;
  balanceAfter: number;
  kind: ScheduleKind;
  memo?: string;
  transferPairAccountId?: string;
  originalDate: string;
  isOverride?: boolean;
};

export type AccountProjection = {
  account: Account;
  entries: LedgerEntry[];
  todayBalance: number;
  endBalance: number;
  minimumBalance: number;
  firstShortage?: LedgerEntry;
};

export type DashboardMetrics = {
  baseBalanceTotal: number;
  todayBalanceTotal: number;
  next30Expense: number;
  next30Income: number;
  shortageCount: number;
};

export type TransferSuggestion = {
  shortageAccount: Account;
  sourceAccount: Account;
  shortageDate: string;
  shortageAmount: number;
  suggestedAmount: number;
  moveByDate: string;
};
