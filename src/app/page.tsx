import { TOPICS } from "@/lib/topics";
import { TopicCard } from "@/components/topic-card";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="border-b">
        <div className="max-w-4xl mx-auto px-6 py-10 text-center">
          {/* ブランド名（補助的） */}
          <p className="text-sm font-medium text-muted-foreground tracking-widest uppercase mb-4">
            Lingua AI
          </p>

          {/* メインヘッドライン */}
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
            AIと英語で話して、
            <br className="sm:hidden" />
            スピーキング力を伸ばそう
          </h1>
          <p className="text-muted-foreground mb-10">
            TOEIC 550 → 700 を目指す、AI英会話練習アプリ
          </p>

          {/* 使い方ステップ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-2xl mx-auto">
            <div className="bg-muted/50 rounded-2xl px-5 py-4">
              <div className="text-2xl mb-2">🗂️</div>
              <p className="font-semibold text-sm mb-1">1. トピックを選ぶ</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                日常会話・旅行・仕事など、話したいテーマを選びます
              </p>
            </div>
            <div className="bg-muted/50 rounded-2xl px-5 py-4">
              <div className="text-2xl mb-2">🎙️</div>
              <p className="font-semibold text-sm mb-1">2. マイクで英語を話す</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                マイクボタンを長押しして話すだけ。テキスト入力でも OK
              </p>
            </div>
            <div className="bg-muted/50 rounded-2xl px-5 py-4">
              <div className="text-2xl mb-2">📝</div>
              <p className="font-semibold text-sm mb-1">3. フィードバックをもらう</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                文法ミスや自然な表現を、日本語でわかりやすく解説します
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Topic grid */}
      <div className="max-w-4xl mx-auto px-6 py-10">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-5">
          今日のトピックを選ぶ
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {TOPICS.map((topic) => (
            <TopicCard key={topic.id} topic={topic} />
          ))}
        </div>
      </div>
    </div>
  );
}
