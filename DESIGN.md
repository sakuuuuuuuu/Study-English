# 設計書 — Study English

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
  └─ AIが6〜8個のトピックを提示
       └─ ユーザーがトピックを選択
            ↓
[会話画面]
  AIが英語で最初の話しかけ（テキスト + 音声）
       ↓
  ┌─────────────────────────────────┐
  │  ① マイクボタンを押しっぱなし     │
  │  ② 英語で話す                    │  ← ループ
  │  ③ ボタンを離す → 送信           │
  │  ④ AIが英語で返答（音声 + テキスト）│
  │  ⑤ 日本語フィードバックが表示     │
  └─────────────────────────────────┘
       ↓
  「会話を終わる」ボタンでトップへ戻る
```

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

### 1リクエストのデータフロー

```
① ユーザーが話す
     ↓
② ブラウザが音声データ（WebM/MP4）を録音
     ↓
③ POST /api/transcribe に音声ファイルを送信
     ↓ (サーバー)
④ OpenAI Whisper で文字起こし → テキストを返却
     ↓
⑤ POST /api/chat に { transcript, conversationHistory } を送信
     ↓ (サーバー)
⑥ GPT-4o に会話履歴 + システムプロンプトを渡す
     ↓
⑦ GPT-4o が JSON で返す:
   {
     "reply": "That sounds wonderful! ...",     // 英語返答
     "feedback": {
       "hasError": true,
       "corrections": [
         { "original": "I go yesterday", "fixed": "I went yesterday", "explanation": "goの過去形はwent" }
       ],
       "naturalAlternative": "I visited ~ yesterday would sound more natural.",
       "simplerExpression": null
     }
   }
     ↓
⑧ POST /api/speak に英語返答テキストを送信
     ↓ (サーバー)
⑨ OpenAI TTS で音声データ生成 → ブラウザに返却
     ↓
⑩ ブラウザが音声を再生 + テキストと日本語フィードバックを表示
```

---

## 4. ディレクトリ構成

```
src/
├── app/
│   ├── layout.tsx               # ルートレイアウト（フォント・メタデータ）
│   ├── page.tsx                 # トップ画面（トピック選択）
│   ├── conversation/
│   │   └── page.tsx             # 会話画面
│   └── api/
│       ├── transcribe/
│       │   └── route.ts         # Whisper STT エンドポイント
│       ├── chat/
│       │   └── route.ts         # GPT-4o 会話＋フィードバック エンドポイント
│       └── speak/
│           └── route.ts         # TTS エンドポイント
├── components/
│   ├── topic-card.tsx           # トピック選択カード
│   ├── conversation-view.tsx    # 会話画面全体のレイアウト
│   ├── message-bubble.tsx       # メッセージ吹き出し（ユーザー / AI）
│   ├── feedback-panel.tsx       # 日本語フィードバック表示エリア
│   └── mic-button.tsx           # 録音ボタン（Push-to-talk）
├── hooks/
│   ├── use-audio-recorder.ts    # マイク録音ロジック
│   └── use-audio-player.ts      # 音声再生ロジック
├── lib/
│   ├── openai.ts                # OpenAI クライアント初期化
│   ├── prompts.ts               # システムプロンプト定義
│   └── topics.ts                # トピックリスト定数
└── types/
    └── index.ts                 # 型定義（Message, Feedback, Topic等）
```

---

## 5. API Routes 仕様

### `POST /api/transcribe`

音声ファイルをテキストに変換する。

**リクエスト**
```
Content-Type: multipart/form-data
Body: { audio: File }  // WebM形式の音声ファイル
```

**レスポンス**
```json
{ "transcript": "I go to the gym yesterday." }
```

---

### `POST /api/chat`

会話の返答と英語フィードバックを生成する。

**リクエスト**
```json
{
  "transcript": "I go to the gym yesterday.",
  "topic": "日常の出来事",
  "history": [
    { "role": "assistant", "content": "What did you do today?" }
  ]
}
```

**レスポンス**
```json
{
  "reply": "That sounds great! How often do you go to the gym?",
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

`feedback.hasError` が `false` のときは「Good job! 自然な英語でした」と表示する。

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
あなたは英語会話練習のパートナーです。以下のルールに従ってください。

【会話のルール】
- 常に英語で返答してください
- TOEIC 600〜700点レベルの語彙・文法を使い、難しすぎる表現は避けてください
- 相手の発言に対して自然な質問や反応を返し、会話を続けてください
- 今日のトピックは「{topic}」です

【フィードバックのルール】
返答とは別に、必ず以下のJSON形式でフィードバックを返してください。
ユーザーの英語に問題がない場合は hasError: false にしてください。

{
  "reply": "英語の返答",
  "feedback": {
    "hasError": boolean,
    "corrections": [
      { "original": "元の表現", "fixed": "正しい表現", "explanation": "日本語での説明" }
    ],
    "naturalAlternative": "より自然な言い方（あれば日本語で説明）",
    "simplerExpression": "高校生レベルのシンプルな言い方（あれば日本語で説明）"
  }
}
```

---

## 7. トピックリスト（初期）

日常会話とTOEICで頻出する場面をカバーする。

| カテゴリ | トピック例 |
|----------|------------|
| 日常生活 | 週末の過ごし方、最近ハマっていること、今日の出来事 |
| 食事・カフェ | レストランで注文する、好きな料理について話す |
| 旅行 | 旅行の計画を立てる、行ってみたい国について話す |
| 仕事・学習 | 仕事の内容を説明する、勉強の悩みを話す |
| エンタメ | 最近見た映画・ドラマ、好きな音楽 |
| 時事・意見 | 環境問題について意見を言う、SNSの良し悪しを話す |

---

## 8. 非機能要件

| 項目 | 方針 |
|------|------|
| **セキュリティ** | OpenAI APIキーはサーバーサイドのみ。`.env.local` はGit管理外（`.gitignore`） |
| **レスポンス速度** | Whisper → Chat → TTS の3回APIを叩くため、1ターンあたり5〜10秒を目安とする |
| **エラーハンドリング** | API失敗時はトースト通知でユーザーに伝え、会話を継続できる状態を保つ |
| **ブラウザ対応** | Chrome / Edge を主ターゲット（MediaRecorder APIの安定動作が確認されているため） |
| **コスト管理** | 1セッションあたりの上限ターン数は設けない（個人利用のため） |

---

## 9. 環境変数

| 変数名 | 説明 | 必須 |
|--------|------|------|
| `OPENAI_API_KEY` | OpenAI APIキー | ✅ |

---

## 10. 実装フェーズ

| フェーズ | 内容 |
|----------|------|
| Phase 1 | プロジェクト初期化（Next.js + shadcn/ui + 環境変数） |
| Phase 2 | トピック選択画面 |
| Phase 3 | テキスト入力での会話＋フィードバック（音声なし）で動作確認 |
| Phase 4 | Whisper（音声入力）を追加 |
| Phase 5 | TTS（音声読み上げ）を追加 |
| Phase 6 | UIを整えてVercelにデプロイ |

> Phase 3でまず「会話が成立する」状態を作り、音声は後から乗せる戦略をとる。これにより一番重要なGPT-4oのフィードバック品質を早期に検証できる。
