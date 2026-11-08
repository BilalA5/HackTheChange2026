import { Check } from "lucide-react";
import type { NoteVerdict } from "@pw/shared";
import { XpChip } from "@/components/domain";
import { MonoLabel } from "@/components/ui/Labels";

export interface VerdictViewProps {
  verdict: NoteVerdict;
  onEdit(): void;
}

/** Result of the note check: accepted (XP held) or the missing points to add. */
export function VerdictView({ verdict, onEdit }: VerdictViewProps) {
  if (verdict.accepted) {
    return (
      <section role="status" aria-label="Note verdict" className="paper flex flex-col gap-4 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-2 font-serif text-[20px] font-medium text-ink">
            <span className="flex size-7 items-center justify-center rounded-full bg-success/20 text-success">
              <Check size={16} strokeWidth={2.25} aria-hidden="true" />
            </span>
            Note accepted
          </span>
          <span className="flex items-center gap-2">
            <XpChip amount={verdict.xp} held />
            <MonoLabel className="text-muted">held</MonoLabel>
          </span>
        </div>
        {verdict.feedback && <p className="text-[14px] leading-relaxed text-ink/85">{verdict.feedback}</p>}
        <PointChips label="Covered" items={verdict.covered} tone="success" />
      </section>
    );
  }

  return (
    <section role="status" aria-label="Note verdict" className="paper flex flex-col gap-4 p-6">
      <h3 className="font-serif text-[20px] font-medium text-ink">Not accepted yet</h3>
      {verdict.feedback && <p className="text-[14px] leading-relaxed text-ink/85">{verdict.feedback}</p>}
      <PointChips label="Missing" items={verdict.missing} tone="warning" />
      <PointChips label="Covered" items={verdict.covered} tone="success" />
      <div>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-9 items-center rounded-full border border-ink/15 px-4 text-[13px] font-medium text-ink hover:bg-ink/5"
        >
          Edit and re-check
        </button>
      </div>
    </section>
  );
}

function PointChips({ label, items, tone }: { label: string; items: string[]; tone: "success" | "warning" }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-col gap-2">
      <MonoLabel className="text-muted">{label}</MonoLabel>
      <div className="flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className={
              tone === "success"
                ? "rounded-full bg-success/15 px-3 py-1 text-[12.5px] text-success"
                : "rounded-full bg-warning/15 px-3 py-1 text-[12.5px] text-warning"
            }
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
