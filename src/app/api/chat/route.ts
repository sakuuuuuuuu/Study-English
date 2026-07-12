import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { buildSystemPrompt, buildStarterMessage } from "@/lib/prompts";
import { TOPICS } from "@/lib/topics";
import type { ChatResponse } from "@/types";

type ApiMessage = { role: "user" | "assistant"; content: string };

/** 直近何件のやり取りを GPT に渡すか（1ターン = user + assistant の2件） */
const MAX_HISTORY = 20;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userMessage, topicId, history }: {
      userMessage: string;
      topicId: string;
      history: unknown[];
    } = body;

    // topicId をサーバー側の TOPICS リストで照合（クライアントの文字列を直接信頼しない）
    const topic = TOPICS.find((t) => t.id === topicId);
    if (!topic) {
      return NextResponse.json({ error: "無効なトピックです" }, { status: 400 });
    }

    // 履歴をサーバー側で検証・件数制限（クライアントが何を送っても上限を強制）
    const trimmedHistory: ApiMessage[] = (Array.isArray(history) ? history : [])
      .filter(
        (m): m is ApiMessage =>
          typeof m === "object" &&
          m !== null &&
          ((m as ApiMessage).role === "user" || (m as ApiMessage).role === "assistant") &&
          typeof (m as ApiMessage).content === "string"
      )
      .slice(-MAX_HISTORY);

    const systemPrompt = buildSystemPrompt(topic.label);
    const isStarter = !userMessage && trimmedHistory.length === 0;

    const messages: { role: "system" | "user" | "assistant"; content: string }[] =
      isStarter
        ? [
            { role: "system", content: systemPrompt },
            { role: "user", content: buildStarterMessage(topic.label, topic.starterPrompt) },
          ]
        : [
            { role: "system", content: systemPrompt },
            ...trimmedHistory,
            { role: "user", content: userMessage },
          ];

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages,
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0].message.content ?? "{}";
    const parsed = JSON.parse(raw) as ChatResponse;

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("[/api/chat]", error);
    return NextResponse.json(
      { error: "AIとの通信に失敗しました" },
      { status: 500 }
    );
  }
}
