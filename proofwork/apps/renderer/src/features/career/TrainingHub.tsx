import { Link } from "react-router";
import { GlassCard, Pill } from "@/components/ui";
import { TRAINING_KINDS, TRAINING_KIND_LABEL } from "./careerHelpers";
import type { TrainingLibrary } from "./useTrainingLibrary";
import type { TrainingKind } from "@pw/shared";

const BLURB: Record<TrainingKind, string> = {
  skill: "Hands-on methods you can apply on the job tomorrow.",
  mindset: "How to frame problems, make calls and recover from mistakes.",
  communication: "Write, present and align people so the work lands.",
};

/** Abstract art per kind, drawn in CSS and SVG only. */
function KindArt({ kind }: { kind: TrainingKind }) {
  const common = "absolute inset-0 size-full";
  if (kind === "skill") {
    return (
      <svg aria-hidden="true" viewBox="0 0 320 160" preserveAspectRatio="xMidYMid slice" className={common}>
        <rect x="0" y="0" width="320" height="160" fill="var(--color-accent)" opacity="0.18" />
        <circle cx="250" cy="48" r="70" fill="var(--color-accent)" opacity="0.55" />
        <rect x="36" y="78" width="120" height="44" rx="22" fill="var(--color-xp)" opacity="0.7" />
        <rect x="120" y="110" width="150" height="18" rx="9" fill="var(--color-success)" opacity="0.55" />
      </svg>
    );
  }
  if (kind === "mindset") {
    return (
      <svg aria-hidden="true" viewBox="0 0 320 160" preserveAspectRatio="xMidYMid slice" className={common}>
        <rect x="0" y="0" width="320" height="160" fill="var(--color-xp)" opacity="0.12" />
        <path d="M0 120 Q 80 60 160 110 T 320 90 L320 160 L0 160Z" fill="var(--color-xp)" opacity="0.5" />
        <circle cx="90" cy="46" r="26" fill="var(--color-accent)" opacity="0.65" />
        <circle cx="236" cy="62" r="40" fill="var(--color-success)" opacity="0.35" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 320 160" preserveAspectRatio="xMidYMid slice" className={common}>
      <rect x="0" y="0" width="320" height="160" fill="var(--color-success)" opacity="0.12" />
      <rect x="40" y="30" width="110" height="70" rx="18" fill="var(--color-success)" opacity="0.5" />
      <rect x="150" y="70" width="130" height="60" rx="18" fill="var(--color-accent)" opacity="0.5" />
      <circle cx="280" cy="24" r="18" fill="var(--color-xp)" opacity="0.7" />
    </svg>
  );
}

export function TrainingHub({ library }: { library: TrainingLibrary }) {
  const all = library.trainings ?? [];
  return (
    <div className="flex flex-col gap-6 p-8">
      <header>
        <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-fg-muted">Training</p>
        <h1 className="mt-1 font-serif text-[32px] font-medium text-fg">Build the skills the job needs</h1>
      </header>
      <div className="grid gap-5 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
        {TRAINING_KINDS.map((kind) => {
          const count = all.filter((t) => t.kind === kind && library.library.has(t.id)).length;
          return (
            <Link
              key={kind}
              to={`/training/${kind}`}
              aria-label={`${TRAINING_KIND_LABEL[kind]}: ${count} in your library`}
              className="group focus-visible:outline-none"
            >
              <GlassCard className="flex h-full flex-col overflow-hidden !p-0 transition-transform duration-200 group-hover:-translate-y-0.5 group-focus-visible:ring-2 group-focus-visible:ring-accent">
                <div className="relative h-[160px] overflow-hidden">
                  <KindArt kind={kind} />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-serif text-[22px] font-medium text-fg">{TRAINING_KIND_LABEL[kind]}</h2>
                    <Pill tone="accent">{count} in library</Pill>
                  </div>
                  <p className="text-[14px] text-fg-muted">{BLURB[kind]}</p>
                </div>
              </GlassCard>
            </Link>
          );
        })}
      </div>
      {library.error && <p className="text-[13px] text-danger">Some counts may be out of date: {library.error.message}</p>}
    </div>
  );
}
