import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion } from "motion/react";
import { useNavigate } from "react-router";
import { CUSTOM_CAREER_ID, type FtuxStep, type FtuxTurn, type FtuxView } from "@pw/shared";
import { ApiError, api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { useSession } from "@/stores/session";
import { useCredits } from "@/stores/credits";
import { useProgress } from "@/stores/progress";
import { toast } from "@/components/ui/Toaster";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Feedback";
import { cn } from "@/lib/cn";
import { DrawStep } from "./steps/DrawStep";
import { ChatStep } from "./steps/ChatStep";
import { RecommendStep } from "./steps/RecommendStep";
import { RoadmapStep } from "./steps/RoadmapStep";
import { WhyStep } from "./steps/WhyStep";
import { ClaimStep } from "./steps/ClaimStep";
import { FTUX_STEPS, isFtuxView } from "./types";
import { BuildingPath } from "./BuildingPath";

/** Slim progress strip: Draw · Chat · Match · Roadmap · Why · Claim. Display only, the server owns the step. */
function StepIndicator({ current }: { current: FtuxStep }) {
  const currentIndex = current === "done" ? FTUX_STEPS.length : FTUX_STEPS.findIndex((s) => s.id === current);
  return (
    <nav aria-label="Onboarding progress">
      <ol className="flex items-center gap-1 font-mono text-[11px] tracking-[0.08em] uppercase">
        {FTUX_STEPS.map((s, i) => {
          const active = i === currentIndex;
          const past = i < currentIndex;
          return (
            <li key={s.id} className="flex items-center gap-1">
              {i > 0 && (
                <span aria-hidden className={cn("px-1", past ? "text-fg-muted" : "text-fg-muted/35")}>
                  ·
                </span>
              )}
              <span
                aria-current={active ? "step" : undefined}
                className={cn(
                  "rounded-full px-3 py-1 transition-colors duration-200",
                  active ? "bg-white/15 text-fg" : past ? "text-fg-muted" : "text-fg-muted/45",
                )}
              >
                {s.label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Slow drifting violet and gold glow behind the content. Stops for reduced motion. */
function Backdrop() {
  const reduce = useReducedMotion();
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -inset-[25%]"
        style={{
          background:
            "radial-gradient(circle at 30% 25%, color-mix(in srgb, var(--color-accent) 30%, transparent), transparent 46%), radial-gradient(circle at 74% 78%, color-mix(in srgb, var(--color-xp) 12%, transparent), transparent 42%)",
        }}
        animate={reduce ? undefined : { x: [0, 40, -24, 0], y: [0, -28, 22, 0], scale: [1, 1.06, 0.98, 1] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

function ErrorNotice({ message, onRetry, busy }: { message: string; onRetry: () => void; busy: boolean }) {
  return (
    <div role="alert" className="flex items-center justify-between gap-4 rounded-2xl border border-danger/40 bg-danger/12 px-4 py-2.5 text-[13px] text-fg">
      <span className="min-w-0">{message}</span>
      <Button variant="glass" size="sm" onClick={onRetry} disabled={busy} className="shrink-0">
        Try again
      </Button>
    </div>
  );
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const [view, setView] = useState<FtuxView | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [turnError, setTurnError] = useState<{ message: string; turn: FtuxTurn } | null>(null);
  /** The turn in flight. Drives the full-screen "Building your path" state. */
  const [inFlight, setInFlight] = useState<FtuxTurn | null>(null);
  const [finishing, setFinishing] = useState(false);
  const [finishError, setFinishError] = useState<string | null>(null);

  // Refs guard against double starts (StrictMode), double submits before React re-renders, and double finishes.
  const startedRef = useRef(false);
  const pendingRef = useRef(false);
  const finishingRef = useRef(false);
  const viewRef = useRef<FtuxView | null>(null);
  viewRef.current = view;

  const adopt = useCallback((next: FtuxView) => {
    viewRef.current = next;
    setView(next);
  }, []);

  const start = useCallback(async () => {
    setStartError(null);
    try {
      adopt(await api("POST /onboarding/session-start"));
    } catch (e) {
      if (e instanceof ApiError && e.status === 409 && isFtuxView(e.data)) adopt(e.data);
      else setStartError(errorMessage(e));
    }
  }, [adopt]);

  const finish = useCallback(async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setFinishing(true);
    setFinishError(null);
    try {
      await useSession.getState().refreshUser();
    } catch (e) {
      finishingRef.current = false;
      setFinishing(false);
      setFinishError(errorMessage(e));
      return;
    }
    await Promise.allSettled([useCredits.getState().refresh(), useProgress.getState().refresh()]);
    toast({ title: "Welcome to Proofwork", tone: "success" });
    navigate("/", { replace: true });
  }, [navigate]);

  const send = useCallback(
    async (turn: FtuxTurn) => {
      const current = viewRef.current;
      if (!current || pendingRef.current || finishingRef.current) return;
      pendingRef.current = true;
      setPending(true);
      setInFlight(turn);
      setTurnError(null);
      try {
        const next = await api("POST /onboarding/session-turn", { body: { sessionId: current.sessionId, turn } });
        adopt(next);
      } catch (e) {
        if (e instanceof ApiError && e.status === 409 && isFtuxView(e.data)) {
          // The server is authoritative: adopt its view instead of showing an error.
          adopt(e.data);
        } else {
          setTurnError({ message: errorMessage(e), turn });
        }
      } finally {
        pendingRef.current = false;
        setPending(false);
        setInFlight(null);
      }
    },
    [adopt],
  );

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void start();
  }, [start]);

  // The server says the flow is complete (on mount or after a turn). Finish the session.
  useEffect(() => {
    if (view?.step === "done") void finish();
  }, [view, finish]);

  const building = view !== null && inFlight?.kind === "SELECT_CAREER" && inFlight.careerId === CUSTOM_CAREER_ID;
  const turnErrorText =
    turnError?.turn.kind === "SELECT_CAREER" && turnError.turn.careerId === CUSTOM_CAREER_ID
      ? `We could not build your path. ${turnError.message}`
      : turnError?.message ?? "";

  if (finishing || view?.step === "done") {
    return (
      <div className="theme-night relative flex h-full min-h-0 flex-col items-center justify-center gap-4 overflow-hidden bg-night text-fg">
        <Backdrop />
        <div className="relative flex flex-col items-center gap-4 text-center" role="status" aria-live="polite">
          {!finishError ? (
            <>
              <Spinner size={28} label="Setting up your workspace" />
              <p className="font-serif text-[24px] text-fg">Setting up your workspace</p>
            </>
          ) : (
            <>
              <p className="font-serif text-[22px] text-fg">We could not finish setup.</p>
              <p className="max-w-[380px] text-[14px] text-fg-muted">{finishError}</p>
              <Button variant="light" size="md" onClick={() => void finish()}>
                Try again
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      <div className="theme-night relative flex h-full min-h-0 w-full flex-col overflow-hidden bg-night text-fg">
        <Backdrop />

        {building && view && (
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-night/95 backdrop-blur-sm" role="presentation">
            <BuildingPath industry={view.board?.industry} roleTitle={view.board?.targetRole} />
          </div>
        )}

        <header className="relative z-10 flex shrink-0 items-center justify-center px-8 pt-5 pb-3">
          {view && <StepIndicator current={view.step} />}
        </header>

        <main className="relative z-10 flex min-h-0 flex-1 flex-col px-8 pb-6">
          {turnError && (
            <div className="mb-3 shrink-0">
              <ErrorNotice message={turnErrorText} busy={pending} onRetry={() => void send(turnError.turn)} />
            </div>
          )}

          {startError && !view && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
              <p className="font-serif text-[24px] text-fg">We could not start onboarding.</p>
              <p className="max-w-[380px] text-[14px] text-fg-muted">{startError}</p>
              <Button variant="light" size="md" onClick={() => void start()}>
                Try again
              </Button>
            </div>
          )}

          {!view && !startError && (
            <div className="flex flex-1 items-center justify-center">
              <Spinner size={24} label="Loading onboarding" />
            </div>
          )}

          <AnimatePresence mode="wait" initial={false}>
            {view && (
              <motion.div
                key={view.step}
                initial={{ opacity: 0, y: reduce ? 0 : 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduce ? 0 : -12 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="flex min-h-0 flex-1 flex-col"
              >
                <StepView view={view} busy={pending} send={send} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </MotionConfig>
  );
}

function StepView({ view, busy, send }: { view: FtuxView; busy: boolean; send: (turn: FtuxTurn) => void }) {
  switch (view.step) {
    case "draw":
      return <DrawStep view={view} busy={busy} send={send} />;
    case "chat":
      return <ChatStep view={view} busy={busy} send={send} />;
    case "recommend":
      return <RecommendStep view={view} busy={busy} send={send} />;
    case "roadmap":
      return <RoadmapStep view={view} busy={busy} send={send} />;
    case "why":
      return <WhyStep view={view} busy={busy} send={send} />;
    case "claim":
      return <ClaimStep view={view} busy={busy} send={send} />;
    default:
      return null;
  }
}
