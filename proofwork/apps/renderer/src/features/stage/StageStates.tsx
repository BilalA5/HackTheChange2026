import { Link } from "react-router";
import { Lock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Feedback";

/** Centred spinner for the first load. */
export function LoadingState({ label = "Loading the stage" }: { label?: string }) {
  return (
    <div className="flex h-full items-center justify-center">
      <Spinner size={22} label={label} />
    </div>
  );
}

/** Error with a retry and a way back to the map. */
export function ErrorState({ message, onRetry, backTo = "/", backLabel = "Back to map" }: { message: string; onRetry?: () => void; backTo?: string; backLabel?: string }) {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div role="alert" className="glass flex max-w-[420px] flex-col items-center gap-4 p-8 text-center">
        <AlertTriangle size={26} strokeWidth={1.75} className="text-warning" aria-hidden="true" />
        <h2 className="font-serif text-[22px] font-medium">Something went wrong</h2>
        <p className="text-[14px] text-fg-muted">{message}</p>
        <div className="flex gap-2">
          {onRetry && (
            <Button variant="primary" size="md" onClick={onRetry}>
              Try again
            </Button>
          )}
          <Link to={backTo} className="inline-flex h-10 items-center rounded-full px-5 text-[14px] text-fg-muted hover:text-fg">
            {backLabel}
          </Link>
        </div>
      </div>
    </div>
  );
}

/** Shown for a stage the learner has not unlocked yet. */
export function LockedState({ backTo }: { backTo: string }) {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="glass flex max-w-[420px] flex-col items-center gap-4 p-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-white/8 text-fg-muted">
          <Lock size={20} strokeWidth={1.75} aria-hidden="true" />
        </div>
        <h2 className="font-serif text-[22px] font-medium">This stage is locked</h2>
        <p className="text-[14px] text-fg-muted">Finish the stage before it to unlock this one.</p>
        <Link to={backTo} className="inline-flex h-10 items-center rounded-full bg-white/10 px-5 text-[14px] text-fg hover:bg-white/15">
          Back to the project
        </Link>
      </div>
    </div>
  );
}
