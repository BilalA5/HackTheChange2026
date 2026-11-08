import { useState } from "react";
import { ArrowLeft, Sparkles, Info } from "lucide-react";
import type { Job, JobApplication } from "@pw/shared";
import { Badge, Button, Pill, Sheet, Skeleton, toast } from "@/components/ui";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { APPLY_DISCLAIMER, jobEligible } from "./careerHelpers";
import { ApplicationReview } from "./ApplicationReview";

export interface SheetState {
  jobId: string;
  view: "detail" | "review";
  /** Set when the review view should open a specific application. */
  applicationId: string | null;
}

interface JobSheetProps {
  open: boolean;
  job: Job | undefined;
  state: SheetState | null;
  level: number;
  applications: JobApplication[];
  onClose: () => void;
  onView: (next: SheetState) => void;
  onApplicationChange: (app: JobApplication) => void;
}

/** Right-hand sheet: the full job, then the assist-apply review form. */
export function JobSheet({ open, job, state, level, applications, onClose, onView, onApplicationChange }: JobSheetProps) {
  const title = job ? (state?.view === "review" ? `Review: ${job.title}` : job.title) : "Job";
  return (
    <Sheet open={open} onClose={onClose} title={title} width={540}>
      {job && state && <SheetBody job={job} state={state} level={level} applications={applications} onView={onView} onApplicationChange={onApplicationChange} />}
    </Sheet>
  );
}

function SheetBody({
  job,
  state,
  level,
  applications,
  onView,
  onApplicationChange,
}: {
  job: Job;
  state: SheetState;
  level: number;
  applications: JobApplication[];
  onView: (next: SheetState) => void;
  onApplicationChange: (app: JobApplication) => void;
}) {
  const [drafting, setDrafting] = useState(false);
  const eligible = jobEligible(job, level);

  if (state.view === "review") {
    const app = applications.find((a) => a.id === state.applicationId) ?? applications.find((a) => a.jobId === job.id);
    if (!app) return <Skeleton className="h-[200px]" />;
    return (
      <div className="flex flex-col gap-5">
        <button
          type="button"
          onClick={() => onView({ jobId: job.id, view: "detail", applicationId: null })}
          className="flex w-fit items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.08em] text-fg-muted hover:text-fg focus-visible:outline-2 focus-visible:outline-accent"
        >
          <ArrowLeft size={14} aria-hidden="true" /> Back to job
        </button>
        <ApplicationReview key={app.id} job={job} application={app} onSaved={onApplicationChange} />
      </div>
    );
  }

  const existing = applications.find((a) => a.jobId === job.id);
  const blockers: string[] = [];
  if (!job.autoApplicable) blockers.push("This role is not open to AI-drafted applications. Apply directly on the employer's site.");
  if (!eligible) blockers.push(`You need level ${job.minLevel} for this role. You are at level ${level}.`);
  const canDraft = blockers.length === 0;

  const draft = async () => {
    setDrafting(true);
    try {
      const app = await api("POST /jobs/:id/applications", { params: { id: job.id } });
      onApplicationChange(app);
      onView({ jobId: job.id, view: "review", applicationId: app.id });
    } catch (e) {
      toast({ title: "Could not draft the application", body: errorMessage(e), tone: "danger" });
    } finally {
      setDrafting(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-[13px] text-fg-muted">{job.company}</p>
        <p className="text-[14px] text-fg">
          {job.location}
          {job.remote ? " · Remote" : ""} · <span className="font-mono">{job.salary}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Pill tone={eligible ? "success" : "warning"}>{eligible ? "You are eligible" : `Requires level ${job.minLevel}`}</Pill>
          {job.autoApplicable && <Badge tone="accent">AI can draft</Badge>}
        </div>
      </div>

      <section aria-labelledby="desc-heading" className="flex flex-col gap-2">
        <h3 id="desc-heading" className="font-mono text-[11px] uppercase tracking-[0.08em] text-fg-muted">
          About the role
        </h3>
        <p className="text-[14px] leading-relaxed text-fg">{job.description}</p>
      </section>

      <section aria-labelledby="req-heading" className="flex flex-col gap-2">
        <h3 id="req-heading" className="font-mono text-[11px] uppercase tracking-[0.08em] text-fg-muted">
          Requirements
        </h3>
        <ul className="list-disc space-y-1.5 pl-5 text-[14px] text-fg">
          {job.requirements.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="elig-heading" className="flex flex-col gap-2">
        <h3 id="elig-heading" className="font-mono text-[11px] uppercase tracking-[0.08em] text-fg-muted">
          Eligibility
        </h3>
        <p className="text-[14px] text-fg-muted">
          {eligible ? `You meet the level ${job.minLevel} minimum.` : `Reach level ${job.minLevel} to apply. Finish projects to earn XP.`}
        </p>
      </section>

      <section aria-labelledby="assist-heading" className="glass flex flex-col gap-3 p-5">
        <h3 id="assist-heading" className="flex items-center gap-2 font-serif text-[18px] font-medium text-fg">
          <Sparkles size={16} className="text-accent" aria-hidden="true" /> Assist-apply
        </h3>
        <p className="text-[13px] text-fg-muted">
          The AI drafts answers from your Proofwork profile. You check every answer before you apply.
        </p>
        {blockers.map((b) => (
          <p key={b} className="text-[13px] text-warning">
            {b}
          </p>
        ))}
        <div className="flex flex-wrap gap-2">
          {existing ? (
            <Button variant="primary" onClick={() => onView({ jobId: job.id, view: "review", applicationId: existing.id })}>
              Open your application
            </Button>
          ) : (
            <Button variant="primary" loading={drafting} disabled={!canDraft} onClick={() => void draft()}>
              Draft application with AI
            </Button>
          )}
        </div>
        <p className="flex items-start gap-2 text-[12px] text-fg-muted">
          <Info size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
          {APPLY_DISCLAIMER}
        </p>
      </section>
    </div>
  );
}
