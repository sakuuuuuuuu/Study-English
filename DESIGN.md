# 設計書 — Lingua AI

## 1. プロダクト概要

### 目的
TOEIC 550〜600点のユーザーが700点レベルへ到達しつつ、日常会話のスピーキングを習慣的に練習できるWebアプリを作る。

### 成功の定義
- マイクに向かって話すだけで会話が成立し、自分の英語の問題点がすぐに分かる
- 1回のセッション（10〜15分）が負担なく続けられる

---

## 2. ユーザー体験フロー

```
[トップ画面]
  └─ 8つのトピックカードを表示
       └─ ユーザーがトピックを選択
            ↓
[会話画面]
  AIが英語で最初の話しかけ（テキスト + 音声読み上げ）
       ↓
  ┌─────────────────────────────────────────────┐
  │  ① マイクボタンを長押し                      │
  │  ② 英語で話す                               │  ← ループ
  │  ③ ボタンを離す → Whisper で文字起こし       │
  │  ④ AIが英語で返答（テキスト表示 + 音声読み上げ）│
  │  ⑤ 日本語フィードバックが表示               │
  │  ⑥ 🇯🇵ボタンで日本語訳をトグル表示          │
  └─────────────────────────────────────────────┘
       ↓
  「← トピックに戻る」でトップへ
```

**補足：**
- テキスト入力欄も常時利用可能（音声の補助手段として）
- AI が話している最中にマイクを押すと読み上げを中断して録音開始
- マイクボタンはアイコンで状態を表示（待機 / 録音中 / 変換中 / 再生中）

---

## 3. アーキテクチャ

### 全体構成

```
ブラウザ (Next.js フロントエンド)
    │
    │ HTTPS
    ▼
Next.js API Routes (サーバーサイド)   ← OpenAI APIキーはここで管理
    │
    │ OpenAI API
    ▼
OpenAI (Whisper / GPT-4o / TTS)
```

> **なぜAPIキーをサーバーサイドに置くか**
> OpenAI APIキーをブラウザに渡すと、誰でも抜き取れる状態になり、意図しない課金が発生するリスクがある。Next.js API Routesを挟むことでキーをサーバー側に隔離する。

### 1ターンのデータフロー

```
① ユーザーがマイクボタンを長押し → MediaRecorder で録音開始
     ↓
② ボタンを離す → WebM 音声データをキャプチャ
     ↓
③ POST /api/transcribe に音声ファイルを送信
     ↓ (サーバー)
④ OpenAI Whisper-1 で英語テキストに変換 → 返却
     ↓
⑤ POST /api/chat に { userMessage, topicLabel, starterPrompt, history } を送信
     ↓ (サーバー)
⑥ GPT-4o がシステムプロンプト + 会話履歴を元にJSON返答を生成
     ↓
⑦ フロントに以下のJSONが返る:
   {
     "reply": "That sounds wonderful! ...",
     "japaneseReply": "それは素晴らしいですね！...",
     "feedback": {
       "hasError": true,
       "corrections": [
         { "original": "I go yesterday", "fixed": "I went yesterday", "explanation": "..." }
       ],
       "naturalAlternative": null,
       "simplerExpression": null
     }
   }
     ↓
⑧ テキスト・フィードバック・日本語訳をUIに表示
     ↓
⑨ POST /api/speak に英語返答テキストを送信
     ↓ (サーバー)
⑩ OpenAI TTS（nova ボイス）で MP3 生成 → ブラウザに返却
     ↓
⑪ ブラウザが音声を自動再生
```

---

## 4. ディレクトリ構成

```
src/
├── app/
│   ├── globals.css              # Tailwind v4 + shadcn/ui テーマ
│   ├── layout.tsx               # ルートレイアウト（フォント・メタデータ・Toaster）
│   ├── page.tsx                 # トップ画面（トピック選択）
│   ├── conversation/
│   │   └── page.tsx             # 会話画面（サーバーコンポーネント）
│   └── api/
│       ├── transcribe/
│       │   └── route.ts         # Whisper STT エンドポイント
│       ├── chat/
│       │   └── route.ts         # GPT-4o 会話＋フィードバック エンドポイント
│       └── speak/
│           └── route.ts         # TTS エンドポイント
├── components/
│   ├── topic-card.tsx           # トピック選択カード
│   ├── conversation-view.tsx    # 会話UI全体（クライアントコンポーネント）
│   ├── message-bubble.tsx       # メッセージ吹き出し＋日本語訳トグル
│   └── feedback-panel.tsx       # 日本語フィードバック表示
├── hooks/
│   ├── use-audio-recorder.ts    # Push-to-talk 録音ロジック
│   └── use-audio-player.ts      # TTS 音声再生ロジック
├── lib/
│   ├── openai.ts                # OpenAI クライアント初期化（サーバー専用）
│   ├── prompts.ts               # システムプロンプト定義
│   ├── topics.ts                # トピックリスト定数（8件）
│   └── utils.ts                 # shadcn/ui ユーティリティ（cn関数）
└── types/
    └── index.ts                 # 型定義（Message, Feedback, ChatResponse, Topic）
```

