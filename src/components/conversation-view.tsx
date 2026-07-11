"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Send } from "lucide-react";
import { MessageBubble } from "./message-bubble";
import type { Message, ChatResponse, Topic } from "@/types";

interface ConversationViewProps {
  topic: Topic;
}

type ApiMessage = { role: "user" | "assistant"; content: string };

export function ConversationView({ topic }: ConversationViewProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [apiHistory, setApiHistory] = useState<ApiMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const hasStarted = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const callChatApi = useCallback(
    async (userMessage: string, currentHistory: ApiMessage[]): Promise<ChatResponse> => {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userMessage,
          topicLabel: topic.label,
          starterPrompt: topic.starterPrompt,
          history: currentHistory,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? "API error");
      }

      return res.json() as Promise<ChatResponse>;
    },
    [topic.label, topic.starterPrompt]
  );

  // 会話開始：マウント時にAIのオープニングを取得
  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    callChatApi("", [])
      .then((data) => {
        const aiMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.reply,
          // スターターはユーザー発言がないのでフィードバック不要
          feedback: undefined,
        };
        setMessages([aiMsg]);
        setApiHistory([{ role: "assistant", content: data.reply }]);
      })
      .catch(() => {
        toast.error("AIとの接続に失敗しました。ページを再読み込みしてください。");
      })
      .finally(() => setIsLoading(false));
  }, [callChatApi]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setInput("");

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    // APIに渡す履歴（現在のメッセージは含めず、APIルート側で追加される）
    const historyWithUser: ApiMessage[] = [
      ...apiHistory,
      { role: "user", content: text },
    ];

    try {
      const data = await callChatApi(text, apiHistory);

      const aiMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.reply,
        feedback: data.feedback,
      };

      setMessages((prev) => [...prev, aiMsg]);
      setApiHistory([
        ...historyWithUser,
        { role: "assistant", content: data.reply },
      ]);
    } catch {
      toast.error("AIとの通信に失敗しました。もう一度お試しください。");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
      textareaRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {isLoading && (
            <div className="flex items-start">
              <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3 text-sm text-muted-foreground">
                <span className="inline-flex gap-1">
                  <span className="animate-bounce [animation-delay:0ms]">●</span>
                  <span className="animate-bounce [animation-delay:150ms]">●</span>
                  <span className="animate-bounce [animation-delay:300ms]">●</span>
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 入力エリア */}
      <div className="border-t px-4 py-4 shrink-0 bg-background">
        <div className="flex items-end gap-3 max-w-2xl mx-auto">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
            placeholder="英語でメッセージを入力… （Enterで送信・Shift+Enterで改行）"
            rows={2}
            className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50 leading-relaxed"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground transition-opacity disabled:opacity-40 hover:opacity-80 active:opacity-60"
            aria-label="送信"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </>
  );
}
