import { useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ArrowLeft } from "lucide-react";
import { RUBRIC_LEVEL_LABEL, type Evaluation } from "@pw/shared";
import { Button, EmptyState, MonoLabel, PaperCard, Spinner } from "@/components/ui";
import { RubricView, RUBRIC_LEVEL_TONE, XpChip } from "@/components/domain";
import { cn } from "@/lib/cn";
import { useApi } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { useCredits } from "@/stores/credits";
import { useProgress } from "@/stores/progress";
import { readRecordingUrl } from "./storage";

/** Feedback after a presentation: playback, the rubric, summary, strengths, improvements and XP. */
export default function PresentationFeedbackPage() {
  const { objectiveId = "" } = useParams();
  const navigate = useNavigate();

  const objective = useApi("GET /objectives/:id", objectiveId ? { params: { id: objectiveId } } : null, [objectiveId]);
  const scenarioId = objective.data?.scenarioId;
  const scenario = useApi("GET /scenarios/:id", scenarioId ? { params: { id: scenarioId } } : null, [scenarioId]);

  const recordingUrl = useMemo(() => (objectiveId ? readRecordingUrl(objectiveId) : null), [objectiveId]);

  useEffect(() => {
    void useProgress.getState().refresh();
    void useCredits.getState().refresh();
  }, []);

  const presentationStage = scenario.data?.stages.find((s) => s.kind === "presentation") ?? null;
  const evaluation: Evaluation | null = presentationStage ? (objective.data?.stages[presentationStage.id]?.evaluation ?? null) : null;

  if (objective.error || scenario.error) {
    return (
      <div className="theme-paper paper-page grid h-full place-items-center p-8">
        <EmptyState
          title="Could not load your feedback"
          body={errorMessage(objective.error ?? scenario.error)}
          action={
            <Button
              variant="primary"
              onClick={() => {
                objective.reload();
                scenario.reload();
              }}
            >
              Retry
            </Button>
          }
        />
      </div>
    );
  }

  if (!objective.data || !scenario.data) {
    return (
      <div className="theme-paper paper-page grid h-full place-items-center">
        <Spinner size={22} label="Loading feedback" />
      </div>
    );
  }

  if (!presentationStage || !evaluation) {
    const presentHref = presentationStage ? `/objective/${objectiveId}/stage/${presentationStage.id}/present` : `/objective/${objectiveId}`;
    return (
      <div className="theme-paper paper-page grid h-full place-items-center p-8">
        <EmptyState
          title="No presentation feedback yet"
          body={`${scenario.data.npc.name} has not seen your presentation for this project.`}
          action={
            <Link to={presentHref} className="rounded-full bg-accent px-5 py-2.5 text-[14px] font-medium text-white hover:bg-accent-hover">
              Present to {scenario.data.npc.name}
            </Link>
          }
        />
      </div>
    );
  }

  const completed = objective.data.status === "completed";
  const passedLabel = evaluation.passed ? "Passed" : "Keep practising";

  return (
    <div className="theme-paper paper-page flex h-full min-h-0 flex-col text-ink">
      <header className="flex items-center gap-4 px-8 pt-6 pb-4">
        <Button variant="ghost" size="sm" icon={<ArrowLeft size={15} strokeWidth={1.75} />} onClick={() => navigate(`/objective/${objectiveId}`)}>
          Back
        </Button>
        <div className="min-w-0">
          <MonoLabel tone="accent">Presentation feedback</MonoLabel>
          <h1 className="truncate font-serif text-[28px] leading-tight">{scenario.data.title}</h1>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-6 px-8 pb-6">
        <section aria-label="Result and playback" className="flex min-h-0 flex-col gap-4 overflow-y-auto">
          {completed && (
            <PaperCard className="flex flex-col gap-3 p-6">
              <MonoLabel tone="xp">Project complete</MonoLabel>
              <p className="font-serif text-[24px] leading-snug">
                You finished {scenario.data.title}.
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button variant="primary" onClick={() => navigate(`/objective/${objectiveId}/review`)}>
                  Review project
                </Button>
                <Button variant="light" onClick={() => navigate("/")}>
                  Back to map
                </Button>
                <Button variant="light" onClick={() => navigate("/portfolio")}>
                  Portfolio
                </Button>
              </div>
            </PaperCard>
          )}

          <PaperCard className="flex flex-col gap-4 p-6">
            <div className="flex flex-wrap items-center gap-3">
              <span className={cn("rounded-full px-3 py-1 text-[13px] font-medium", RUBRIC_LEVEL_TONE[evaluation.overall])}>
                {RUBRIC_LEVEL_LABEL[evaluation.overall]}
              </span>
              <span className="text-[13px] text-muted">{passedLabel}</span>
              <span className="ml-auto">
                <XpChip amount={evaluation.xp} />
              </span>
            </div>
            {recordingUrl ? (
              <video
                key={recordingUrl}
                src={recordingUrl}
                controls
                playsInline
                aria-label="Your presentation recording"
                className="aspect-video w-full rounded-card bg-black"
              />
            ) : (
              <p className="text-[13px] text-muted">
                The recording is not available in this tab. Your feedback is still saved.
              </p>
            )}
          </PaperCard>
        </section>

        <section aria-label="Rubric and notes" className="flex min-h-0 flex-col gap-4 overflow-y-auto">
          <PaperCard className="p-6">
            <RubricView rubric={evaluation.rubric} variant="full" />
          </PaperCard>

          <PaperCard className="flex flex-col gap-2 p-6">
            <MonoLabel>Summary</MonoLabel>
            <p className="text-[15px] leading-relaxed">{evaluation.summary}</p>
          </PaperCard>

          <div className="grid grid-cols-2 gap-4">
            <PaperCard className="flex flex-col gap-2 p-5">
              <MonoLabel tone="success">Strengths</MonoLabel>
              <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[14px] leading-snug">
                {evaluation.strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </PaperCard>
            <PaperCard className="flex flex-col gap-2 p-5">
              <MonoLabel tone="warning">Improvements</MonoLabel>
              <ul className="flex list-disc flex-col gap-1.5 pl-5 text-[14px] leading-snug">
                {evaluation.improvements.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </PaperCard>
          </div>
        </section>
      </div>
    </div>
  );
}
