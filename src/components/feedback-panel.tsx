import type { Feedback } from "@/types";

interface FeedbackPanelProps {
  feedback: Feedback;
}

export function FeedbackPanel({ feedback }: FeedbackPanelProps) {
  const { hasError, corrections, naturalAlternative, simplerExpression } = feedback;

  if (!hasError && !naturalAlternative && !simplerExpression) {
    return (
      <div className="flex items-center gap-1.5 text-sm text-emerald-600 dark:text-emerald-400 mt-1.5 px-1">
        <span>✅</span>
        <span>自然な英語でした！</span>
      </div>
    );
  }

  return (
    <div className="mt-1.5 p-3 rounded-xl bg-muted/70 border border-border/60 text-sm space-y-2.5">
      {corrections.map((c, i) => (
        <div key={i} className="space-y-0.5">
          <div className="flex items-start gap-1.5">
            <span className="shrink-0">⚠️</span>
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
  );
}
