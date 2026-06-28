# 口座管理アプリ

家計簿ではなく、複数口座の未来残高と引落予定を確認するためのアプリです。将来の予定を展開し、口座ごとの予測残高、残高不足、資金移動提案を表示します。

## 主な機能

- Google アカウントログイン
- 口座管理
- 収入・支出・振替を「予定」として管理
- 単発、毎週、毎月、隔月、毎年の繰り返し
- 口座ごとの未来残高タイムライン
- 残高不足アラート
- 自動資金移動提案
- 月間カレンダー
- PWA 対応

## Firestore データ設計

```text
users/{uid}
  accounts/{accountId}
    name: string
    currentBalance: number
    displayOrder: number
    memo?: string

  schedules/{scheduleId}
    name: string
    date: string
    amount: number
    kind: "income" | "expense" | "transfer"
    recurrence: "once" | "monthly" | "bimonthly" | "yearly" | "weekly"
    accountId?: string
    fromAccountId?: string
    toAccountId?: string
    memo?: string
```

振替は 1 つの予定として保存し、シミュレーション時に出金口座のマイナスと入金口座のプラスへ展開します。

## Firebase 設定箇所

Firebase 接続は `src/lib/firebase.ts` にあります。環境変数は `.env` に設定します。

```bash
cp .env.example .env
```

`.env` に Firebase プロジェクトの Web アプリ設定を入れてください。

```text
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Firebase Console で Authentication の Google ログインを有効化してください。

## セットアップ

```bash
pnpm install
pnpm dev
```

本番ビルド:

```bash
pnpm build
```

Firebase 未設定の場合でも、サンプルデータのデモ画面として起動できます。Firebase 設定後はログインユーザーごとの Firestore データを利用します。
