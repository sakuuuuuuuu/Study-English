import { TOPICS } from "@/lib/topics";
import { TopicCard } from "@/components/topic-card";

export default function Home() {
  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-3">
          Study English
        </h1>
        <p className="text-muted-foreground text-lg">
          トピックを選んで、AIと英会話を始めよう
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {TOPICS.map((topic) => (
          <TopicCard key={topic.id} topic={topic} />
        ))}
      </div>
    </main>
  );
}
