import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { buildSystemPrompt, buildStarterMessage } from "@/lib/prompts";
import type { ChatResponse } from "@/types";

type ApiMessage = { role: "user" | "assistant"; content: string };

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userMessage,
      topicLabel,
      starterPrompt,
      history,
    }: {
      userMessage: string;
      topicLabel: string;
      starterPrompt: string;
      history: ApiMessage[];
    } = body;

    const systemPrompt = buildSystemPrompt(topicLabel);

    const isStarter = !userMessage && history.length === 0;

    const messages: { role: "system" | "user" | "assistant"; content: string }[] =
      isStarter
        ? [
            { role: "system", content: systemPrompt },
            { role: "user", content: buildStarterMessage(topicLabel, starterPrompt) },
          ]
        : [
            { role: "system", content: systemPrompt },
            ...history,
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
