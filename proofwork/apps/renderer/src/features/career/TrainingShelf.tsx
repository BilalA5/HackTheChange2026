import { useMemo, useState } from "react";
import { Link } from "react-router";
import { Plus, Check, Clock } from "lucide-react";
import type { Training, TrainingKind } from "@pw/shared";
import { Button, EmptyState, GlassCard, Input, Modal, Pill, ProgressBar, Skeleton, toast } from "@/components/ui";
import { cn } from "@/lib/cn";
import { errorMessage } from "@/lib/errors";
import { filterTrainings, TRAINING_KIND_LABEL, trainingProgressRatio, trainingTags, TRAINING_KIND_NOUN } from "./careerHelpers";
import type { TrainingLibrary } from "./useTrainingLibrary";

interface ShelfProps {
  kind: TrainingKind;
  library: TrainingLibrary;
  onPlay: (trainingId: string) => void;
}

export function TrainingShelf({ kind, library, onPlay }: ShelfProps) {
  const label = TRAINING_KIND_LABEL[kind];
  const all = library.trainings ?? [];
  const [query, setQuery] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [catalogOpen, setCatalogOpen] = useState(false);

  const ofKind = useMemo(() => all.filter((t) => t.kind === kind), [all, kind]);
  const kindTags = useMemo(() => trainingTags(all, kind), [all, kind]);
  const matching = useMemo(() => filterTrainings(all, { kind, query, tags }), [all, kind, query, tags]);
  const inLibrary = matching.filter((t) => library.library.has(t.id));
  const recommended = matching.filter((t) => library.recommended.includes(t.id));

  const toggleTag = (tag: string) => setTags((cur) => (cur.includes(tag) ? cur.filter((x) => x !== tag) : [...cur, tag]));

  return (
    <div className="flex flex-col gap-6 p-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <Link to="/training" className="font-mono text-[11px] uppercase tracking-[0.08em] text-fg-muted hover:text-fg">
            ← Training
          </Link>
          <h1 className="mt-1 font-serif text-[32px] font-medium text-fg">{label}</h1>
        </div>
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setCatalogOpen(true)}>
          Add {TRAINING_KIND_NOUN[kind]}
        </Button>
      </header>

      <div className="flex flex-col gap-3">
        <Input
          type="search"
          aria-label={`Search ${label.toLowerCase()} trainings`}
          placeholder="Search by title, summary or tag"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-[480px]"
        />
        {kindTags.length > 0 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by tag">
            {kindTags.map((tag) => {
              const on = tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleTag(tag)}
                  className={cn(
                    "rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors focus-visible:outline-2 focus-visible:outline-accent",
                    on ? "border-accent bg-accent/20 text-fg" : "border-line bg-white/5 text-fg-muted hover:text-fg",
                  )}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {library.loading && !library.trainings ? (
        <div className="grid gap-4" aria-busy="true">
          <Skeleton className="h-[160px]" />
        </div>
      ) : (
        <>
          {recommended.length > 0 && (
            <section aria-labelledby="rec-heading" className="flex flex-col gap-3">
              <h2 id="rec-heading" className="font-mono text-[11px] uppercase tracking-[0.08em] text-fg-muted">
                Recommended for you
              </h2>
              <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
                {recommended.map((t) => (
                  <TrainingCard key={t.id} training={t} library={library} onPlay={onPlay} />
                ))}
              </div>
            </section>
          )}

          <section aria-labelledby="lib-heading" className="flex flex-col gap-3">
            <h2 id="lib-heading" className="font-mono text-[11px] uppercase tracking-[0.08em] text-fg-muted">
              Your trainings
            </h2>
            {library.error && !library.trainings && <p className="text-[13px] text-danger">{library.error.message}</p>}
            {ofKind.filter((t) => library.library.has(t.id)).length === 0 ? (
              <EmptyState
                icon={<Plus size={18} />}
                title={`No ${label.toLowerCase()} trainings yet`}
                body="Add a training from the catalog to start a lesson track."
                action={
                  <Button variant="primary" onClick={() => setCatalogOpen(true)}>
                    Add {TRAINING_KIND_NOUN[kind]}
                  </Button>
                }
              />
            ) : inLibrary.length === 0 ? (
              <EmptyState title="No trainings match" body="Clear the search or tag filters to see the rest of your library." />
            ) : (
              <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
                {inLibrary.map((t) => (
                  <TrainingCard key={t.id} training={t} library={library} onPlay={onPlay} />
                ))}
              </div>
            )}
          </section>
        </>
      )}

      <TrainingCatalog
        open={catalogOpen}
        onClose={() => setCatalogOpen(false)}
        kind={kind}
        label={label}
        trainings={ofKind}
        library={library}
      />
    </div>
  );
}

function TrainingCard({ training, library, onPlay }: { training: Training; library: TrainingLibrary; onPlay: (id: string) => void }) {
  const owned = library.library.has(training.id);
  const ratio = trainingProgressRatio(training.lessons.length, library.progress[training.id]);
  const done = library.progress[training.id]?.completed === true;
  return (
    <GlassCard className="flex flex-col gap-3 !p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-serif text-[18px] font-medium leading-snug text-fg">{training.title}</h3>
        <span className="flex shrink-0 items-center gap-1 font-mono text-[11px] text-fg-muted">
          <Clock size={12} aria-hidden="true" />
          {training.minutes} min
        </span>
      </div>
      <p className="line-clamp-3 text-[13px] text-fg-muted">{training.summary}</p>
      <div className="flex flex-wrap gap-1.5">
        {training.tags.map((tag) => (
          <Pill key={tag} tone="neutral">
            {tag}
          </Pill>
        ))}
      </div>
      <div className="mt-auto flex flex-col gap-2 pt-2">
        <div className="flex items-center justify-between gap-2 font-mono text-[11px] text-fg-muted">
          <span>{done ? "Complete" : ratio > 0 ? `${Math.round(ratio * 100)}%` : "Not started"}</span>
        </div>
        <ProgressBar value={ratio} tone={done ? "success" : "accent"} label={`${training.title} progress`} />
        <div className="flex gap-2 pt-1">
          {owned ? (
            <Button size="sm" variant="primary" onClick={() => onPlay(training.id)} aria-label={`${done ? "Review" : ratio > 0 ? "Continue" : "Start"} ${training.title}`}>
              {done ? "Review" : ratio > 0 ? "Continue" : "Start"}
            </Button>
          ) : (
            <Button size="sm" variant="glass" icon={<Plus size={14} />} onClick={() => void toggleLibrary(library, training, false)}>
              Add to library
            </Button>
          )}
        </div>
      </div>
    </GlassCard>
  );
}

async function toggleLibrary(library: TrainingLibrary, training: Training, inLibrary: boolean): Promise<void> {
  try {
    await library.setInLibrary(training.id, inLibrary);
    toast({ title: inLibrary ? "Removed from library" : "Added to library", body: training.title, tone: "success" });
  } catch (e) {
    toast({ title: "Could not update your library", body: errorMessage(e), tone: "danger" });
  }
}

function TrainingCatalog({
  open,
  onClose,
  kind,
  label,
  trainings,
  library,
}: {
  open: boolean;
  onClose: () => void;
  kind: TrainingKind;
  label: string;
  trainings: Training[];
  library: TrainingLibrary;
}) {
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());

  const toggle = async (training: Training) => {
    const next = library.library.has(training.id);
    setPending((p) => new Set(p).add(training.id));
    try {
      await library.setInLibrary(training.id, next);
    } catch (e) {
      toast({ title: "Could not update your library", body: errorMessage(e), tone: "danger" });
    } finally {
      setPending((p) => {
        const copy = new Set(p);
        copy.delete(training.id);
        return copy;
      });
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={`Add ${TRAINING_KIND_NOUN[kind]}`} widthClass="max-w-[640px]">
      <p className="mb-4 text-[14px] text-fg-muted">Toggle the {kind} trainings you want in your library.</p>
      {trainings.length === 0 ? (
        <p className="text-[14px] text-fg-muted">No {TRAINING_KIND_NOUN[kind]} trainings are available yet.</p>
      ) : (
        <ul className="flex max-h-[60vh] flex-col gap-3 overflow-y-auto pr-1">
          {trainings.map((t) => {
            const owned = library.library.has(t.id);
            const busy = pending.has(t.id);
            return (
              <li key={t.id} className="flex items-start justify-between gap-4 rounded-2xl border border-line bg-white/5 p-4">
                <div className="min-w-0">
                  <p className="font-medium text-fg">{t.title}</p>
                  <p className="mt-1 text-[13px] text-fg-muted">{t.summary}</p>
                  <p className="mt-1 font-mono text-[11px] text-fg-muted">{t.minutes} min</p>
                </div>
                <Button
                  size="sm"
                  variant={owned ? "glass" : "primary"}
                  loading={busy}
                  aria-pressed={owned}
                  aria-label={`${owned ? "Remove" : "Add"} ${t.title}`}
                  icon={owned ? <Check size={14} /> : <Plus size={14} />}
                  onClick={() => void toggle(t)}
                  className="shrink-0"
                >
                  {owned ? "Added" : "Add"}
                </Button>
              </li>
            );
          })}
        </ul>
      )}
    </Modal>
  );
}
