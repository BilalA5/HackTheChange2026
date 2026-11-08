import { useCallback, useEffect, useRef } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import type { ObjectivePhase, ScenarioDetail } from "@pw/shared";
import { api, useApi } from "@/lib/api";
import { cancel } from "@/lib/voice/tts";
import { cn } from "@/lib/cn";
import { useProgress } from "@/stores/progress";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Feedback";
import { TopBar } from "./TopBar";
import { BriefView } from "./BriefView";
import { KickoffPhase } from "./kickoff/KickoffPhase";
import { PouView } from "./pou/PouView";

function firstStageId(scenario: ScenarioDetail | undefined): string | null {
  if (!scenario) return null;
  const sorted = [...scenario.stages].sort((a, b) => a.order - b.order);
  return sorted[0]?.id ?? null;
}

/** Project opening flow at /objective/:objectiveId: Brief, Kickoff, Proof of understanding. */
export default function ObjectivePage() {
  const { objectiveId = "" } = useParams();
  const navigate = useNavigate();

  const objectiveRes = useApi("GET /objectives/:id", { params: { id: objectiveId } }, []);
  const objective = objectiveRes.data;
  const scenarioId = objective?.scenarioId ?? null;
  const scenarioRes = useApi("GET /scenarios/:id", scenarioId === null ? null : { params: { id: scenarioId } }, []);
  const scenario = scenarioRes.data;

  const level = useProgress((s) => s.data?.level ?? 0);
  const sawPouRef = useRef(false);
  const phase = objective?.phase;

  const setObjective = objectiveRes.mutate;
  const refresh = useCallback(async () => {
    setObjective(await api("GET /objectives/:id", { params: { id: objectiveId } }));
  }, [objectiveId, setObjective]);

  useEffect(() => {
    void useProgress.getState().refresh();
  }, []);

  // Narration never outlives its phase: stop speech on every phase change and on unmount.
  useEffect(() => {
    cancel();
  }, [phase]);
  useEffect(() => () => cancel(), []);

  if (objectiveRes.error && !objective) {
    return <LoadError message={objectiveRes.error.message} onRetry={objectiveRes.reload} onBack={() => navigate("/")} />;
  }
  if (!objective) return <Loading />;

  if (objective.phase === "complete") {
    return <Navigate to={`/objective/${objective.id}/review`} replace />;
  }
  // Passing the Proof of Understanding flips the phase to "stages" while the learner is still here:
  // keep the PoU view (and its celebration) on screen until they choose to start the first stage.
  if (objective.phase === "pou") sawPouRef.current = true;
  const celebrating = objective.phase === "stages" && sawPouRef.current;
  if (objective.phase === "stages" && !celebrating) {
    const stageId = objective.currentStageId ?? firstStageId(scenario);
    if (stageId) return <Navigate to={`/objective/${objective.id}/stage/${stageId}`} replace />;
  }

  if (!scenario) {
    if (scenarioRes.error) {
      return <LoadError message={scenarioRes.error.message} onRetry={scenarioRes.reload} onBack={() => navigate("/")} />;
    }
    return <Loading />;
  }

  const paper = objective.phase === "kickoff" || objective.phase === "pou" || celebrating;
  const phaseNow: ObjectivePhase = celebrating ? "pou" : objective.phase;

  return (
    <div className={cn("flex h-full min-h-0 flex-col overflow-hidden", paper ? "theme-paper paper-page" : "theme-night bg-night")}>
      <TopBar scenario={scenario} phase={phaseNow} level={level} onBack={() => navigate("/")} />
      <div className="flex min-h-0 flex-1 flex-col">
        {objective.phase === "brief" && (
          <BriefView scenario={scenario} objective={objective} onObjective={setObjective} refresh={refresh} />
        )}
        {objective.phase === "kickoff" && (
          <KickoffPhase scenario={scenario} objective={objective} onObjective={setObjective} />
        )}
        {(objective.phase === "pou" || celebrating) && (
          <PouView objectiveId={objective.id} scenario={scenario} objective={objective} onObjective={setObjective} refresh={refresh} />
        )}
        {objective.phase !== "brief" && objective.phase !== "kickoff" && objective.phase !== "pou" && !celebrating && <Loading />}
      </div>
    </div>
  );
}

function Loading() {
  return (
    <div className="flex h-full flex-1 items-center justify-center">
      <Spinner label="Loading project" size={24} />
    </div>
  );
}

function LoadError({ message, onRetry, onBack }: { message: string; onRetry(): void; onBack(): void }) {
  return (
    <div className="flex h-full flex-1 items-center justify-center p-8">
      <div role="alert" className="glass flex max-w-[420px] flex-col items-center gap-4 p-8 text-center">
        <h2 className="font-serif text-[22px] font-medium text-fg">We could not open this project</h2>
        <p className="text-[14px] text-fg-muted">{message}</p>
        <div className="flex gap-3">
          <Button variant="glass" onClick={onBack}>
            Back to map
          </Button>
          <Button onClick={onRetry}>Try again</Button>
        </div>
      </div>
    </div>
  );
}
