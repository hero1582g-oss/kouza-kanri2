import { AlertTriangle, CalendarDays, LayoutDashboard, LogOut, Menu, Plus, WalletCards } from "lucide-react";
import type { User } from "firebase/auth";
import type { ViewKey } from "../views";

type Props = {
  user: User | null;
  currentView: ViewKey;
  alertCount: number;
  demoMode: boolean;
  onViewChange: (view: ViewKey) => void;
  onNewSchedule: () => void;
  onLogout: () => void;
};

const navItems: { key: ViewKey; label: string; icon: typeof LayoutDashboard }[] = [
  { key: "dashboard", label: "ダッシュボード", icon: LayoutDashboard },
  { key: "timeline", label: "タイムライン", icon: WalletCards },
  { key: "calendar", label: "カレンダー", icon: CalendarDays },
  { key: "manage", label: "入力", icon: Plus },
];

export const Shell = ({ user, currentView, alertCount, demoMode, onViewChange, onNewSchedule, onLogout }: Props) => (
  <>
    <header className="app-header">
      <div>
        <span className="eyebrow">未来残高チェック</span>
        <h1>口座管理</h1>
      </div>
      <div className="header-actions">
        {alertCount > 0 && (
          <button className="alert-pill" onClick={() => onViewChange("timeline")}>
            <AlertTriangle size={16} />
            {alertCount}件
          </button>
        )}
        <button className="icon-button" onClick={onNewSchedule} aria-label="予定を追加">
          <Plus size={20} />
        </button>
        {user && (
          <button className="icon-button" onClick={onLogout} aria-label="ログアウト">
            <LogOut size={18} />
          </button>
        )}
        {demoMode && <span className="demo-badge">デモ</span>}
      </div>
    </header>
    <nav className="bottom-nav" aria-label="主要画面">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <button key={item.key} className={currentView === item.key ? "active" : ""} onClick={() => onViewChange(item.key)}>
            <Icon size={19} />
            <span>{item.label}</span>
          </button>
        );
      })}
      <button className="desktop-menu" aria-label="メニュー">
        <Menu size={19} />
      </button>
    </nav>
  </>
);
