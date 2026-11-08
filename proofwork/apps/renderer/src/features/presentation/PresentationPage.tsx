import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router";
import type { Objective, ScenarioDetail, Stage, StageProgress } from "@pw/shared";
import { Button, EmptyState, Spinner, toast } from "@/components/ui";
import { ApiError, api, invalidate, useApi } from "@/lib/api";
import { pw } from "@/lib/bridge";
import { errorMessage } from "@/lib/errors";
import { joinTranscript } from "./slides";
import { useSession } from "@/stores/session";
import { useUi } from "@/stores/ui";
import { probeStt, type SttStatus } from "@/lib/voice/stt";
import { ChunkedRecorder, type RecordingBridge } from "./recorder";
import { pickMimeType } from "./framing";
import { useOverlayLink, type RecordBarCommand, type RecordBarState } from "./overlayLink";
import { RecordingStage } from "./RecordingStage";
import { ReviewStage, type SubmitError } from "./ReviewStage";
import { SetupStage } from "./SetupStage";
import { buildDefaultSlides } from "./slides";
import { storeRecordingUrl } from "./storage";
import { useFramingCheck, useMicLevel } from "./useSignals";
import { useLiveTranscript } from "./useLiveTranscript";
import { useMediaStream, type MediaPrefs } from "./useMediaStream";
import type { DeckSource, FramingReason, OutlineSlide, PresentationPhase } from "./types";

interface StageContext {
  scenario: ScenarioDetail;
  objective: Objective;
  stage: Stage;
  /** Requirements agreed in the stages before this one, in stage order, de-duplicated. */
  agreed: string[];
}

interface RecordingResult {
  url: string | null;
  error: string | null;
  durationSec: number;
  framingScore: number;
  slidesCovered: number;
}

function buildContext(objective: Objective | undefined, scenario: ScenarioDetail | undefined, stageId: string): StageContext | null {
  if (!objective || !scenario) return null;
  const stage = scenario.stages.find((s) => s.id === stageId);
  if (!stage || stage.kind !== "presentation") return null;
  const agreed: string[] = [];
  for (const s of scenario.stages) {
    if (s.id === stage.id) continue;
    const sp: StageProgress | undefined = objective.stages[s.id];
    for (const r of sp?.agreedRequirements ?? []) {
      if (!agreed.includes(r)) agreed.push(r);
    }
  }
  return { scenario, objective, stage, agreed };
}

function deckSourceOf(ctx: StageContext): DeckSource {
  return {
    scenarioTitle: ctx.scenario.title,
    stageTitle: ctx.stage.title,
    problemStatement: ctx.scenario.problemStatement,
    agreedRequirements: ctx.agreed,
    deliverables: ctx.scenario.deliverables.map((d) => d.title),
  };
}

function isTypingTarget(t: EventTarget | null): boolean {
  if (!(t instanceof HTMLElement)) return false;
  return t.isContentEditable || t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT";
}

function classifySubmitError(e: unknown): SubmitError {
  if (e instanceof ApiError && e.status === 402) {
    return { kind: "credits", message: "You do not have enough credits to submit this presentation." };
  }
  if (e instanceof ApiError && e.status === 409) {
    return { kind: "conflict", message: "Finish the earlier stages before you present." };
  }
  return { kind: "generic", message: errorMessage(e) };
}

