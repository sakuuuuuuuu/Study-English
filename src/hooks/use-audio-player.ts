import { useState, useRef, useCallback } from "react";

export type PlayingState = "idle" | "loading" | "playing";

/**
 * AI返答テキストを /api/speak 経由で TTS 再生するフック。
 * stop() を呼ぶことでユーザーが任意のタイミングで割り込める。
 */
export function useAudioPlayer() {
  const [playingState, setPlayingState] = useState<PlayingState>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const cleanupAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onplay = null;
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
  };

  const stop = useCallback(() => {
    cleanupAudio();
    setPlayingState("idle");
  }, []);

  const play = useCallback(async (text: string) => {
    cleanupAudio();
    setPlayingState("loading");

    try {
      const res = await fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) throw new Error("TTS failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      objectUrlRef.current = url;

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onplay = () => setPlayingState("playing");
      audio.onended = () => {
        cleanupAudio();
        setPlayingState("idle");
      };
      audio.onerror = () => {
        cleanupAudio();
        setPlayingState("idle");
      };

      await audio.play();
    } catch {
      cleanupAudio();
      setPlayingState("idle");
      // TTS失敗はサイレントに処理（会話自体は継続できるため）
    }
  }, []);

  return { playingState, play, stop };
}
