import { useUi } from "@/stores/ui";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import type { Failure } from "./lib/failures";

export interface ErrorNoticeProps {
  failure: Failure;
  onRetry?: () => void;
  className?: string;
}

/** Inline error with an optional retry and, for out-of-credits, a link to the credits panel. */
export function ErrorNotice({ failure, onRetry, className }: ErrorNoticeProps) {
  return (
    <div
      role="alert"
      className={cn("flex flex-wrap items-center gap-3 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-[13px] text-fg", className)}
    >
      <span className="min-w-0 flex-1">{failure.message}</span>
      {failure.outOfCredits && (
        <Button size="sm" variant="primary" onClick={() => useUi.getState().openPanel("credits")}>
          Open credits
        </Button>
      )}
      {onRetry && (
        <Button size="sm" variant="glass" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
