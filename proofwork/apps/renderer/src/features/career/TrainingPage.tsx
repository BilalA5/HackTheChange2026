import { useSearchParams, useParams, Link } from "react-router";
import { BookOpen } from "lucide-react";
import { Button, EmptyState, GlassCard, Skeleton } from "@/components/ui";
import { isTrainingKind } from "./careerHelpers";
import { useTrainingLibrary } from "./useTrainingLibrary";
import { TrainingHub } from "./TrainingHub";
import { TrainingShelf } from "./TrainingShelf";
import { TrainingPlayer } from "./TrainingPlayer";

/** /training (hub), /training/:kind (shelf) and /training/:kind?play=<id> (full-height reader). */
export default function TrainingPage() {
  const { kind } = useParams();
  const [params, setParams] = useSearchParams();
  const library = useTrainingLibrary();
  const playId = params.get("play");

  if (kind !== undefined && !isTrainingKind(kind)) {
    return (
      <div className="p-8">
        <EmptyState
          icon={<BookOpen size={20} />}
          title="No such training section"
          body="Pick Skills, Mindset or Communication from the training hub."
          action={<Link to="/training"><Button variant="glass">Back to training</Button></Link>}
        />
      </div>
    );
  }

  if (library.error && !library.trainings) {
    return (
      <div className="p-8">
        <GlassCard className="mx-auto max-w-[480px] text-center">
          <p className="font-serif text-[20px] text-fg">Training could not load</p>
          <p className="mt-2 text-[14px] text-fg-muted">{library.error.message}</p>
          <Button className="mt-4" variant="glass" onClick={library.reload}>Try again</Button>
        </GlassCard>
      </div>
    );
  }

  if (library.loading && !library.trainings) {
    return (
      <div className="grid gap-4 p-8" aria-busy="true" aria-label="Loading training">
        <Skeleton className="h-[220px]" />
        <Skeleton className="h-[220px]" />
      </div>
    );
  }

  if (kind === undefined) return <TrainingHub library={library} />;
  const shelfKind = isTrainingKind(kind) ? kind : undefined;

  const training = playId ? library.trainings?.find((t) => t.id === playId) : undefined;
  if (playId && training) {
    return (
      <TrainingPlayer
        key={training.id}
        training={training}
        initial={library.progress[training.id]}
        saveProgress={library.saveProgress}
        onExit={() => setParams({}, { replace: false })}
        backTo={`/training/${kind}`}
      />
    );
  }

  return shelfKind ? <TrainingShelf kind={shelfKind} library={library} onPlay={(id) => setParams({ play: id })} /> : null;
}
