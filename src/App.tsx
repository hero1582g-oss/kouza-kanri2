import { useMemo, useState } from "react";
import { AuthGate } from "./components/AuthGate";
import { CalendarView } from "./components/CalendarView";
import { Dashboard } from "./components/Dashboard";
import { ManageView } from "./components/Forms";
import { Shell } from "./components/Shell";
import { Timeline } from "./components/Timeline";
import { useAuth } from "./hooks/useAuth";
import { useFinanceData } from "./hooks/useFinanceData";
import { buildProjections, createTransferSuggestions, expandSchedules, getDashboardMetrics } from "./lib/projection";
import type { LedgerEntry } from "./types";
import type { ViewKey } from "./views";
import "./styles.css";

export default function App() {
  const [view, setView] = useState<ViewKey>("dashboard");
  const { user, loading: authLoading, error: authError, login, logout, isFirebaseConfigured } = useAuth();
  const data = useFinanceData(user?.uid);

  const rawEntries = useMemo(() => expandSchedules(data.schedules, 180), [data.schedules]);
  const projections = useMemo(() => buildProjections(data.accounts, data.schedules, 180), [data.accounts, data.schedules]);
  const allLedgerEntries = useMemo(
    () => projections.flatMap((projection) => projection.entries).sort((a, b) => a.date.localeCompare(b.date)),
    [projections],
  );
  const metrics = useMemo(() => {
    const base = getDashboardMetrics(data.accounts, rawEntries);
    return { ...base, shortageCount: projections.filter((projection) => projection.firstShortage).length };
  }, [data.accounts, projections, rawEntries]);
  const suggestions = useMemo(() => createTransferSuggestions(projections), [projections]);

  const renderView = () => {
    if (data.loading) return <div className="center-screen">データを読み込み中...</div>;
    if (view === "timeline") return <Timeline projections={projections} />;
    if (view === "calendar") return <CalendarView entries={allLedgerEntries as LedgerEntry[]} />;
    if (view === "manage") {
      return (
        <ManageView
          accounts={data.accounts}
          schedules={data.schedules}
          demoMode={data.demoMode}
          onSaveAccount={data.saveAccount}
          onSaveSchedule={data.saveSchedule}
          onRemoveSchedule={data.removeSchedule}
          onSeed={data.seedSampleData}
        />
      );
    }
    return <Dashboard metrics={metrics} projections={projections} upcomingEntries={allLedgerEntries as LedgerEntry[]} suggestions={suggestions} />;
  };

  return (
    <AuthGate configured={isFirebaseConfigured} loading={authLoading} signedIn={Boolean(user)} error={authError} onLogin={login}>
      <Shell
        user={user}
        currentView={view}
        alertCount={metrics.shortageCount}
        demoMode={data.demoMode}
        onViewChange={setView}
        onNewSchedule={() => setView("manage")}
        onLogout={logout}
      />
      <main className="app-main">{renderView()}</main>
    </AuthGate>
  );
}
