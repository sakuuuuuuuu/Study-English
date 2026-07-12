import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";

export async function POST(request: NextRequest) {
  try {
    const { text } = (await request.json()) as { text?: string };

    if (!text?.trim()) {
      return NextResponse.json({ error: "テキストがありません" }, { status: 400 });
    }

    const speech = await openai.audio.speech.create({
      model: "tts-1",
      voice: "nova",
      input: text,
    });

    const arrayBuffer = await speech.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("[/api/speak]", error);
    return NextResponse.json({ error: "音声の生成に失敗しました" }, { status: 500 });
  }
}
