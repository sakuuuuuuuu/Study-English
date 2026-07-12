import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import type { GrammarResponse } from "@/types";

const MAX_SENTENCE_LENGTH = 500;

export async function POST(request: NextRequest) {
  try {
    const { sentence }: { sentence: string } = await request.json();

    if (!sentence?.trim() || sentence.length > MAX_SENTENCE_LENGTH) {
      return NextResponse.json({ error: "無効な文です" }, { status: 400 });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `You are an English grammar teacher for Japanese learners at TOEIC 550-700 level.
When given an English sentence, return a JSON object with:
- "overview": A 1-2 sentence summary of the sentence structure in Japanese (high school level)
- "parts": An array of key phrases, each with:
  - "phrase": the English phrase (exact substring from the sentence)
  - "role": the grammatical role in Japanese (e.g. "主語", "動詞", "理由の節")
  - "explanation": a clear Japanese explanation (2-3 sentences, avoid jargon)

Focus on 3-6 meaningful chunks. Skip trivial words unless they're important.
Return raw JSON only. No markdown.`,
        },
        {
          role: "user",
          content: `Explain the grammar of this sentence:\n"${sentence}"`,
        },
      ],
    });

    const raw = completion.choices[0].message.content ?? "{}";
    const parsed = JSON.parse(raw) as GrammarResponse;

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("[/api/grammar]", error);
    return NextResponse.json(
      { error: "文法解説の取得に失敗しました" },
      { status: 500 }
    );
  }
}
