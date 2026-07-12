import { TOPICS } from "@/lib/topics";
import { TopicCard } from "@/components/topic-card";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="border-b">
        <div className="max-w-4xl mx-auto px-6 py-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            Lingua AI
          </h1>
          <p className="text-muted-foreground text-lg mb-8">
            AIと英会話して、文法・表現のフィードバックをリアルタイムでもらおう
          </p>

          {/* How it works */}
          <div className="flex items-center justify-center gap-2 flex-wrap text-sm">
            <div className="flex items-center gap-2 bg-muted rounded-full px-4 py-2 font-medium">
              <span className="text-base">1️⃣</span>
              トピックを選ぶ
            </div>
            <span className="text-muted-foreground text-base">→</span>
            <div className="flex items-center gap-2 bg-muted rounded-full px-4 py-2 font-medium">
              <span className="text-base">2️⃣</span>
              マイクで英語を話す
            </div>
            <span className="text-muted-foreground text-base">→</span>
            <div className="flex items-center gap-2 bg-muted rounded-full px-4 py-2 font-medium">
              <span className="text-base">3️⃣</span>
              日本語でフィードバック
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
