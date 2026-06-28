# 口座管理アプリ

複数口座の未来残高を管理するためのアプリです。家計簿のように過去の支出を分析するのではなく、将来の引落予定に対して残高が足りるかを確認します。

## 主な機能

- Google アカウントログイン
- Firebase Authentication / Firestore によるユーザー別データ保存
- Firebase 未設定時のサンプルデータ表示
- 口座の登録
- 収入・支出・振替を「予定」として登録
- 登録済み予定の編集・削除
- 単発、毎週、毎月、隔月、毎年の繰り返し予定
- 180日先までの予定展開
- 口座ごとの未来残高タイムライン
- 残高不足アラート
- 不足口座への資金移動提案
- 月間カレンダー表示
- PWA 対応
- スマートフォン優先のレスポンシブ UI

## 画面構成

- ダッシュボード: 全口座残高、30日以内の収入・支出、不足予定、資金移動提案を表示
- タイムライン: 口座ごとの予定と予測残高を時系列で表示
- カレンダー: 今月の予定と今後14日の予定を表示
- 入力: 口座、収入、支出、振替予定を登録・編集・削除
- ログイン: Firebase 設定済みの場合、Google アカウントでログイン

## 予定編集

入力画面の「登録済み予定」一覧から鉛筆アイコンを押すと、対象の予定がフォームに読み込まれます。

編集できる項目:

- 名称
- 日付
- 金額
- 種別
- 繰り返し
- 対象口座
- 振替時の出金口座・入金口座
- メモ

編集状態では保存ボタンが「更新」になります。「解除」を押すと編集をやめて新規追加フォームに戻ります。

## セットアップ

依存関係をインストールします。

```bash
pnpm install
```

開発サーバーを起動します。

```bash
pnpm dev
```

本番ビルドを作成します。

```bash
pnpm build
```

ビルド済みアプリを確認します。

```bash
pnpm preview
```

## Firebase 設定

Firebase 接続は `src/lib/firebase.ts` にあります。環境変数は `.env` に設定します。

```bash
cp .env.example .env
```

`.env` に Firebase プロジェクトの Web アプリ設定を入れます。

```text
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_FIREBASE_MEASUREMENT_ID=...
```

Firebase Console で Authentication の Google ログインを有効化してください。

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

## Firestore セキュリティルール例

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Firebase Hosting へのデプロイ

```bash
pnpm build
firebase deploy --only hosting
```

Hosting の public directory は `dist` を指定します。SPA として動かすため、Firebase Hosting 初期化時は single-page app の設定を有効にしてください。

## 技術スタック

- Vite
- React
- TypeScript
- Firebase Authentication
- Firestore
- lucide-react
- PWA
