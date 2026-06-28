import { AlertTriangle, ArrowDownCircle, ArrowUpCircle, Wallet } from "lucide-react";
import type { AccountProjection, DashboardMetrics, LedgerEntry, TransferSuggestion } from "../types";
import { formatJapaneseDate, yen } from "../lib/date";

type Props = {
  metrics: DashboardMetrics;
  projections: AccountProjection[];
  upcomingEntries: LedgerEntry[];
  suggestions: TransferSuggestion[];
};

export const Dashboard = ({ metrics, projections, upcomingEntries, suggestions }: Props) => {
  const alertProjections = projections.filter((projection) => projection.firstShortage);

  return (
    <div className="page-stack">
      <section className={alertProjections.length ? "warning-band" : "safe-band"}>
        <div>
          <span className="eyebrow">{alertProjections.length ? "要確認" : "現在の見通し"}</span>
          <h2>{alertProjections.length ? "残高不足の予定があります" : "直近の残高不足はありません"}</h2>
        </div>
        {alertProjections.map((projection) => (
          <div className="alert-row" key={projection.account.id}>
            <AlertTriangle size={18} />
            <span>
              {projection.account.name} は {formatJapaneseDate(projection.firstShortage!.date)} に残高不足になります
            </span>
          </div>
        ))}
      </section>

      <section className="metric-grid">
        <Metric icon={Wallet} label="全口座残高" value={yen(metrics.totalBalance)} />
        <Metric icon={ArrowDownCircle} label="30日支出" value={yen(metrics.next30Expense)} />
        <Metric icon={ArrowUpCircle} label="30日収入" value={yen(metrics.next30Income)} />
        <Metric icon={AlertTriangle} label="不足予定" value={`${metrics.shortageCount}件`} danger={metrics.shortageCount > 0} />
      </section>

      {suggestions.length > 0 && (
        <section className="section">
          <div className="section-heading">
            <h2>資金移動提案</h2>
          </div>
          <div className="suggestion-list">
            {suggestions.map((suggestion) => (
              <article className="suggestion-card" key={`${suggestion.sourceAccount.id}-${suggestion.shortageAccount.id}`}>
                <strong>
                  {formatJapaneseDate(suggestion.moveByDate)}までに {suggestion.sourceAccount.name} から {suggestion.shortageAccount.name} へ
                </strong>
                <span>{yen(suggestion.suggestedAmount)} 移動してください</span>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <div className="section-heading">
          <h2>直近の予定</h2>
        </div>
        <div className="entry-list">
          {upcomingEntries.slice(0, 8).map((entry) => (
            <div className="entry-row" key={entry.id}>
              <time>{formatJapaneseDate(entry.date)}</time>
              <div>
                <strong>{entry.name}</strong>
                <span>{entry.amount > 0 ? "入金" : "出金"}</span>
              </div>
              <b className={entry.amount < 0 ? "negative" : "positive"}>{yen(entry.amount)}</b>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const Metric = ({ icon: Icon, label, value, danger = false }: { icon: typeof Wallet; label: string; value: string; danger?: boolean }) => (
  <article className={`metric-card ${danger ? "danger" : ""}`}>
    <Icon size={19} />
    <span>{label}</span>
    <strong>{value}</strong>
  </article>
);
