import type { LedgerEntry } from "../types";
import { addDays, formatJapaneseDate, monthKey, parseLocalDate, todayString, yen } from "../lib/date";

type Props = {
  entries: LedgerEntry[];
};

export const CalendarView = ({ entries }: Props) => {
  const today = todayString();
  const month = monthKey(today);
  const first = `${month}-01`;
  const firstDate = parseLocalDate(first);
  const startOffset = firstDate.getDay();
  const daysInMonth = new Date(firstDate.getFullYear(), firstDate.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((startOffset + daysInMonth) / 7) * 7 }, (_, index) => {
    const day = index - startOffset + 1;
    return day >= 1 && day <= daysInMonth ? `${month}-${String(day).padStart(2, "0")}` : "";
  });

  const byDate = entries.reduce<Record<string, LedgerEntry[]>>((acc, entry) => {
    acc[entry.date] = [...(acc[entry.date] ?? []), entry];
    return acc;
  }, {});

  return (
    <div className="page-stack">
      <section className="section">
        <div className="section-heading">
          <h2>{firstDate.getFullYear()}年 {firstDate.getMonth() + 1}月</h2>
        </div>
        <div className="calendar-grid">
          {["日", "月", "火", "水", "木", "金", "土"].map((day) => (
            <span className="calendar-week" key={day}>{day}</span>
          ))}
          {cells.map((cell, index) => (
            <div className={`calendar-cell ${cell === today ? "today" : ""}`} key={`${cell || "blank"}-${index}`}>
              {cell && (
                <>
                  <strong>{parseLocalDate(cell).getDate()}</strong>
                  {(byDate[cell] ?? []).slice(0, 3).map((entry) => (
                    <span className={entry.amount < 0 ? "event negative-bg" : "event positive-bg"} key={entry.id}>
                      {entry.name}
                    </span>
                  ))}
                </>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <h2>今後14日</h2>
        </div>
        <div className="entry-list">
          {entries.filter((entry) => entry.date <= addDays(today, 14)).map((entry) => (
            <div className="entry-row" key={entry.id}>
              <time>{formatJapaneseDate(entry.date)}</time>
              <div>
                <strong>{entry.name}</strong>
                <span>{entry.kind === "transfer" ? "振替" : entry.amount > 0 ? "収入" : "支出"}</span>
              </div>
              <b className={entry.amount < 0 ? "negative" : "positive"}>{yen(entry.amount)}</b>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
