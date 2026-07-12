"use client";

import { useState } from "react";
import { Volume2 } from "lucide-react";
import type { Message } from "@/types";
import { FeedbackPanel } from "./feedback-panel";

interface MessageBubbleProps {
  message: Message;
  onReplay?: (text: string) => void;
}

export function MessageBubble({ message, onReplay }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [showJapanese, setShowJapanese] = useState(false);

  return (
    <div className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
      {/* 吹き出し */}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-primary text-primary-foreground rounded-br-sm"
            : "bg-muted text-foreground rounded-bl-sm"
        }`}
      >
        {message.content}
      </div>

      {/* AIメッセージのアクション行 */}
      {!isUser && (
        <div className="max-w-[80%] w-full mt-1 flex items-center gap-3">
          {/* 再生ボタン */}
          {onReplay && (
            <button
              onClick={() => onReplay(message.content)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
              aria-label="もう一度聞く"
            >
              <Volume2 className="w-3 h-3" />
              <span>もう一度聞く</span>
            </button>
          )}

          {/* 日本語訳トグル */}
          {message.japaneseContent && (
            <button
              onClick={() => setShowJapanese((v) => !v)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
            >
              <span>🇯🇵</span>
              <span>{showJapanese ? "日本語訳を隠す" : "日本語訳を見る"}</span>
            </button>
          )}
        </div>
      )}

      {/* 日本語訳本文 */}
      {!isUser && showJapanese && message.japaneseContent && (
        <div className="max-w-[80%] w-full mt-1 px-3 py-2 rounded-xl bg-muted/40 border border-border/50 text-sm text-muted-foreground leading-relaxed">
          {message.japaneseContent}
        </div>
      )}

      {/* フィードバック（ユーザーの英語へのコメント） */}
      {!isUser && message.feedback && (
        <div className="w-full max-w-[80%]">
          <FeedbackPanel feedback={message.feedback} />
        </div>
      )}
    </div>
  );
}
