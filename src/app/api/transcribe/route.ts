import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audio = formData.get("audio") as File | null;

    if (!audio || audio.size === 0) {
      return NextResponse.json({ error: "音声データがありません" }, { status: 400 });
    }

    const transcription = await openai.audio.transcriptions.create({
      file: audio,
      model: "whisper-1",
      language: "en",
    });

    return NextResponse.json({ transcript: transcription.text });
  } catch (error) {
    console.error("[/api/transcribe]", error);
    return NextResponse.json({ error: "音声の変換に失敗しました" }, { status: 500 });
  }
}
