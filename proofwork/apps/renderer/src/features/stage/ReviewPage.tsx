import { useNavigate, useParams } from "react-router";
import { ArrowLeft, Briefcase, Clock, Sparkles } from "lucide-react";
import { useApi } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { NotesCard } from "@/components/domain/NotesCard";
import { ErrorState, LoadingState } from "./StageStates";
import { OverallCard, ReviewHero, StageTimeline, StatCard } from "./ReviewParts";
import { formatDuration } from "./helpers";

/** Project review: /objective/:objectiveId/review. Summary of a whole project run, from the objective and its scenario. */
export default function ReviewPage() {
  const { objectiveId = "" } = useParams();
  const navigate = useNavigate();
  const objQ = useApi("GET /objectives/:id", { params: { id: objectiveId } }, [objectiveId]);
  const objective = objQ.data;
  const scenarioId = objective?.scenarioId ?? null;
  const scenQ = useApi("GET /scenarios/:id", scenarioId ? { params: { id: scenarioId } } : null, [scenarioId]);
  const scenario = scenQ.data;

  if (objQ.error && !objective) return <ErrorState message={objQ.error.message} onRetry={objQ.reload} />;
  if (scenQ.error && !scenario) return <ErrorState message={scenQ.error.message} onRetry={scenQ.reload} />;
  if (!objective || !scenario) return <LoadingState label="Loading the review" />;

  const completed = objective.status === "completed";
  const stages = [...scenario.stages].sort((a, b) => a.order - b.order);
  const presentation = stages.find((s) => s.kind === "presentation");
  const hasPresentationFeedback = presentation ? !!objective.stages[presentation.id]?.evaluation : false;

  return (
    <div className="theme-paper bg-paper h-full overflow-y-auto">
      <div className="mx-auto flex max-w-[880px] flex-col gap-6 p-8">
        <header className="flex items-center gap-3">
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} strokeWidth={1.75} aria-hidden="true" />} onClick={() => navigate("/")}>
            Back to map
          </Button>
        </header>

        <ReviewHero company={scenario.company} title={scenario.title} completed={completed} tagline={scenario.company.tagline} />

        <div className="grid gap-4 md:grid-cols-2">
          <OverallCard performance={objective.performance} />
          <StatCard label="Total time">
            <span className="inline-flex items-center gap-2 font-serif text-[24px] text-ink">
              <Clock size={18} strokeWidth={1.75} className="text-muted" aria-hidden="true" />
              {formatDuration(objective.timeSpentSec)}
            </span>
          </StatCard>
          <StatCard label="XP earned">
            <span className="inline-flex items-center gap-2 font-serif text-[24px] text-ink">
              <Sparkles size={18} strokeWidth={1.75} className="text-xp" aria-hidden="true" />
              {objective.xpEarned} XP
            </span>
            {objective.xpHeld > 0 && <span className="text-[12px] text-muted">{objective.xpHeld} XP held until the proof of understanding is passed</span>}
          </StatCard>
        </div>

        <StageTimeline stages={stages} progress={objective.stages} />

        <NotesCard notes={objective.notes} readOnly title="Meeting notes" />

        <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-ink/10 pt-6">
          {hasPresentationFeedback && (
            <Button variant="glass" size="md" icon={<Briefcase size={15} strokeWidth={1.75} aria-hidden="true" />} onClick={() => navigate(`/objective/${objectiveId}/feedback`)}>
              Watch presentation feedback
            </Button>
          )}
          <Button variant="glass" size="md" onClick={() => navigate("/portfolio")}>
            View portfolio
          </Button>
          <Button variant="primary" size="md" onClick={() => navigate("/")}>
            Back to map
          </Button>
        </footer>
      </div>
    </div>
  );
}
