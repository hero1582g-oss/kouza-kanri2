import { AlertTriangle } from "lucide-react";
import type { AccountProjection } from "../types";
import { formatJapaneseDate, yen } from "../lib/date";

type Props = {
  projections: AccountProjection[];
};

export const Timeline = ({ projections }: Props) => (
  <div className="page-stack">
    {projections.map((projection) => (
      <section className="timeline-account" key={projection.account.id}>
        <div className="account-summary">
          <div>
            <h2>{projection.account.name}</h2>
            <span>現在 {yen(projection.account.currentBalance)}</span>
          </div>
          <strong className={projection.minimumBalance < 0 ? "negative" : ""}>最低 {yen(projection.minimumBalance)}</strong>
        </div>

        <div className="timeline">
          <div className="timeline-item start">
            <time>今日</time>
            <div>
              <strong>現在残高</strong>
              <span>{yen(projection.account.currentBalance)}</span>
            </div>
          </div>
          {projection.entries.slice(0, 16).map((entry) => (
            <div className={`timeline-item ${entry.balanceAfter < 0 ? "shortage" : ""}`} key={entry.id}>
              <time>{formatJapaneseDate(entry.date)}</time>
              <div>
                <strong>
                  {entry.balanceAfter < 0 && <AlertTriangle size={15} />}
                  {entry.name}
                </strong>
                <span className={entry.amount < 0 ? "negative" : "positive"}>{yen(entry.amount)}</span>
              </div>
              <b>{yen(entry.balanceAfter)}</b>
            </div>
          ))}
        </div>
      </section>
    ))}
  </div>
);
