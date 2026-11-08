import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import type { Evaluation, Objective, StageMode } from "@pw/shared";
import { api, invalidate, useApi } from "@/lib/api";
import { pw } from "@/lib/bridge";
import type { StageOverlayPayload } from "@/lib/overlayChannels";
import { useSession } from "@/stores/session";
import { useProgress } from "@/stores/progress";
import { useCredits } from "@/stores/credits";
import { useUi } from "@/stores/ui";
import { toast } from "@/components/ui/Toaster";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { StageTopBar } from "./StageTopBar";
import { StageRail } from "./StageRail";
import { PlanView } from "./PlanView";
import { DoView } from "./DoView";
import { LearnView } from "./LearnView";
import { EvaluationView } from "./EvaluationView";
import { NoticeBanner } from "./NoticeBanner";
import { ErrorState, LoadingState, LockedState } from "./StageStates";
import { useStageTime, usePageActive } from "./useStageTime";
import {
  describeStageError,
  mergeChecklist,
  nextStageRoute,
  readRailWidth,
  withStageProgress,
  writeRailWidth,
  type ChecklistItem,
  type NextStageRoute,
  type StageNotice,
} from "./helpers";

/**
 * Stage workspace: /objective/:objectiveId/stage/:stageId. Plan, Do and Learn modes share one
 * objective state. Every mutation returns the updated objective, which is written back into the cache.
 */
