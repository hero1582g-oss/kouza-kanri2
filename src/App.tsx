import { useMemo, useState } from "react";
import { CalendarView } from "./components/CalendarView";
import { Dashboard } from "./components/Dashboard";
import { ManageView } from "./components/Forms";
import { Shell } from "./components/Shell";
import { Timeline } from "./components/Timeline";
import { useFinanceData } from "./hooks/useFinanceData";
import { todayString } from "./lib/date";
import { buildProjections, createTransferSuggestions, daysUntilNextMonthEnd, expandSchedules, getDashboardMetrics } from "./lib/projection";
import type { LedgerEntry, ScheduleOccurrenceOverrideDraft } from "./types";
import type { ViewKey } from "./views";
import "./styles.css";

export default function App() {
  const [view, setView] = useState<ViewKey>("dashboard");
  const data = useFinanceData();

  const projectionDays = useMemo(() => Math.max(180, daysUntilNextMonthEnd()), []);
  const timelineDays = useMemo(() => daysUntilNextMonthEnd(), []);
  const rawEntries = useMemo(
    () => expandSchedules(data.schedules, projectionDays, data.occurrenceOverrides),
    [data.accounts, data.schedules, data.occurrenceOverrides, projectionDays],
  );
  const projections = useMemo(() => buildProjections(data.accounts, data.schedules, projectionDays, data.occurrenceOverrides), [data.accounts, data.schedules, data.occurrenceOverrides, projectionDays]);
  const timelineProjections = useMemo(() => buildProjections(data.accounts, data.schedules, timelineDays, data.occurrenceOverrides), [data.accounts, data.schedules, data.occurrenceOverrides, timelineDays]);
  const allLedgerEntries = useMemo(
    () => projections.flatMap((projection) => projection.entries).sort((a, b) => a.date.localeCompare(b.date)),
    [projections],
  );
  const upcomingEntries = useMemo(
    () => allLedgerEntries.filter((entry) => entry.date >= todayString()),
    [allLedgerEntries],
  );
  const metrics = useMemo(() => {
    const base = getDashboardMetrics(projections, rawEntries);
    return { ...base, shortageCount: projections.filter((projection) => projection.firstShortage).length };
  }, [data.accounts, data.schedules, data.occurrenceOverrides, projections, rawEntries]);
  const suggestions = useMemo(() => createTransferSuggestions(projections), [projections]);

  const renderView = () => {
    if (data.loading) return <div className="center-screen">データを読み込み中...</div>;
    if (view === "timeline") return <Timeline projections={timelineProjections} />;
    if (view === "calendar") return <CalendarView entries={allLedgerEntries as LedgerEntry[]} />;
    if (view === "manage") {
      return (
        <ManageView
          accounts={data.accounts}
          schedules={data.schedules}
          onSaveAccount={data.saveAccount}
          onSaveSchedule={data.saveSchedule}
          onRemoveSchedule={data.removeSchedule}
        />
      );
    }
    return (
      <Dashboard
        metrics={metrics}
        projections={projections}
        nextMonthEndProjections={timelineProjections}
        upcomingEntries={upcomingEntries as LedgerEntry[]}
        suggestions={suggestions}
        schedules={data.schedules}
        onSaveSchedule={data.saveSchedule}
        onSaveOccurrenceOverride={data.saveOccurrenceOverride as (override: ScheduleOccurrenceOverrideDraft) => Promise<void>}
      />
    );
  };

  return (
    <>
      <Shell
        currentView={view}
        alertCount={metrics.shortageCount}
        onViewChange={setView}
        onNewSchedule={() => setView("manage")}
      />
      <main className="app-main">{renderView()}</main>
    </>
  );
}
