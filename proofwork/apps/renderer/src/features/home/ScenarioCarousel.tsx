// Right-hand glass card: one project at a time, with prev/next, status-dependent body and the main action.
import { useId, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { RUBRIC_LEVEL_LABEL, type ScenarioCard } from "@pw/shared";
import { ApiError, useApi } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { Button, IconButton } from "@/components/ui/Button";
import { MonoLabel } from "@/components/ui/Labels";
import { toast } from "@/components/ui/Toaster";
import { RubricView } from "@/components/domain/RubricView";
import { CompanyGlyph } from "@/components/domain/CompanyGlyph";
import { NpcAvatar } from "@/components/domain/NpcAvatar";
import { XpChip } from "@/components/domain/XpChip";
import { shadeHex } from "./geometry";
import { formatDifficulty, formatDuration, statusLabel } from "./model";
import { resolveScenarioRoute } from "./openScenario";

export interface ScenarioCarouselProps {
  card: ScenarioCard;
  /** The project before this one in its career, used for the locked message. */
  previous: ScenarioCard | null;
  /** 1-based position in the learner's career, or 0 when the selected project belongs to another career. */
  position: number;
  total: number;
  direction: 1 | -1;
  onStep: (delta: 1 | -1) => void;
}

const pad2 = (n: number) => String(n).padStart(2, "0");

function StatRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <dt>
        <MonoLabel>{label}</MonoLabel>
      </dt>
      <dd className="text-right text-[13px]">{children}</dd>
    </div>
  );
}

/** The performance level. Hover or focus shows the full rubric from the objective. */
function PerformanceValue({ card }: { card: ScenarioCard }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const objective = useApi("GET /objectives/:id", card.objectiveId ? { params: { id: card.objectiveId } } : null, [card.objectiveId]);
  if (!card.performance) return <span className="text-fg-muted">Not graded yet</span>;
  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
        className="cursor-help rounded-full font-medium underline decoration-dotted underline-offset-4"
      >
        {RUBRIC_LEVEL_LABEL[card.performance]}
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className="glass absolute right-0 bottom-full z-20 mb-2 block w-[300px] p-4 text-left"
        >
          {objective.data?.performance ? (
            <RubricView rubric={objective.data.performance} variant="full" />
          ) : (
            <span className="text-[13px] text-fg-muted">{objective.error ? "Rubric unavailable." : "Loading rubric..."}</span>
          )}
        </span>
      )}
    </span>
  );
}

function CardBody({ card, previous }: { card: ScenarioCard; previous: ScenarioCard | null }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const { company, npc } = card;

  const open = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const route = await resolveScenarioRoute(card);
      navigate(route);
    } catch (e) {
      if (e instanceof ApiError && e.status === 403 && e.code === "locked") {
        toast({ title: "This project is locked", body: e.message, tone: "warning" });
      } else {
        toast({ title: "Could not open the project", body: errorMessage(e), tone: "danger" });
      }
    } finally {
      setBusy(false);
    }
  };

  const started = card.status === "in_progress" || card.status === "completed";

  return (
    <div className="flex flex-col gap-4">
      <div
        className="relative h-[168px] overflow-hidden rounded-card p-4"
        style={{ background: `linear-gradient(145deg, ${company.color}, ${shadeHex(company.color, -0.45)})` }}
      >
        <span aria-hidden="true" className="absolute -top-12 -right-12 size-44 rounded-full border border-white/15" />
        <span aria-hidden="true" className="absolute top-8 -right-3 size-24 rounded-full border border-white/10" />
        <div className="relative flex items-start justify-between">
          <span className="rounded-xl ring-1 ring-white/40">
            <CompanyGlyph company={company} size="sm" />
          </span>
          <MonoLabel className="text-white/80">{card.difficulty}</MonoLabel>
        </div>
        <p className="absolute right-4 bottom-3 left-4 font-sans text-[36px] leading-[0.92] font-black tracking-[-0.02em] break-words text-white uppercase">
          {card.coverWord}
        </p>
      </div>

      <div>
        <h2 className="text-[18px] leading-snug font-semibold">{card.title}</h2>
        <div className="mt-3 flex items-center gap-3">
          <NpcAvatar name={npc.name} seed={npc.avatarSeed} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-[13px] font-medium">{npc.name}</p>
            <p className="truncate text-[12px] text-fg-muted">
              {npc.role} · {company.name}
            </p>
          </div>
        </div>
      </div>

      {started ? (
        <>
          <dl className="divide-y divide-line">
            <StatRow label="Performance">
              <PerformanceValue card={card} />
            </StatRow>
            <StatRow label="Time spent">{formatDuration(card.timeSpentSec / 60)}</StatRow>
            <StatRow label="XP earned">
              <XpChip amount={card.xpEarned} />
            </StatRow>
          </dl>
          <Button variant="light" size="lg" className="w-full" loading={busy} onClick={() => void open()}>
            {card.status === "completed" ? "Review" : "Continue"}
          </Button>
        </>
      ) : card.status === "available" ? (
        <>
          <p className="text-[13px] text-fg-muted">
            Earn up to {card.maxXp} XP · ~{formatDuration(card.estMinutes)} · {formatDifficulty(card.difficulty)}
          </p>
          <Button variant="primary" size="lg" className="w-full" loading={busy} onClick={() => void open()}>
            Start project
          </Button>
        </>
      ) : (
        <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-fg-muted">
            <Lock size={16} strokeWidth={1.75} aria-hidden="true" />
          </span>
          <p className="text-[13px] text-fg-muted">
            {previous ? (
              <>
                Finish <span className="text-fg">{previous.title}</span> to unlock
              </>
            ) : (
              <>
                {statusLabel(card.status)}: finish the projects before it to unlock
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

/** The project card. Cross-fades with an x offset; arrow keys are handled by the page. */
export function ScenarioCarousel({ card, previous, position, total, direction, onStep }: ScenarioCarouselProps) {
  const reduced = useReducedMotion() ?? false;
  const offset = reduced ? 0 : 24;

  return (
    <section aria-label="Selected project" className="glass flex w-[360px] flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <MonoLabel>{position > 0 ? `${pad2(position)} / ${pad2(total)}` : "Preview"}</MonoLabel>
        <div className="flex items-center gap-1">
          <IconButton label="Previous project" size="sm" icon={<ChevronLeft size={16} strokeWidth={1.75} />} onClick={() => onStep(-1)} disabled={total < 1} />
          <IconButton label="Next project" size="sm" icon={<ChevronRight size={16} strokeWidth={1.75} />} onClick={() => onStep(1)} disabled={total < 1} />
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false} custom={direction}>
        <motion.div
          key={card.id}
          custom={direction}
          variants={{
            enter: (d: number) => ({ opacity: 0, x: offset * d }),
            center: { opacity: 1, x: 0 },
            exit: (d: number) => ({ opacity: 0, x: -offset * d }),
          }}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: reduced ? 0 : 0.22, ease: "easeOut" }}
        >
          <CardBody card={card} previous={previous} />
        </motion.div>
      </AnimatePresence>
    </section>
  );
}