export default function StagePage() {
  const { objectiveId = "", stageId = "" } = useParams();
  const navigate = useNavigate();
  const user = useSession((s) => s.user);
  const level = useProgress((s) => s.data?.level);

  const objQ = useApi("GET /objectives/:id", { params: { id: objectiveId } }, [objectiveId]);
  const objective = objQ.data;
  const scenarioId = objective?.scenarioId ?? null;
  const scenQ = useApi("GET /scenarios/:id", scenarioId ? { params: { id: scenarioId } } : null, [scenarioId]);
  const scenario = scenQ.data;
  const applyObjective = objQ.mutate;

  const [notice, setNotice] = useState<StageNotice | null>(null);
  const [railWidth, setRailWidth] = useState(() => readRailWidth());
  const [focusItemId, setFocusItemId] = useState<string | null>(null);
  const [evalToShow, setEvalToShow] = useState<Evaluation | null>(null);
  const [nextBusy, setNextBusy] = useState(false);
  const startedRef = useRef<string | null>(null);

  const stage = scenario?.stages.find((s) => s.id === stageId);
  const stages = useMemo(() => (scenario ? [...scenario.stages].sort((a, b) => a.order - b.order) : []), [scenario]);
  const progress = objective?.stages[stageId];
  const checklist = useMemo<ChecklistItem[]>(
    () => (progress ? mergeChecklist(progress.agreedRequirements, progress.todos) : []),
    [progress],
  );

  const report = useCallback((e: unknown) => {
    const n = describeStageError(e);
    setNotice(n);
    if (n.kind === "credits") toast({ title: "Out of credits", body: n.message, tone: "warning" });
  }, []);

  const openCredits = useCallback(() => useUi.getState().openPanel("credits"), []);
  const closeEval = useCallback(() => setEvalToShow(null), []);

  // Shared data: progress store for the level pill, and "objective:changed" from the companion.
  useEffect(() => {
    void useProgress.getState().refresh();
  }, []);
  useEffect(
    () =>
      pw.overlay.onMessage((m) => {
        if (m.channel === "objective:changed") invalidate(`GET /objectives/${objectiveId}`);
      }),
    [objectiveId],
  );

  // Time on task: only for unlocked work stages.
  const timeEnabled = !!stage && stage.kind === "work" && !!progress && progress.status !== "locked";
  useStageTime(objectiveId, stageId, timeEnabled);
  const pageActive = usePageActive();

  // Start an available stage on mount, then refetch the objective.
  useEffect(() => {
    if (!objective || !stage || stage.kind !== "work" || !progress || progress.status !== "available") return;
    const key = `${objective.id}:${stage.id}`;
    if (startedRef.current === key) return;
    startedRef.current = key;
    api("POST /objectives/:id/stages/:stageId/start", { params: { id: objectiveId, stageId } })
      .then(() => invalidate(`GET /objectives/${objectiveId}`))
      .catch((e: unknown) => report(e));
  }, [objective, stage, progress, objectiveId, stageId, report]);

  // ── mutations: optimistic where it is cheap, rolled back on failure ──

  const changeMode = async (mode: StageMode) => {
    if (!objective || !progress || progress.mode === mode) return;
    const before = objective;
    applyObjective(withStageProgress(objective, stageId, { mode }));
    try {
      applyObjective(await api("POST /objectives/:id/stages/:stageId/mode", { params: { id: objectiveId, stageId }, body: { mode } }));
    } catch (e) {
      applyObjective(before);
      report(e);
    }
  };

  const sendPlan = async (message: string) => {
    const res = await api("POST /objectives/:id/stages/:stageId/plan", { params: { id: objectiveId, stageId }, body: { message } });
    applyObjective(res.objective);
  };

  const saveChecklist = async (next: ChecklistItem[]) => {
    if (!objective) return;
    const before = objective;
    applyObjective(withStageProgress(objective, stageId, { todos: next }));
    try {
      applyObjective(await api("POST /objectives/:id/stages/:stageId/todos", { params: { id: objectiveId, stageId }, body: { todos: next } }));
    } catch (e) {
      applyObjective(before);
      report(e);
    }
  };

  const sendLearnChat = async (message: string) => {
    const res = await api("POST /objectives/:id/stages/:stageId/learn/chat", { params: { id: objectiveId, stageId }, body: { message } });
    applyObjective(res.objective);
  };

  const completeLearnItem = async (itemId: string) => {
    applyObjective(await api("POST /objectives/:id/stages/:stageId/learn/:itemId/complete", { params: { id: objectiveId, stageId, itemId } }));
  };

  const onSubmitted = (next: Objective, evaluation: Evaluation) => {
    applyObjective(next);
    setNotice(null);
    setEvalToShow(evaluation);
    void useProgress.getState().refresh();
    void useCredits.getState().refresh();
  };

  const goNext = async (route: NextStageRoute) => {
    setNextBusy(true);
    try {
      if (objective?.stages[route.stageId]?.status === "available") {
        await api("POST /objectives/:id/stages/:stageId/start", { params: { id: objectiveId, stageId: route.stageId } });
      }
      setEvalToShow(null);
      navigate(route.path);
    } catch (e) {
      report(e);
    } finally {
      setNextBusy(false);
    }
  };

  // ── guards and states ──

  if (objQ.error && !objective) return <ErrorState message={objQ.error.message} onRetry={objQ.reload} />;
  if (scenQ.error && !scenario) return <ErrorState message={scenQ.error.message} onRetry={scenQ.reload} />;
  if (!objective || !scenario) return <LoadingState />;
  if (!stage) return <ErrorState message="This stage is not part of this project." />;
  if (stage.kind === "presentation") {
    return <Navigate to={`/objective/${objectiveId}/stage/${stageId}/present`} replace />;
  }
  if (!progress || progress.status === "locked") return <LockedState backTo={`/objective/${objectiveId}`} />;

  const mode = progress.mode;
  const learn = mode === "learn";
  const next = nextStageRoute(objectiveId, stages, stageId);
  const npc = scenario.npc;
  const learnerName = user?.name ?? "You";
  const overlayPayload: StageOverlayPayload = {
    objectiveId,
    stageId,
    mode,
    learnerName,
    stageTitle: stage.title,
    scenarioTitle: scenario.title,
    npcName: npc.name,
    npcAvatarSeed: npc.avatarSeed,
    npcVoice: npc.voice,
  };
  const toggleItem = (id: string) => {
    void saveChecklist(checklist.map((it) => (it.id === id ? { ...it, done: !it.done } : it)));
  };

  return (
    // The top bar and rail stay dark in every mode; only the main column turns to paper in Learn mode.
    <div className="theme-night flex h-full min-h-0 flex-col overflow-hidden bg-night">
      <StageTopBar
        scenarioTitle={scenario.title}
        stageTitle={stage.title}
        stageId={stageId}
        mode={mode}
        onModeChange={(m) => void changeMode(m)}
        modeDisabled={false}
        timeSpentSec={progress.timeSpentSec}
        timerRunning={pageActive && timeEnabled}
        xpEarned={objective.xpEarned}
        performance={objective.performance}
        level={level}
      />

      {notice && <NoticeBanner notice={notice} onDismiss={() => setNotice(null)} />}

      <div className="flex min-h-0 flex-1">
        <StageRail
          objectiveId={objectiveId}
          stages={stages}
          objective={objective}
          currentStageId={stageId}
          company={scenario.company}
          npc={npc}
          checklist={checklist}
          agreedRequirements={progress.agreedRequirements}
          width={railWidth}
          onWidthChange={setRailWidth}
          onWidthCommit={(w) => writeRailWidth(w)}
          onToggleTodo={(list) => void saveChecklist(list)}
          onOpenLearnItem={(itemId) => {
            setFocusItemId(itemId);
            void changeMode("learn");
          }}
          learnItems={stage.learn}
          learnCompleted={progress.learnCompleted}
          notes={objective.notes}
        />

        <main
          className={cn(
            "flex min-h-0 min-w-0 flex-1 flex-col transition-colors duration-300",
            learn ? "theme-paper bg-paper" : "theme-night bg-night",
          )}
        >
          {progress.evaluation && (
            <div className="flex shrink-0 justify-end px-5 pt-4">
              <Button variant="glass" size="sm" onClick={() => setEvalToShow(progress.evaluation)}>
                View feedback
              </Button>
            </div>
          )}
          <motion.div
            key={`${stageId}-${mode}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="flex min-h-0 flex-1 flex-col"
          >
            {mode === "plan" && (
              <PlanView
                stage={stage}
                npc={npc}
                progress={progress}
                onSend={sendPlan}
                onStartDoing={() => changeMode("do")}
                onError={report}
              />
            )}
            {mode === "do" && (
              <div key={stageId} className="min-h-0 flex-1 overflow-y-auto">
                <DoView
                  objectiveId={objectiveId}
                  stage={stage}
                  progress={progress}
                  npc={npc}
                  learnerName={learnerName}
                  checklist={checklist}
                  onToggleItem={toggleItem}
                  overlayPayload={overlayPayload}
                  onSubmitted={onSubmitted}
                  onError={report}
                  onOpenCredits={openCredits}
                />
              </div>
            )}
            {mode === "learn" && (
              <div className="min-h-0 flex-1 overflow-y-auto">
                <LearnView
                  stage={stage}
                  progress={progress}
                  npc={npc}
                  focusItemId={focusItemId}
                  onComplete={completeLearnItem}
                  onChat={sendLearnChat}
                  onError={report}
                />
              </div>
            )}
          </motion.div>
        </main>
      </div>

      <Modal
        open={evalToShow !== null}
        onClose={closeEval}
        title="Feedback on your work"
        widthClass="max-w-[680px]"
      >
        {evalToShow && (
          <EvaluationView
            evaluation={evalToShow}
            nextRoute={evalToShow.passed ? next : null}
            nextBusy={nextBusy}
            onNext={(r) => void goNext(r)}
            onRevise={closeEval}
            onReview={() => {
              setEvalToShow(null);
              navigate(`/objective/${objectiveId}/review`);
            }}
          />
        )}
      </Modal>
    </div>
  );
}