/** Presentation stage: setup, recording, review and submit. Route: /objective/:id/stage/:stageId/present. */
export default function PresentationPage() {
  const { objectiveId = "", stageId = "" } = useParams();
  const navigate = useNavigate();
  const user = useSession((s) => s.user);

  const objective = useApi("GET /objectives/:id", objectiveId ? { params: { id: objectiveId } } : null, [objectiveId]);
  const scenarioId = objective.data?.scenarioId;
  const scenario = useApi("GET /scenarios/:id", scenarioId ? { params: { id: scenarioId } } : null, [scenarioId]);

  const ctx = useMemo(() => buildContext(objective.data, scenario.data, stageId), [objective.data, scenario.data, stageId]);
  const source = useMemo(() => (ctx ? deckSourceOf(ctx) : null), [ctx]);

  const [phase, setPhase] = useState<PresentationPhase>("setup");
  const [deck, setDeck] = useState<OutlineSlide[] | null>(null);
  const [notes, setNotes] = useState("");
  const [transcript, setTranscript] = useState("");
  const [prefs, setPrefs] = useState<MediaPrefs>(() => ({
    cameraId: user?.settings.devices.cameraId,
    micId: user?.settings.devices.micId,
  }));

  const [stt, setStt] = useState<SttStatus | null>(null);
  const sttAvailable = stt?.available === true;

  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);
  const [finalising, setFinalising] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [slideIndex, setSlideIndex] = useState(0);
  const [overlaysOpen, setOverlaysOpen] = useState(false);
  const [result, setResult] = useState<RecordingResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<SubmitError | null>(null);

  // Refs read by timers, keyboard handlers and overlay messages, so they always see the latest values.
  const recorderRef = useRef<ChunkedRecorder | null>(null);
  const overlaysRef = useRef(false);
  const pausedRef = useRef(false);
  const elapsedRef = useRef(0);
  const slideRef = useRef(0);
  const maxSlideRef = useRef(0);
  const deckRef = useRef<OutlineSlide[] | null>(null);
  const countingRef = useRef(false);
  const tallyRef = useRef({ ok: 0, total: 0 });
  const finalisingRef = useRef(false);
  const [overlayReason, setOverlayReason] = useState<FramingReason | null>(null);

  // Initialise the outline once the scenario is known. After that, edits are kept.
  useEffect(() => {
    if (deck === null && source) setDeck(buildDefaultSlides(source));
  }, [deck, source]);
  useEffect(() => {
    deckRef.current = deck;
  }, [deck]);

  useEffect(() => {
    let alive = true;
    void probeStt().then((s) => {
      if (alive) setStt(s);
    });
    return () => {
      alive = false;
    };
  }, []);

  const media = useMediaStream(phase !== "review", prefs);
  const verdictSample = useCallback((reason: "ok" | "too_dark" | "too_bright" | "no_signal") => {
    if (!countingRef.current) return;
    tallyRef.current.total += 1;
    if (reason === "ok") tallyRef.current.ok += 1;
  }, []);
  const verdict = useFramingCheck(media.stream, verdictSample);
  const micLevel = useMicLevel(phase === "setup" ? media.stream : null);

  const appendFinal = useCallback((text: string) => setTranscript((prev) => joinTranscript(prev, text)), []);
  const vocabulary = useMemo(() => (scenario.data ? [...scenario.data.tools, ...scenario.data.skills] : undefined), [scenario.data]);
  const live = useLiveTranscript({
    active: phase === "recording" && !paused && !finalising,
    enabled: sttAvailable,
    micId: prefs.micId,
    vocabulary,
    onFinal: appendFinal,
  });

  useEffect(() => {
    countingRef.current = phase === "recording" && !paused && !finalising;
  }, [phase, paused, finalising]);

  // Recording clock: counts only while recording and not paused.
  useEffect(() => {
    if (phase !== "recording" || paused) return;
    const id = setInterval(() => {
      elapsedRef.current += 1;
      setElapsed(elapsedRef.current);
    }, 1000);
    return () => clearInterval(id);
  }, [phase, paused]);

  const goSlide = useCallback((index: number) => {
    const n = deckRef.current?.length ?? 0;
    if (n === 0) return;
    const next = Math.min(n - 1, Math.max(0, index));
    slideRef.current = next;
    maxSlideRef.current = Math.max(maxSlideRef.current, next);
    setSlideIndex(next);
  }, []);

  const setPausedBoth = useCallback((next: boolean) => {
    const rec = recorderRef.current;
    if (!rec) return;
    if (next) rec.pause();
    else rec.resume();
    pausedRef.current = next;
    setPaused(next);
  }, []);

  const openOverlays = useCallback(async (payload: { objectiveId: string; stageId: string; slides: number; cameraDeviceId?: string }) => {
    try {
      await pw.overlay.open("recordbar", payload);
      await pw.overlay.open("camera", payload);
      overlaysRef.current = true;
      setOverlaysOpen(true);
    } catch {
      // Overlays are a convenience. The in-page controls still work.
    }
  }, []);

  const closeOverlays = useCallback(async () => {
    if (!overlaysRef.current) return;
    overlaysRef.current = false;
    setOverlaysOpen(false);
    setOverlayReason(null);
    await Promise.allSettled([pw.overlay.close("recordbar"), pw.overlay.close("camera")]);
  }, []);

  const stopPresenting = useCallback(async () => {
    const rec = recorderRef.current;
    if (!rec || finalisingRef.current) return;
    finalisingRef.current = true;
    setFinalising(true);
    const outcome = await rec.stop();
    recorderRef.current = null;
    await closeOverlays();
    const { ok, total } = tallyRef.current;
    setResult({
      url: outcome.url,
      error: outcome.error,
      durationSec: elapsedRef.current,
      framingScore: total > 0 ? ok / total : 0,
      slidesCovered: maxSlideRef.current + 1,
    });
    finalisingRef.current = false;
    setFinalising(false);
    setPhase("review");
  }, [closeOverlays]);

  const handleCommand = useCallback(
    (cmd: RecordBarCommand) => {
      switch (cmd) {
        case "pause":
          setPausedBoth(true);
          break;
        case "resume":
          setPausedBoth(false);
          break;
        case "next":
          goSlide(slideRef.current + 1);
          break;
        case "prev":
          goSlide(slideRef.current - 1);
          break;
        case "stop":
          void stopPresenting();
          break;
      }
    },
    [goSlide, setPausedBoth, stopPresenting],
  );

  const readRecordBarState = useCallback(
    (): RecordBarState => ({
      elapsedSec: elapsedRef.current,
      paused: pausedRef.current,
      slide: slideRef.current,
      slides: deckRef.current?.length ?? 0,
      recording: recorderRef.current !== null,
    }),
    [],
  );

  // The camera overlay reports its own verdict, which drives the bubble ring. The framing score is always
  // computed from this page's own samples, so it does not depend on the overlay being open.
  const onFraming = useCallback((f: { reason: FramingReason }) => setOverlayReason(f.reason), []);

  useOverlayLink({ open: overlaysOpen, readState: readRecordBarState, onCommand: handleCommand, onFraming });

  // Arrow keys change slides while recording.
  useEffect(() => {
    if (phase !== "recording") return;
    const onKey = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target)) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goSlide(slideRef.current + 1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goSlide(slideRef.current - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, goSlide]);

  // Unmount: stop the recorder (finishing the file) and close the overlays. Media tracks stop in useMediaStream.
  useEffect(() => {
    return () => {
      const rec = recorderRef.current;
      recorderRef.current = null;
      if (rec) void rec.stop();
      if (overlaysRef.current) {
        overlaysRef.current = false;
        void Promise.allSettled([pw.overlay.close("recordbar"), pw.overlay.close("camera")]);
      }
    };
  }, []);

  const startPresenting = async () => {
    if (!media.stream || !deck || !ctx || starting) return;
    setStarting(true);
    setStartError(null);
    const mime = pickMimeType((t) => typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(t));
    const bridge: RecordingBridge = {
      begin: (name) => pw.recording.begin(name),
      write: (id, chunk) => pw.recording.write(id, chunk),
      finish: (id) => pw.recording.finish(id),
    };
    const rec = new ChunkedRecorder(bridge, mime);
    try {
      await rec.start(media.stream, `presentation-${objectiveId}-${stageId}-${Date.now()}`);
    } catch (e) {
      setStartError(`Recording could not start: ${errorMessage(e)}`);
      setStarting(false);
      return;
    }
    recorderRef.current = rec;
    tallyRef.current = { ok: 0, total: 0 };
    elapsedRef.current = 0;
    slideRef.current = 0;
    maxSlideRef.current = 0;
    pausedRef.current = false;
    setElapsed(0);
    setSlideIndex(0);
    setPaused(false);
    setSubmitError(null);
    setResult(null);
    setTranscript(sttAvailable ? "" : notes);
    setStarting(false);
    setPhase("recording");
    if (pw.isElectron) {
      await openOverlays({
        objectiveId,
        stageId,
        slides: deck.length,
        cameraDeviceId: prefs.cameraId,
      });
    }
  };

  const rerecord = () => {
    if (result?.url?.startsWith("blob:")) URL.revokeObjectURL(result.url);
    setResult(null);
    setSubmitError(null);
    setTranscript(sttAvailable ? "" : notes);
    setPhase("setup");
  };

  const submit = async () => {
    if (!result || !ctx || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await api("POST /objectives/:id/stages/:stageId/presentation", {
        params: { id: objectiveId, stageId },
        body: {
          transcript: transcript.trim(),
          durationSec: Math.round(result.durationSec),
          framingScore: result.framingScore,
          slidesCovered: result.slidesCovered,
          recordingUrl: result.url ?? undefined,
        },
      });
      storeRecordingUrl(objectiveId, result.url);
      invalidate(`GET /objectives/${objectiveId}`);
      navigate(`/objective/${objectiveId}/feedback`);
    } catch (e) {
      const err = classifySubmitError(e);
      if (err.kind === "credits") {
        toast({ title: "Not enough credits", body: "Top up to submit this presentation.", tone: "warning" });
      }
      setSubmitError(err);
      setSubmitting(false);
    }
  };

  const savePrefs = async (next: MediaPrefs) => {
    setPrefs(next);
    try {
      const updated = await api("PATCH /me", {
        body: { settings: { devices: { cameraId: next.cameraId, micId: next.micId } } },
      });
      useSession.getState().setUser(updated);
    } catch (e) {
      toast({ title: "Could not save device choice", body: errorMessage(e), tone: "warning" });
    }
  };

  // Non-STT mode: transcript starts from the speaker notes when recording starts (see startPresenting).
  if (objective.error || scenario.error) {
    return (
      <div className="theme-night grid h-full place-items-center bg-night p-8">
        <EmptyState
          title="Could not load this presentation"
          body={errorMessage(objective.error ?? scenario.error)}
          action={
            <Button
              variant="glass"
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

  if (!ctx) {
    if (!objective.data || !scenario.data) {
      return (
        <div className="theme-night grid h-full place-items-center bg-night">
          <Spinner size={22} label="Loading presentation" />
        </div>
      );
    }
    return (
      <div className="theme-night grid h-full place-items-center bg-night p-8">
        <EmptyState
          title="This stage is not a presentation"
          body="Open the stage from your objective to continue."
          action={
            <Link to={`/objective/${objectiveId}`} className="text-accent underline underline-offset-2">
              Back to the objective
            </Link>
          }
        />
      </div>
    );
  }

  if (!deck) {
    return (
      <div className="theme-night grid h-full place-items-center bg-night">
        <Spinner size={22} label="Loading presentation" />
      </div>
    );
  }

  const stageHref = `/objective/${objectiveId}/stage/${stageId}`;

  if (phase === "setup") {
    return (
      <SetupStage
        npc={ctx.scenario.npc}
        stageTitle={ctx.stage.title}
        requirements={ctx.stage.requirements}
        instructions={ctx.stage.submission.instructions}
        deck={deck}
        onDeckChange={setDeck}
        notes={notes}
        onNotesChange={setNotes}
        media={media}
        verdict={verdict}
        micLevel={micLevel}
        prefs={prefs}
        onPrefsChange={(next) => void savePrefs(next)}
        onStart={() => void startPresenting()}
        starting={starting}
        startError={startError}
      />
    );
  }

  if (phase === "recording") {
    return (
      <RecordingStage
        deck={deck}
        slideIndex={slideIndex}
        onGoto={goSlide}
        elapsedSec={elapsed}
        paused={paused}
        stream={media.stream}
        verdict={verdict}
        overlayReason={overlayReason}
        stopping={finalising}
        onPause={() => setPausedBoth(true)}
        onResume={() => setPausedBoth(false)}
        onStop={() => void stopPresenting()}
        sttAvailable={sttAvailable}
        transcript={transcript}
        onTranscriptChange={setTranscript}
        partial={live.partial}
        sttError={live.error}
      />
    );
  }

  return (
    <ReviewStage
      npc={ctx.scenario.npc}
      recordingUrl={result?.url ?? null}
      recordingError={result?.error ?? null}
      durationSec={result?.durationSec ?? 0}
      framingScore={result?.framingScore ?? 0}
      slidesCovered={result?.slidesCovered ?? 0}
      totalSlides={deck.length}
      transcript={transcript}
      onTranscriptChange={setTranscript}
      submitting={submitting}
      submitError={submitError}
      onSubmit={() => void submit()}
      onRerecord={rerecord}
      onOpenCredits={() => useUi.getState().openPanel("credits")}
      stageHref={stageHref}
    />
  );
}
