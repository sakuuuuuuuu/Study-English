"use client";

import { useState } from "react";
import type { Message } from "@/types";
import { FeedbackPanel } from "./feedback-panel";

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
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

      {/* AI メッセージに日本語訳ボタンを表示 */}
      {!isUser && message.japaneseContent && (
        <div className="max-w-[80%] w-full mt-1">
          <button
            onClick={() => setShowJapanese((v) => !v)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
          >
            <span>🇯🇵</span>
            <span>{showJapanese ? "日本語訳を隠す" : "日本語訳を見る"}</span>
          </button>

          {showJapanese && (
            <div className="mt-1 px-3 py-2 rounded-xl bg-muted/40 border border-border/50 text-sm text-muted-foreground leading-relaxed">
              {message.japaneseContent}
            </div>
          )}
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
