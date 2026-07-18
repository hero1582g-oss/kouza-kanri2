import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import type { AccountProjection } from "../types";
import { formatJapaneseDate, yen } from "../lib/date";

type Props = {
  projections: AccountProjection[];
};

export const Timeline = ({ projections }: Props) => {
  const [expandedAccounts, setExpandedAccounts] = useState<Record<string, boolean>>({});

  return (
    <div className="page-stack timeline-stack">
      {projections.map((projection) => {
        const expanded = Boolean(expandedAccounts[projection.account.id]);
        const visibleEntries = expanded ? projection.entries : projection.entries.slice(0, 3);
        return (
          <section className="timeline-account compact-timeline-account" key={projection.account.id}>
            <div className="account-summary compact-account-summary">
              <div>
                <h2>{projection.account.name}</h2>
                <span>現在 {yen(projection.account.currentBalance)}</span>
              </div>
              <strong className={projection.minimumBalance < 0 ? "negative" : ""}>最低 {yen(projection.minimumBalance)}</strong>
            </div>

            <div className="timeline compact-timeline">
              <div className="timeline-item start">
                <time>今日</time>
                <div><strong>現在残高</strong><span>{yen(projection.account.currentBalance)}</span></div>
              </div>
              {visibleEntries.map((entry) => (
                <div className={`timeline-item ${entry.balanceAfter < 0 ? "shortage" : ""}`} key={entry.id}>
                  <time>{formatJapaneseDate(entry.date)}</time>
                  <div>
                    <strong>{entry.balanceAfter < 0 && <AlertTriangle size={15} />}{entry.name}{entry.isOverride ? "（今回変更）" : ""}</strong>
                    <span className={entry.amount < 0 ? "negative" : "positive"}>{yen(entry.amount)}</span>
                  </div>
                  <b>{yen(entry.balanceAfter)}</b>
                </div>
              ))}
            </div>
            {projection.entries.length > 3 && (
              <button className="secondary-button timeline-toggle" onClick={() => setExpandedAccounts((current) => ({ ...current, [projection.account.id]: !expanded }))}>
                {expanded ? "閉じる" : `もっと見る（残り${projection.entries.length - 3}件）`}
              </button>
            )}
          </section>
        );
      })}
    </div>
  );
};
