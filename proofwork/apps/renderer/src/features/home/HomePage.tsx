// Home: the city district map, the project carousel and the timeline dock.
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { JOB_PORTAL_UNLOCK_SCENARIOS } from "@pw/shared";
import { useApi } from "@/lib/api";
import { useSession } from "@/stores/session";
import { useUi } from "@/stores/ui";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Feedback";
import { LevelPill } from "@/components/domain/LevelPill";
import { WorldMap } from "./WorldMap";
import { ScenarioCarousel } from "./ScenarioCarousel";
import { TimelineDock } from "./TimelineDock";
import {
  careerNodeFor,
  careerScenarios,
  cycleIndex,
  decorativeLimitFor,
  defaultScenarioId,
  isJobPortalUnlocked,
  mergeScenarioCards,
  previousScenario,
} from "./model";

function NoCareerCard() {
  return (
    <div className="glass w-[360px] p-6">
      <p className="font-mono text-[11px] tracking-[0.08em] text-fg-muted uppercase">No career yet</p>
      <h2 className="mt-2 font-serif text-[22px] font-medium">Choose a career to start</h2>
      <p className="mt-2 text-[14px] text-fg-muted">Pick the career you want to practise. Its projects appear on the map.</p>
      <Button
        variant="primary"
        className="mt-5"
        onClick={() => useUi.getState().openPanel("settings", { initialTab: "career" })}
      >
        Open career plan
      </Button>
    </div>
  );
}

function LoadingCard() {
  return (
    <div className="glass flex w-[360px] flex-col gap-4 p-5" aria-busy="true" aria-label="Loading projects">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="h-[168px] w-full rounded-card" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-10 w-full rounded-full" />
    </div>
  );
}

function ErrorCard({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div role="alert" className="glass w-[360px] p-6">
      <p className="font-mono text-[11px] tracking-[0.08em] text-danger uppercase">Could not load projects</p>
      <p className="mt-2 text-[14px] text-fg-muted">{message}</p>
      <Button variant="glass" className="mt-5" onClick={onRetry}>
        Try again
      </Button>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const user = useSession((s) => s.user);
  const careerId = user?.careerId ?? null;

  const scenariosQ = useApi("GET /scenarios", careerId ? {} : null, [careerId]);
  const progressQ = useApi("GET /progress");
  const careersQ = useApi("GET /careers");

  const career = useMemo(() => careersQ.data?.find((c) => c.id === careerId) ?? null, [careersQ.data, careerId]);
  const careerNode = careerNodeFor(careersQ.data ?? [], careerId);

  const cards = useMemo(
    () => mergeScenarioCards(scenariosQ.data ?? [], { limit: decorativeLimitFor(career) }),
    [scenariosQ.data, career],
  );
  const careerList = useMemo(
    () => (scenariosQ.data ? careerScenarios(cards, careerId) : []),
    [cards, careerId, scenariosQ.data],
  );

  const [pickedId, setPickedId] = useState<string | null>(null);
  const [direction, setDirection] = useState<1 | -1>(1);
  const defaultId = useMemo(() => defaultScenarioId(careerList), [careerList]);
  const selectedId = pickedId ?? defaultId;
  const selected = cards.find((c) => c.id === selectedId) ?? null;
  const selectedIndex = careerList.findIndex((c) => c.id === selectedId);

  const select = useCallback((id: string) => {
    setDirection(1);
    setPickedId(id);
  }, []);

  const step = useCallback(
    (delta: 1 | -1) => {
      if (careerList.length === 0) return;
      const next = careerList[cycleIndex(selectedIndex, delta, careerList.length)];
      if (!next) return;
      setDirection(delta);
      setPickedId(next.id);
    },
    [careerList, selectedIndex],
  );

  // Left and right arrows switch cards, unless the user is typing or a dialog is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (document.querySelector('[role="dialog"]')) return;
      e.preventDefault();
      step(e.key === "ArrowRight" ? 1 : -1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  const level = progressQ.data?.level ?? 0;
  const jobsUnlocked = isJobPortalUnlocked(progressQ.data?.completedScenarios ?? 0, JOB_PORTAL_UNLOCK_SCENARIOS);

  let right: ReactNode;
  if (!careerId) {
    right = <NoCareerCard />;
  } else if (scenariosQ.error && !scenariosQ.data) {
    right = <ErrorCard message={scenariosQ.error.message} onRetry={scenariosQ.reload} />;
  } else if (!scenariosQ.data) {
    right = <LoadingCard />;
  } else if (!selected) {
    right = (
      <div className="glass w-[360px] p-6 text-[14px] text-fg-muted">No projects for this career yet.</div>
    );
  } else {
    right = (
      <ScenarioCarousel
        card={selected}
        previous={previousScenario(cards, selected)}
        position={selectedIndex + 1}
        total={careerList.length}
        direction={direction}
        onStep={step}
      />
    );
  }

  return (
    <div className="relative h-full min-h-0 w-full overflow-hidden bg-night">
      <WorldMap cards={cards} currentCareerId={careerId} selectedId={selectedId} onSelect={select} />

      <header className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between px-6 pt-5">
        <span className="pointer-events-auto font-sans text-[15px] font-semibold tracking-tight text-fg">Proofwork</span>
        <div className="pointer-events-auto">
          <LevelPill level={level} />
        </div>
      </header>

      <div className="absolute top-1/2 right-6 -translate-y-1/2">{right}</div>

      {careerList.length > 0 && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2">
          <TimelineDock
            career={careerNode}
            cards={careerList}
            selectedId={selectedId}
            onSelect={select}
            jobsUnlocked={jobsUnlocked}
            onOpenJobs={() => navigate("/jobs")}
          />
        </div>
      )}
    </div>
  );
}
