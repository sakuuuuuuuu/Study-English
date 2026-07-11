import type { Message } from "@/types";
import { FeedbackPanel } from "./feedback-panel";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm"
        }`}
      >
        {message.content}
      </div>

      {/* フィードバックはAIの返答の下に表示（ユーザーの英語へのコメント） */}
      {!isUser && message.feedback && (
        <div className="w-full max-w-[80%]">
          <FeedbackPanel feedback={message.feedback} />
        </div>
      )}
    </div>
  );
}
