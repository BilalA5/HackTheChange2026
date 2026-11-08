import { MonoLabel } from "@/components/ui/Labels";

export interface CaptionBarProps {
  speaker: string;
  /** The sentence being spoken right now. */
  text: string;
}

/** Live caption for the manager's current sentence. */
export function CaptionBar({ speaker, text }: CaptionBarProps) {
  return (
    <div aria-live="polite" className="paper flex min-h-[64px] items-center gap-4 px-5 py-3">
      <MonoLabel tone="accent" className="w-24 shrink-0 truncate">
        {speaker}
      </MonoLabel>
      <p className="min-w-0 text-[15px] leading-snug text-ink">{text}</p>
    </div>
  );
}
