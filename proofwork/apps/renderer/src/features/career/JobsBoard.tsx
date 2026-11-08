import { useMemo, useState } from "react";
import type { Job } from "@pw/shared";
import { Badge, Button, GlassCard, Pill, Select, Skeleton, Switch, EmptyState } from "@/components/ui";
import { useApi } from "@/lib/api";
import { useSession } from "@/stores/session";
import { companyInitials, filterJobs, jobEligible } from "./careerHelpers";

interface JobsBoardProps {
  jobs: Job[];
  level: number;
  loading: boolean;
  onOpen: (jobId: string) => void;
}

/** Filters and job cards. The default career is the learner's own career. */
export function JobsBoard({ jobs, level, loading, onOpen }: JobsBoardProps) {
  const userCareer = useSession((s) => s.user?.careerId ?? null);
  const careersRes = useApi("GET /careers");
  // Default to the learner's own career, generated or not. The title comes from GET /careers.
  const [careerId, setCareerId] = useState<string>(userCareer ?? "all");
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [eligibleOnly, setEligibleOnly] = useState(false);

  const visible = useMemo(
    () => filterJobs(jobs, { careerId, remoteOnly, eligibleOnly }, level),
    [jobs, careerId, remoteOnly, eligibleOnly, level],
  );

  const careerOptions = useMemo(
    () => [
      { value: "all", label: "All careers" },
      ...(careersRes.data ?? []).map((c) => ({ value: c.id, label: c.generated ? `${c.title} (your path)` : c.title })),
    ],
    [careersRes.data],
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end gap-5">
        <div className="w-[240px]">
          <Select label="Career" options={careerOptions} value={careerId} onValueChange={setCareerId} />
          {careersRes.error && (
            <div role="alert" className="mt-2 flex items-center gap-2 text-[12px] text-danger">
              <span>Could not load careers.</span>
              <Button variant="ghost" size="sm" onClick={careersRes.reload}>
                Try again
              </Button>
            </div>
          )}
        </div>
        <Switch checked={remoteOnly} onCheckedChange={setRemoteOnly} label="Remote only" />
        <Switch checked={eligibleOnly} onCheckedChange={setEligibleOnly} label="Eligible only" />
        <p className="ml-auto font-mono text-[11px] text-fg-muted" aria-live="polite">
          {visible.length} role{visible.length === 1 ? "" : "s"}
        </p>
      </div>

      {loading && jobs.length === 0 ? (
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]" aria-busy="true">
          <Skeleton className="h-[150px]" />
          <Skeleton className="h-[150px]" />
        </div>
      ) : visible.length === 0 ? (
        <EmptyState title="No roles match these filters" body="Try another career, or turn off Remote only or Eligible only." />
      ) : (
        <ul className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
          {visible.map((job) => (
            <li key={job.id}>
              <JobCard job={job} eligible={jobEligible(job, level)} onOpen={() => onOpen(job.id)} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function JobCard({ job, eligible, onOpen }: { job: Job; eligible: boolean; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${job.title} at ${job.company}. Open details`}
      className="block h-full w-full rounded-glass text-left focus-visible:outline-2 focus-visible:outline-accent"
    >
      <GlassCard className="flex h-full flex-col gap-3 transition-colors hover:bg-white/[0.06]">
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/12 font-mono text-[13px] font-semibold text-fg"
          >
            {companyInitials(job.company)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12px] text-fg-muted">{job.company}</p>
            <h3 className="font-serif text-[18px] font-medium leading-snug text-fg">{job.title}</h3>
          </div>
        </div>
        <p className="text-[13px] text-fg-muted">
          {job.location}
          {job.remote ? " · Remote" : ""}
        </p>
        <p className="font-mono text-[12px] text-fg">{job.salary}</p>
        <div className="mt-auto flex flex-wrap gap-2">
          <Pill tone={eligible ? "success" : "warning"}>{eligible ? "Eligible" : `Needs level ${job.minLevel}`}</Pill>
          {job.autoApplicable && <Badge tone="accent">AI can draft</Badge>}
        </div>
      </GlassCard>
    </button>
  );
}
