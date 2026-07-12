import { useState, useRef, useCallback } from "react";

export type PlayingState = "idle" | "loading" | "playing";

/**
 * AI返答テキストを /api/speak 経由で TTS 再生するフック。
 *
 * キャッシュ戦略（2層構造）:
 *   pendingRef  — 進行中の fetch Promise（重複リクエストを排除）
 *   blobCacheRef — 解決済みの Blob（即座取得・再生用）
 *
 * play() はキャッシュ済み Blob があれば "loading" 状態をスキップして即再生。
 * prefetch() を呼ぶことで play() より先に fetch を着火できる。
 */
export function useAudioPlayer() {
  const [playingState, setPlayingState] = useState<PlayingState>("idle");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);
  const blobCacheRef = useRef<Map<string, Blob>>(new Map());
  const pendingRef = useRef<Map<string, Promise<Blob>>>(new Map());

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

  /**
   * テキストの Blob を取得する。
   * - 解決済みキャッシュがあれば即 resolve
   * - 進行中 Promise があれば同じものを返す（重複 fetch を防ぐ）
   * - なければ新規 fetch して両キャッシュに登録
   */
  const fetchBlob = useCallback((text: string): Promise<Blob> => {
    const cached = blobCacheRef.current.get(text);
    if (cached) return Promise.resolve(cached);

    const pending = pendingRef.current.get(text);
    if (pending) return pending;

    const promise = fetch("/api/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("TTS failed");
        return res.blob();
      })
      .then((blob) => {
        blobCacheRef.current.set(text, blob);
        pendingRef.current.delete(text);
        return blob;
      })
      .catch((err) => {
        pendingRef.current.delete(text);
        throw err;
      });

    pendingRef.current.set(text, promise);
    return promise;
  }, []);

  /**
   * 音声を再生せずキャッシュだけ温める（fire-and-forget）。
   * AI返答テキストが届いた瞬間に呼ぶことで、ユーザーが操作する前に
   * Blob を取得済みにしておく。
   */
  const prefetch = useCallback(
    (text: string) => {
      fetchBlob(text).catch(() => {
        // prefetch 失敗はサイレント（play() が再試行する）
      });
    },
    [fetchBlob]
  );

  const stop = useCallback(() => {
    cleanupAudio();
    setPlayingState("idle");
  }, []);

  const play = useCallback(
    async (text: string, rate: number = 1) => {
      cleanupAudio();

      // Blob がキャッシュ済みなら "loading" をスキップして即再生
      const isReady = blobCacheRef.current.has(text);
      if (!isReady) setPlayingState("loading");

      try {
        const blob = await fetchBlob(text);

        const url = URL.createObjectURL(blob);
        objectUrlRef.current = url;

        const audio = new Audio(url);
        audioRef.current = audio;
        audio.playbackRate = rate;

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
    },
    [fetchBlob]
  );

  return { playingState, play, prefetch, stop };
}
