// Bottom-centre glass pill: career node, one node per project in the learner's career, then the job portal.
import { Fragment } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Briefcase, Lock } from "lucide-react";
import type { Career, ScenarioCard, ScenarioStatus } from "@pw/shared";
import { CompanyGlyph } from "@/components/domain/CompanyGlyph";
import { Tooltip } from "@/components/ui/Tooltip";
import { toast } from "@/components/ui/Toaster";
import { initialsOf } from "@/components/domain";
import { cn } from "@/lib/cn";
import { statusLabel } from "./model";

export interface TimelineDockProps {
  career: Pick<Career, "title" | "color"> | null;
  cards: readonly ScenarioCard[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  jobsUnlocked: boolean;
  onOpenJobs: () => void;
}

/** Ring colour by status: completed mint, in progress violet, available white, locked dim. */
const RING: Record<ScenarioStatus, string> = {
  completed: "ring-success",
  in_progress: "ring-accent",
  available: "ring-white/80",
  locked: "ring-white/15",
};

function Connector() {
  return <span aria-hidden="true" className="h-px w-4 shrink-0 bg-white/20" />;
}

export function TimelineDock({ career, cards, selectedId, onSelect, jobsUnlocked, onOpenJobs }: TimelineDockProps) {
  const reduced = useReducedMotion() ?? false;
  const nodeClass = "relative flex size-10 shrink-0 items-center justify-center rounded-xl ring-2 ring-offset-2 ring-offset-night-2 transition-transform duration-200 ease-out hover:scale-105 focus-visible:scale-105 focus-visible:outline-none motion-reduce:transition-none";

  let index = 0;
  const stagger = () => {
    const delay = reduced ? 0 : index * 0.05;
    index += 1;
    return { initial: { opacity: 0, y: reduced ? 0 : 8 }, animate: { opacity: 1, y: 0 }, transition: { delay, duration: 0.24, ease: "easeOut" as const } };
  };

  const careerInitials = career ? initialsOf(career.title) : "?";
  const careerNode = (
    <motion.div {...stagger()} className="flex">
      <Tooltip content={career ? `Career: ${career.title}` : "No career yet"}>
        <span
          role="img"
          aria-label={career ? `Career: ${career.title}` : "No career yet"}
          className="flex size-10 items-center justify-center rounded-full font-mono text-[12px] font-semibold text-white/95 ring-2 ring-white/30 ring-offset-2 ring-offset-night-2"
          style={{ backgroundColor: career?.color ?? "var(--color-night)" }}
        >
          {careerInitials}
        </span>
      </Tooltip>
    </motion.div>
  );

  const scenarioNodes = cards.map((card) => {
    const selected = card.id === selectedId;
    const locked = card.status === "locked";
    const label = `${card.title}, ${statusLabel(card.status)}`;
    return (
      <Fragment key={card.id}>
        <Connector />
        <motion.div {...stagger()} className="flex">
        <Tooltip content={label}>
          <button
            type="button"
            aria-label={label}
            aria-pressed={selected}
            onClick={() => onSelect(card.id)}
            className={cn(nodeClass, RING[card.status], selected && "scale-110")}
          >
            <span className={cn("inline-flex", locked && "opacity-45 grayscale")}>
              <CompanyGlyph company={card.company} size="md" />
            </span>
            {locked && (
              <span aria-hidden="true" className="absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-full bg-night text-fg-muted">
                <Lock size={10} strokeWidth={2} />
              </span>
            )}
          </button>
        </Tooltip>
        </motion.div>
      </Fragment>
    );
  });

  const jobLabel = jobsUnlocked ? "Job portal, open" : "Job portal, locked until you finish a project";
  const jobNode = (
    <motion.div {...stagger()} className="flex">
      <Tooltip content={jobLabel}>
        <button
          type="button"
          aria-label={jobLabel}
          aria-disabled={!jobsUnlocked}
          onClick={() => {
            if (jobsUnlocked) onOpenJobs();
            else toast({ title: "Job portal is locked", body: "Finish one project to unlock it.", tone: "neutral" });
          }}
          className={cn(
            nodeClass,
            "bg-white/10 text-fg",
            jobsUnlocked ? "ring-white/80" : "ring-white/15 text-fg-muted",
          )}
        >
          <Briefcase size={18} strokeWidth={1.75} aria-hidden="true" className={cn(!jobsUnlocked && "opacity-45")} />
          {!jobsUnlocked && (
            <span aria-hidden="true" className="absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-full bg-night text-fg-muted">
              <Lock size={10} strokeWidth={2} />
            </span>
          )}
        </button>
      </Tooltip>
    </motion.div>
  );

  return (
    <nav aria-label="Project timeline" className="glass flex items-center gap-2.5 rounded-full px-4 py-2.5">
      {careerNode}
      {scenarioNodes}
      <Connector />
      {jobNode}
    </nav>
  );
}
