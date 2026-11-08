import { useEffect, useRef, useState, type RefObject } from "react";
import { ArrowRight } from "lucide-react";
import type { KickoffSegment, Npc, NoteSection, Objective } from "@pw/shared";
import { api } from "@/lib/api";
import { NOTE_SECTIONS } from "@/components/domain";
import { Button } from "@/components/ui/Button";
import { MonoLabel } from "@/components/ui/Labels";
import { ErrorNotice } from "../ErrorNotice";
import { failureFrom, type Failure } from "../lib/failures";
import { AskPanel } from "./AskPanel";
import { VerdictView } from "./VerdictView";

export interface CheckpointPanelProps {
  objective: Objective;
  segment: KickoffSegment;
  npc: Npc;
  isLast: boolean;
  onObjective(o: Objective): void;
  onNext(): void;
}

/**
 * Checkpoint after a segment: the prompt, questions to the manager, the Meeting Notes editor
 * (only this segment's section is editable) and the note check. Mounted per segment by the parent.
 */
export function CheckpointPanel({ objective, segment, npc, isLast, onObjective, onNext }: CheckpointPanelProps) {
  const section = segment.noteSection;
  const [draft, setDraft] = useState(objective.notes[section] ?? "");
  const [checking, setChecking] = useState(false);
  const [failure, setFailure] = useState<Failure | null>(null);
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const verdict = objective.noteVerdicts[segment.id];
  const verdictRef = useRef<HTMLDivElement>(null);
  // Bring fresh feedback into view: it renders below the notes editor, often under the fold.
  useEffect(() => {
    if (verdict) verdictRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [verdict]);
  const accepted = verdict?.accepted === true;

  const check = async () => {
    const text = draft.trim();
    if (!text || checking) return;
    setChecking(true);
    setFailure(null);
    try {
      if ((objective.notes[section] ?? "") !== draft) {
        const notes: Partial<Record<NoteSection, string>> = { [section]: draft };
        onObjective(await api("PATCH /objectives/:id", { params: { id: objective.id }, body: { notes } }));
      }
      const res = await api("POST /objectives/:id/kickoff/notes-check", {
        params: { id: objective.id },
        body: { segmentId: segment.id, text },
      });
      onObjective(res.objective);
    } catch (e) {
      setFailure(failureFrom(e));
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,5fr)_minmax(0,6fr)] gap-5">
      <div className="flex min-h-0 flex-col gap-4 overflow-y-auto pr-1">
        <section className="paper flex flex-col gap-3 p-6">
          <MonoLabel tone="accent">Checkpoint · {segment.title}</MonoLabel>
          <p className="font-serif text-[20px] leading-snug text-ink">{segment.checkpointPrompt}</p>
          <p className="text-[13px] text-muted">Write your note on the right. Next part unlocks once it is accepted.</p>
        </section>
        <AskPanel objective={objective} segment={segment} npc={npc} onObjective={onObjective} />
      </div>

      <div className="flex min-h-0 flex-col gap-4 overflow-y-auto pr-1">
        <MeetingNotesEditor
          notes={objective.notes}
          activeSection={section}
          draft={draft}
          onDraftChange={setDraft}
          editorRef={editorRef}
          disabled={checking}
        />
        <div className="flex justify-end">
          <Button variant="primary" size="md" loading={checking} disabled={!draft.trim()} onClick={() => void check()}>
            Check my note
          </Button>
        </div>
        {failure && <ErrorNotice failure={failure} onRetry={() => void check()} />}
        {verdict && (
          <div ref={verdictRef} className="scroll-mt-4">
          <VerdictView
            verdict={verdict}
            onEdit={() => {
              editorRef.current?.focus();
            }}
          />
          </div>
        )}
        <div className="flex justify-end">
          <Button
            variant="primary"
            size="lg"
            disabled={!accepted}
            onClick={onNext}
            iconRight={<ArrowRight size={18} strokeWidth={1.75} />}
          >
            {isLast ? "Finish kickoff" : "Next part"}
          </Button>
        </div>
      </div>
    </div>
  );
}

interface MeetingNotesEditorProps {
  notes: Objective["notes"];
  activeSection: NoteSection;
  draft: string;
  onDraftChange(value: string): void;
  editorRef: RefObject<HTMLTextAreaElement | null>;
  disabled: boolean;
}

/** Meeting Notes in the paper style. Only the active section takes input. */
function MeetingNotesEditor({ notes, activeSection, draft, onDraftChange, editorRef, disabled }: MeetingNotesEditorProps) {
  return (
    <section aria-label="Meeting Notes" className="paper flex flex-col gap-5 p-6">
      <h2 className="font-serif text-[22px] font-medium text-ink">Meeting Notes</h2>
      {NOTE_SECTIONS.map((s) => {
        const active = s.id === activeSection;
        const fieldId = `checkpoint-note-${s.id}`;
        return (
          <div key={s.id} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <label htmlFor={fieldId} className="font-serif text-[17px] font-semibold text-ink">
                {s.label}
              </label>
              {!active && <MonoLabel className="text-muted">Unlocks at its part</MonoLabel>}
            </div>
            <textarea
              id={fieldId}
              ref={active ? editorRef : undefined}
              value={active ? draft : (notes[s.id] ?? "")}
              placeholder={s.placeholder}
              readOnly={!active}
              disabled={active && disabled}
              aria-readonly={!active}
              onChange={active ? (e) => onDraftChange(e.target.value) : undefined}
              rows={active ? 5 : 2}
              className={
                active
                  ? "w-full resize-y rounded-xl border border-ink/15 bg-white px-3 py-2 text-[14px] leading-relaxed text-ink placeholder:text-muted/80 focus:border-accent focus:outline-none"
                  : "w-full resize-none rounded-xl border border-transparent bg-paper/70 px-3 py-2 text-[14px] leading-relaxed text-muted"
              }
            />
          </div>
        );
      })}
    </section>
  );
}
