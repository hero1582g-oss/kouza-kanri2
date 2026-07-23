import type { Account, Schedule } from "../types";

export const sampleAccounts: Account[] = [
  { id: "salary", name: "給与口座", balanceBaseDate: "2026-07-23", currentBalance: 120000, displayOrder: 1, memo: "住宅ローンと給与受取" },
  { id: "daily", name: "生活費口座", balanceBaseDate: "2026-07-23", currentBalance: 54000, displayOrder: 2 },
  { id: "saving", name: "貯蓄口座", balanceBaseDate: "2026-07-23", currentBalance: 300000, displayOrder: 3 },
  { id: "rakuten", name: "楽天銀行", balanceBaseDate: "2026-07-23", currentBalance: 86000, displayOrder: 4 },
];

export const sampleSchedules: Schedule[] = [
  { id: "salary-monthly", name: "給与", date: "2026-06-21", amount: 250000, kind: "income", accountId: "salary", recurrence: "monthly" },
  { id: "loan", name: "住宅ローン", date: "2026-07-05", amount: 65000, kind: "expense", accountId: "salary", recurrence: "monthly" },
  { id: "insurance", name: "生命保険", date: "2026-06-27", amount: 12000, kind: "expense", accountId: "daily", recurrence: "monthly" },
  { id: "kindergarten", name: "幼稚園代", date: "2026-07-10", amount: 28000, kind: "expense", accountId: "salary", recurrence: "monthly" },
  { id: "rakuten-transfer", name: "楽天から給与口座へ", date: "2026-07-03", amount: 50000, kind: "transfer", fromAccountId: "rakuten", toAccountId: "salary", recurrence: "once" },
];
