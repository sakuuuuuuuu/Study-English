"use client";

import { useState } from "react";
import { Volume2, Loader2 } from "lucide-react";
import type { Message, GrammarResponse } from "@/types";
import { FeedbackPanel } from "./feedback-panel";

interface MessageBubbleProps {
  message: Message;
  onReplay?: (text: string) => void;
}

export function MessageBubble({ message, onReplay }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const [showJapanese, setShowJapanese] = useState(false);
  const [grammarState, setGrammarState] = useState<"idle" | "loading" | "shown">("idle");
  const [grammarData, setGrammarData] = useState<GrammarResponse | null>(null);

  const handleGrammar = async () => {
    if (grammarState === "loading") return;
    if (grammarState === "shown") {
      setGrammarState("idle");
      return;
    }
    if (grammarData) {
      setGrammarState("shown");
      return;
    }

    setGrammarState("loading");
    try {
      const res = await fetch("/api/grammar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sentence: message.content }),
      });
      if (!res.ok) throw new Error("grammar API error");
      const data: GrammarResponse = await res.json();
      setGrammarData(data);
      setGrammarState("shown");
    } catch {
      setGrammarState("idle");
    }
  };

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

      {/* フィードバック（学習の核心 — 返答直後に表示） */}
      {!isUser && message.feedback && (
        <div className="w-full max-w-[80%] mt-2">
          <FeedbackPanel feedback={message.feedback} />
        </div>
      )}

      {/* アクション行（補助操作 — フィードバックの後）
          min-h-[36px] でモバイルのタップ領域を確保 */}
      {!isUser && (
        <div className="max-w-[80%] w-full mt-1.5 flex items-center gap-1 flex-wrap">
          {onReplay && (
            <button
              onClick={() => onReplay(message.content)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 min-h-[36px] rounded-lg"
              aria-label="もう一度聞く"
            >
              <Volume2 className="w-3 h-3" />
              <span>もう一度聞く</span>
            </button>
          )}

          <button
            onClick={handleGrammar}
            disabled={grammarState === "loading"}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 min-h-[36px] rounded-lg disabled:opacity-50"
            aria-label="文法を解説"
            aria-expanded={grammarState === "shown"}
          >
            {grammarState === "loading" ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <span>📖</span>
            )}
            <span>{grammarState === "shown" ? "文法を閉じる" : "文法を解説"}</span>
          </button>

          {message.japaneseContent && (
            <button
              onClick={() => setShowJapanese((v) => !v)}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 min-h-[36px] rounded-lg"
              aria-expanded={showJapanese}
              aria-label={showJapanese ? "日本語訳を隠す" : "日本語訳を見る"}
            >
              <span>🇯🇵</span>
              <span>{showJapanese ? "日本語訳を隠す" : "日本語訳を見る"}</span>
            </button>
          )}
        </div>
      )}

      {/* 文法解説パネル */}
      {!isUser && grammarState === "shown" && grammarData && (
        <div className="max-w-[80%] w-full mt-1 rounded-xl border border-blue-200 dark:border-blue-800 overflow-hidden text-sm">
          <div className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 border-b border-blue-200 dark:border-blue-800">
            <span className="text-xs font-medium text-blue-700 dark:text-blue-400 tracking-wide">
              📖 文法解説
            </span>
          </div>
          <div className="px-3 py-2.5 bg-background space-y-3">
            <p className="text-muted-foreground leading-relaxed">{grammarData.overview}</p>
            {grammarData.parts.map((part, i) => (
              <div key={i} className="space-y-0.5">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded font-mono text-foreground">
                    {part.phrase}
                  </code>
                  <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                    {part.role}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed pl-1">
                  {part.explanation}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 日本語訳（補助情報 — 最後に展開） */}
      {!isUser && showJapanese && message.japaneseContent && (
        <div className="max-w-[80%] w-full mt-1 px-3 py-2 rounded-xl bg-muted/40 border border-border/50 text-sm text-muted-foreground leading-relaxed">
          {message.japaneseContent}
        </div>
      )}
    </div>
  );
}
