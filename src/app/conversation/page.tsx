import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { TOPICS } from "@/lib/topics";
import { buttonVariants } from "@/components/ui/button";
import { ConversationView } from "@/components/conversation-view";

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
    <div className="h-screen flex flex-col bg-background">
      {/* ヘッダー */}
      <header className="border-b px-4 py-3 flex items-center gap-2 shrink-0">
        <Link href="/" className={buttonVariants({ variant: "ghost", size: "sm" })}>
          <ArrowLeft className="w-4 h-4" />
          トピックに戻る
        </Link>
        <div className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
          <span>{topic.emoji}</span>
          <span className="font-medium text-foreground">{topic.label}</span>
        </div>
      </header>

      {/* 会話UI（クライアントコンポーネント） */}
      <ConversationView topic={topic} />
    </div>
  );
}
