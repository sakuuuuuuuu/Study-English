import { redirect } from "next/navigation";
import { TOPICS } from "@/lib/topics";

interface Props {
  searchParams: Promise<{ topicId?: string }>;
}

export default async function ConversationPage({ searchParams }: Props) {
  const { topicId } = await searchParams;
  const topic = TOPICS.find((t) => t.id === topicId);

  if (!topic) {
    redirect("/");
  }

  return (
    <main className="min-h-screen p-8 max-w-2xl mx-auto flex flex-col">
      <div className="text-center mb-8">
        <span className="text-4xl">{topic.emoji}</span>
        <h1 className="text-2xl font-bold mt-2">{topic.label}</h1>
        <p className="text-muted-foreground text-sm mt-1">{topic.description}</p>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">
          Phase 3 で会話機能を実装します
        </p>
      </div>
    </main>
  );
}
