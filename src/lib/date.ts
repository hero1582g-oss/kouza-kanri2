const pad2 = (value: number): string => String(value).padStart(2, "0");

/**
 * Formats a Date using its local calendar components.
 *
 * Do not use toISOString() here: in time zones ahead of UTC (such as Japan),
 * local midnight is represented as the previous UTC date. That caused the app
 * to treat early-morning transactions as belonging to yesterday.
 */
export const formatDate = (date: Date): string =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

export const todayString = (): string => formatDate(new Date());

export const parseLocalDate = (value: string): Date => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export const addDays = (value: string, days: number): string => {
  const date = parseLocalDate(value);
  date.setDate(date.getDate() + days);
  return formatDate(date);
};

export const addMonths = (value: string, months: number): string => {
  const date = parseLocalDate(value);
  const originalDay = date.getDate();
  date.setMonth(date.getMonth() + months, 1);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  date.setDate(Math.min(originalDay, lastDay));
  return formatDate(date);
};

export const addYears = (value: string, years: number): string => {
  const date = parseLocalDate(value);
  date.setFullYear(date.getFullYear() + years);
  return formatDate(date);
};

export const monthKey = (value: string): string => value.slice(0, 7);

export const formatJapaneseDate = (value: string): string => {
  const date = parseLocalDate(value);
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

export const yen = (amount: number): string =>
  new Intl.NumberFormat("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 }).format(amount);
