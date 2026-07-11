import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, Mic } from "lucide-react";
import { TOPICS } from "@/lib/topics";
import { buttonVariants } from "@/components/ui/button";

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
    <div className="min-h-screen flex flex-col bg-background">
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

      {/* 会話エリア（Phase 3 で実装） */}
      <div className="flex-1 flex flex-col items-center justify-center gap-4 px-6 text-center">
        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center">
          <Mic className="w-8 h-8 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium text-lg">会話の準備ができています</p>
          <p className="text-muted-foreground text-sm mt-1">
            AIとの会話機能を準備中です
          </p>
        </div>
      </div>

      {/* 入力エリア（Phase 3 で実装） */}
      <div className="border-t px-6 py-6 flex justify-center shrink-0">
        <button
          disabled
          className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center cursor-not-allowed"
          aria-label="マイクボタン（準備中）"
        >
          <Mic className="w-6 h-6 text-primary/40" />
        </button>
      </div>
    </div>
  );
}