---

## 5. API Routes 仕様

### `POST /api/transcribe`

音声ファイルをテキストに変換する。

**リクエスト**
```
Content-Type: multipart/form-data
Body: { audio: File }  // WebM 形式の音声ファイル
```

**レスポンス**
```json
{ "transcript": "I go to the gym yesterday." }
```

---

### `POST /api/chat`

会話の返答・日本語訳・フィードバックを一括生成する。

**リクエスト**
```json
{
  "userMessage": "I go to the gym yesterday.",
  "topicLabel": "今日の出来事",
  "starterPrompt": "Ask me how my day was and what I did today.",
  "history": [
    { "role": "assistant", "content": "What did you do today?" }
  ]
}
```

> `userMessage` が空で `history` が空配列のとき、AIのオープニング発言を生成する。

**レスポンス**
```json
{
  "reply": "That sounds great! How often do you go to the gym?",
  "japaneseReply": "それは素晴らしいですね！どのくらいの頻度でジムに行きますか？",
  "feedback": {
    "hasError": true,
    "corrections": [
      {
        "original": "I go to the gym yesterday",
        "fixed": "I went to the gym yesterday",
        "explanation": "「go」は現在形です。「yesterday（昨日）」と一緒に使うときは過去形「went」が必要です。"
      }
    ],
    "naturalAlternative": null,
    "simplerExpression": null
  }
}
```

`feedback.hasError` が `false` のときは「✅ 自然な英語でした！」と表示する。

---

### `POST /api/speak`

テキストを音声ファイルに変換する。

**リクエスト**
```json
{ "text": "That sounds great! How often do you go to the gym?" }
```

**レスポンス**
```
Content-Type: audio/mpeg
Body: MP3音声データ（バイナリ）
```

---

## 6. システムプロンプト設計

GPT-4oに渡すシステムプロンプトの骨格。

```
You are a friendly English conversation partner helping a Japanese learner.
Today's topic is "{topic}"

Return raw JSON only (no markdown):
{
  "reply": "英語の返答",
  "japaneseReply": "replyの日本語訳",
  "feedback": {
    "hasError": boolean,
    "corrections": [
      { "original": "元の表現", "fixed": "正しい表現", "explanation": "日本語での説明" }
    ],
    "naturalAlternative": "より自然な言い方（なければ null）",
    "simplerExpression": "高校生レベルのシンプルな言い方（なければ null）"
  }
}
```

---

## 7. トピックリスト

| カテゴリ | ラベル | 説明 |
|----------|--------|------|
| 日常生活 | 今日の出来事 | 日常のできごとや週末の予定 |
| 食事 | 食事・カフェ | 好きな料理やレストランでの注文 |
| 旅行 | 旅行の計画 | 行ってみたい場所や旅行の思い出 |
| 仕事 | 仕事・勉強 | 仕事の内容や勉強の悩み |
| 趣味 | 趣味・好きなこと | 最近ハマっていることや好きな活動 |
| エンタメ | 映画・音楽 | 最近見た映画やドラマ、好きな音楽 |
| ライフスタイル | 健康・運動 | 運動習慣や健康についての話 |
| 意見 | 意見を言う練習 | SNSや環境問題など意見を英語で伝える |

---

## 8. 非機能要件

| 項目 | 方針 |
|------|------|
| **セキュリティ** | OpenAI APIキーはサーバーサイドのみ。`.env.local` はGit管理外（`.gitignore`） |
| **レスポンス速度** | Whisper → Chat → TTS の3回APIを叩くため、1ターンあたり5〜10秒を目安とする |
| **エラーハンドリング** | API失敗時はトースト通知でユーザーに伝え、会話を継続できる状態を保つ。TTS失敗はサイレント処理 |
| **ブラウザ対応** | Chrome / Edge を主ターゲット（MediaRecorder APIの安定動作が確認されているため） |
| **コスト管理** | 1セッションあたりの上限ターン数は設けない（個人利用のため） |
| **パッケージ管理** | pnpm を使用。`pnpm-workspace.yaml` で sharp / unrs-resolver のビルドを許可 |

---

## 9. 環境変数

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `OPENAI_API_KEY` | OpenAI APIキー | ✅ |

---

## 10. 実装フェーズ

| フェーズ | 内容 | 状態 |
|----------|------|------|
| Phase 1 | Next.js + shadcn/ui + 型定義・lib の初期セットアップ | ✅ 完了 |
| Phase 2 | トピック選択画面（ヒーロー・カードグリッド・会話ページシェル） | ✅ 完了 |
| Phase 3 | テキスト入力での会話＋日本語フィードバック（音声なし） | ✅ 完了 |
| Phase 4 | Whisper（Push-to-talk 音声入力）を追加 | ✅ 完了 |
| Phase 5 | TTS（AI音声読み上げ・マイクで割り込み可能）を追加 | ✅ 完了 |
| 追加機能 | 日本語訳トグルボタン（🇯🇵 クリックで展開・非表示） | ✅ 完了 |
| Phase 6 | UIを整えてVercelにデプロイ | 🔲 未着手 |
