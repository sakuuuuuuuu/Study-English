import { useState, useRef, useCallback } from "react";

export type RecordingState = "idle" | "recording" | "transcribing";

/**
 * Push-to-talk マイク録音フック。
 * startRecording() を呼ぶと録音開始、stopRecording() で停止 → Whisper で文字起こし → onTranscript を呼ぶ。
 * ref パターンで常に最新のコールバックを使うため、onstop 内でのクロージャ問題を回避する。
 */
export function useAudioRecorder({
  onTranscript,
  onError,
}: {
  onTranscript: (text: string) => void;
  onError: (message: string) => void;
}) {
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // 常に最新のコールバックを参照する
  const onTranscriptRef = useRef(onTranscript);
  const onErrorRef = useRef(onError);
  onTranscriptRef.current = onTranscript;
  onErrorRef.current = onError;

  const startRecording = useCallback(async () => {
    if (recordingState !== "idle") return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        // マイクを解放
        stream.getTracks().forEach((t) => t.stop());

        const blob = new Blob(chunksRef.current, { type: mediaRecorder.mimeType });
        chunksRef.current = [];

        // 短すぎる録音（誤タップ等）は無視
        if (blob.size < 1000) {
          setRecordingState("idle");
          return;
        }

        setRecordingState("transcribing");

        try {
          const formData = new FormData();
          const ext = mediaRecorder.mimeType.includes("ogg") ? "ogg" : "webm";
          formData.append("audio", blob, `recording.${ext}`);

          const res = await fetch("/api/transcribe", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) throw new Error("transcribe failed");

          const { transcript } = (await res.json()) as { transcript?: string };

          if (transcript?.trim()) {
            onTranscriptRef.current(transcript.trim());
          } else {
            onErrorRef.current("音声を認識できませんでした。もう一度お試しください。");
          }
        } catch {
          onErrorRef.current("音声の変換に失敗しました。もう一度お試しください。");
        } finally {
          setRecordingState("idle");
        }
      };

      mediaRecorder.start();
      setRecordingState("recording");
    } catch (err) {
      const isDenied =
        err instanceof DOMException && err.name === "NotAllowedError";
      onErrorRef.current(
        isDenied
          ? "マイクの使用が許可されていません。ブラウザのアドレスバー横の鍵アイコンから許可してください。"
          : "マイクへのアクセスに失敗しました。"
      );
      setRecordingState("idle");
    }
  }, [recordingState]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  return { recordingState, startRecording, stopRecording };
}
