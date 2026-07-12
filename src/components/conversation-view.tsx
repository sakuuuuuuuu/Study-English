"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { Mic, Loader2, Send } from "lucide-react";
import { MessageBubble } from "./message-bubble";
import { useAudioRecorder } from "@/hooks/use-audio-recorder";
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
        const err = (await res.json().catch(() => ({}))) as { error?: string };
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
          feedback: undefined, // スターターにフィードバック不要
        };
        setMessages([aiMsg]);
        setApiHistory([{ role: "assistant", content: data.reply }]);
      })
      .catch(() => {
        toast.error("AIとの接続に失敗しました。ページを再読み込みしてください。");
      })
      .finally(() => setIsLoading(false));
  }, [callChatApi]);

  /** テキスト・音声どちらからも呼び出される送信の核心ロジック */
  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) return;

      const userMsg: Message = {
        id: crypto.randomUUID(),
        role: "user",
        content: text,
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

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
        setApiHistory([...historyWithUser, { role: "assistant", content: data.reply }]);
      } catch {
        toast.error("AIとの通信に失敗しました。もう一度お試しください。");
        setMessages((prev) => prev.slice(0, -1));
      } finally {
        setIsLoading(false);
        textareaRef.current?.focus();
      }
    },
    [isLoading, apiHistory, callChatApi]
  );

  // テキスト送信
  const handleSend = () => {
    sendMessage(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 音声文字起こし完了 → 自動送信
  const handleTranscript = useCallback(
    (text: string) => sendMessage(text),
    [sendMessage]
  );

  const handleMicError = useCallback((msg: string) => {
    toast.error(msg);
  }, []);

  const { recordingState, startRecording, stopRecording } = useAudioRecorder({
    onTranscript: handleTranscript,
    onError: handleMicError,
  });

  const isBusy = isLoading || recordingState !== "idle";

  const textareaPlaceholder =
    recordingState === "recording"
      ? "録音中… ボタンを離すと送信します"
      : recordingState === "transcribing"
      ? "音声を変換中…"
      : "英語でメッセージを入力… （Enterで送信・Shift+Enterで改行）";

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

          {/* マイクボタン（Push-to-talk） */}
          <button
            onPointerDown={startRecording}
            onPointerUp={stopRecording}
            onPointerLeave={stopRecording}
            onContextMenu={(e) => e.preventDefault()}
            disabled={isLoading}
            aria-label={
              recordingState === "recording"
                ? "録音中（離すと送信）"
                : "マイクで話す（長押し）"
            }
            className={`shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all select-none touch-none ${
              recordingState === "recording"
                ? "bg-red-500 text-white scale-110 shadow-lg shadow-red-500/30 animate-pulse"
                : recordingState === "transcribing"
                ? "bg-muted text-muted-foreground cursor-wait"
                : "bg-muted hover:bg-muted/70 text-foreground disabled:opacity-40"
            }`}
          >
            {recordingState === "transcribing" ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
          </button>

          {/* テキスト入力（補助） */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isBusy}
            placeholder={textareaPlaceholder}
            rows={2}
            className="flex-1 resize-none rounded-xl border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50 leading-relaxed"
          />

          {/* 送信ボタン */}
          <button
            onClick={handleSend}
            disabled={isBusy || !input.trim()}
            aria-label="送信"
            className="shrink-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground transition-opacity disabled:opacity-40 hover:opacity-80 active:opacity-60"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* 操作ガイド */}
        <p className="text-center text-xs text-muted-foreground mt-2 max-w-2xl mx-auto">
          {recordingState === "recording"
            ? "🔴 録音中 — ボタンを離すと送信されます"
            : recordingState === "transcribing"
            ? "⏳ 音声を認識しています…"
            : "🎙 マイクボタンを長押しして話してください"}
        </p>
      </div>
    </>
  );
}
