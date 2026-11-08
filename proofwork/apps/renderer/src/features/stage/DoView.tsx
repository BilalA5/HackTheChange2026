import { Layers, MonitorUp, PictureInPicture2 } from "lucide-react";
import type { Evaluation, Npc, Objective, Stage, StageProgress } from "@pw/shared";
import { pw } from "@/lib/bridge";
import type { StageOverlayPayload } from "@/lib/overlayChannels";
import { toast } from "@/components/ui/Toaster";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { CoworkPanel } from "./CoworkPanel";
import { SubmissionCard } from "./SubmissionCard";
import type { ChecklistItem } from "./helpers";

export interface DoViewProps {
  objectiveId: string;
  stage: Stage;
  progress: StageProgress;
  npc: Npc;
  learnerName: string;
  checklist: ChecklistItem[];
  onToggleItem(id: string): void;
  overlayPayload: StageOverlayPayload;
  onSubmitted(objective: Objective, evaluation: Evaluation): void;
  onError(e: unknown): void;
  onOpenCredits(): void;
}

/** Do mode: the checklist, desktop companion buttons, the AI co-worker and the submission. */
export function DoView(props: DoViewProps) {
  const { objectiveId, stage, progress, npc, learnerName, checklist, onToggleItem, overlayPayload, onSubmitted, onError, onOpenCredits } = props;
  // Overlays work in both builds: real windows in Electron, simulated in-page frames in the web build.
  const desktop = true;

  const popOut = async () => {
    try {
      await pw.overlay.open("pip", overlayPayload);
    } catch {
      toast({ title: "Could not open the companion", tone: "warning" });
    }
  };

  const coworkOnScreen = async () => {
    try {
      await pw.overlay.open("island", overlayPayload);
      await pw.overlay.open("cowork", overlayPayload);
      pw.overlay.broadcast("cowork:command", { cmd: "start" });
    } catch {
      toast({ title: "Could not start co-working on your screen", tone: "warning" });
    }
  };

  return (
    <div className="flex flex-col gap-5 p-5">
      <header className="flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-1">
          <h2 className="font-serif text-[22px] font-medium">Work in your own tools</h2>
          <p className="mt-1 text-[13px] text-fg-muted">Build the work where you normally would. Tick things off as you go.</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            variant="glass"
            size="sm"
            disabled={!desktop}
            title={desktop ? undefined : "Available in the desktop app"}
            icon={<PictureInPicture2 size={14} strokeWidth={1.75} aria-hidden="true" />}
            onClick={() => void popOut()}
          >
            Pop out companion
          </Button>
          <Button
            variant="glass"
            size="sm"
            disabled={!desktop}
            title={desktop ? undefined : "Available in the desktop app"}
            icon={<MonitorUp size={14} strokeWidth={1.75} aria-hidden="true" />}
            onClick={() => void coworkOnScreen()}
          >
            Co-work on my screen
          </Button>
        </div>
      </header>

      <section aria-label="Agreed requirements checklist" className="glass p-4">
        {checklist.length > 0 ? (
          <ul className="grid gap-1 sm:grid-cols-2">
            {checklist.map((item) => (
              <li key={item.id}>
                <label
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-xl px-3 py-2 text-[14px] transition-colors hover:bg-white/5",
                    item.done && "text-fg-muted line-through",
                  )}
                >
                  <input type="checkbox" checked={item.done} onChange={() => onToggleItem(item.id)} className="mt-0.5 size-4 accent-accent" />
                  <span>{item.text}</span>
                </label>
              </li>
            ))}
          </ul>
        ) : (
          <p className="flex items-center gap-2 text-[14px] text-fg-muted">
            <Layers size={15} strokeWidth={1.75} aria-hidden="true" />
            No requirements agreed yet. Agree the plan in Plan mode to see your checklist here.
          </p>
        )}
      </section>

      <CoworkPanel objectiveId={objectiveId} stageId={stage.id} learnerName={learnerName} npc={npc} onOpenCredits={onOpenCredits} />

      <SubmissionCard objectiveId={objectiveId} stage={stage} progress={progress} onSubmitted={onSubmitted} onError={onError} />
    </div>
  );
}
