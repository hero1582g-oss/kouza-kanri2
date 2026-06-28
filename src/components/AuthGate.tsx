import { LogIn, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

type Props = {
  configured: boolean;
  loading: boolean;
  signedIn: boolean;
  error?: string | null;
  onLogin: () => void;
  children: ReactNode;
};

export const AuthGate = ({ configured, loading, signedIn, error, onLogin, children }: Props) => {
  if (loading) return <div className="center-screen">読み込み中...</div>;
  if (!configured) return <>{children}</>;
  if (signedIn) return <>{children}</>;

  return (
    <main className="login-screen">
      <section className="login-panel">
        <div className="brand-mark">
          <ShieldCheck size={30} />
        </div>
        <h1>口座管理</h1>
        <p>Google アカウントでログインすると、スマホ・自宅PC・職場PCで同じ口座予定を確認できます。</p>
        {error && <p className="login-error">{error}</p>}
        <button className="primary-button" onClick={onLogin}>
          <LogIn size={18} />
          Googleでログイン
        </button>
      </section>
    </main>
  );
};
