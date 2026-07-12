import type { Feedback } from "@/types";

interface FeedbackPanelProps {
  feedback: Feedback;
}

export function FeedbackPanel({ feedback }: FeedbackPanelProps) {
  const { hasError, corrections, naturalAlternative, simplerExpression } = feedback;

  const hasContent = hasError || naturalAlternative || simplerExpression;

  if (!hasContent) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-700 dark:text-emerald-400">
        <span>✅</span>
        <span className="font-medium">自然な英語でした！</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-800 overflow-hidden text-sm">
      {/* ヘッダー */}
      <div className="px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-800">
        <span className="text-xs font-medium text-amber-700 dark:text-amber-400 tracking-wide">
          📝 あなたの英語へのフィードバック
        </span>
      </div>

      {/* 本文 */}
      <div className="px-3 py-2.5 space-y-2.5 bg-background">
        {corrections.map((c, i) => (
          <div key={i} className="space-y-0.5">
            <div className="flex items-start gap-1.5">
              <span className="shrink-0 text-amber-500">⚠️</span>
              <div>
                <span className="line-through text-muted-foreground">{c.original}</span>
                <span className="text-muted-foreground"> → </span>
                <span className="font-semibold text-foreground">{c.fixed}</span>
              </div>
            </div>
            <p className="ml-6 text-muted-foreground text-xs">{c.explanation}</p>
          </div>
        ))}

        {naturalAlternative && (
          <div className="flex items-start gap-1.5">
            <span className="shrink-0">💡</span>
            <p className="text-muted-foreground">{naturalAlternative}</p>
          </div>
        )}

        {simplerExpression && (
          <div className="flex items-start gap-1.5">
            <span className="shrink-0">📝</span>
            <p className="text-muted-foreground">{simplerExpression}</p>
          </div>
        )}
      </div>
    </div>
  );
}
