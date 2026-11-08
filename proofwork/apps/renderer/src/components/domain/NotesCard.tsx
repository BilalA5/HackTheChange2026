import type { NoteSection } from "@pw/shared";
import { cn } from "@/lib/cn";
import { Markdown } from "../ui/Markdown";

export const NOTE_SECTIONS: { id: NoteSection; label: string; placeholder: string }[] = [
  { id: "problem", label: "Problem", placeholder: "What problem are we solving, and for whom?" },
  { id: "outcome", label: "Outcome", placeholder: "What does success look like? How will we measure it?" },
  { id: "process", label: "Process", placeholder: "How will the work be done, and in what order?" },
];

export interface NotesCardProps {
  notes: Partial<Record<NoteSection, string>>;
  /** Required for the editable variant. */
  onChange?(section: NoteSection, value: string): void;
  /** Read-only renders the notes as Markdown. */
  readOnly?: boolean;
  title?: string;
  className?: string;
}

/** "Meeting Notes" paper card with Problem / Outcome / Process sections in Fraunces. */
export function NotesCard({ notes, onChange, readOnly = false, title = "Meeting Notes", className }: NotesCardProps) {
  const editable = !readOnly && onChange !== undefined;
  return (
    <section aria-label={title} className={cn("paper theme-paper flex flex-col gap-5 p-6", className)}>
      <h2 className="font-serif text-[22px] font-medium text-ink">{title}</h2>
      {NOTE_SECTIONS.map((s) => {
        const value = notes[s.id] ?? "";
        const fieldId = `note-${s.id}`;
        return (
          <div key={s.id} className="flex flex-col gap-1.5">
            <h3 id={`${fieldId}-label`} className="font-serif text-[17px] font-semibold text-ink">
              {s.label}
            </h3>
            {editable ? (
              <textarea
                id={fieldId}
                aria-labelledby={`${fieldId}-label`}
                value={value}
                placeholder={s.placeholder}
                onChange={(e) => onChange?.(s.id, e.target.value)}
                rows={3}
                className="w-full resize-y rounded-xl border border-ink/10 bg-paper/60 px-3 py-2 text-[14px] leading-relaxed text-ink placeholder:text-muted/80 focus:bg-white"
              />
            ) : value ? (
              <Markdown source={value} tone="paper" />
            ) : (
              <p className="text-[14px] text-muted italic">Nothing written yet.</p>
            )}
          </div>
        );
      })}
    </section>
  );
}
