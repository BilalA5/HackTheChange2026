import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Lock } from "lucide-react";
import type { Job, JobApplication } from "@pw/shared";
import { Button, EmptyState, GlassCard, ProgressBar, Skeleton, Tabs, Pill } from "@/components/ui";
import { useApi } from "@/lib/api";
import { useProgress } from "@/stores/progress";
import { JobsBoard } from "./JobsBoard";
import { JobSheet, type SheetState } from "./JobSheet";
import { MyApplications } from "./MyApplications";

type JobsTab = "jobs" | "applications";

const TABS: { id: JobsTab; label: string }[] = [
  { id: "jobs", label: "Jobs" },
  { id: "applications", label: "My applications" },
];

/** Job portal. Locked until the first project is complete. Assist-apply keeps a human in the loop. */
export default function JobsPage() {
  const navigate = useNavigate();
  const jobsRes = useApi("GET /jobs");
  const appsRes = useApi("GET /applications");
  const progress = useProgress((s) => s.data);
  const progressError = useProgress((s) => s.error);
  const level = progress?.level ?? 0;
  const [tab, setTab] = useState<JobsTab>("jobs");
  const [sheet, setSheet] = useState<SheetState | null>(null);

  useEffect(() => {
    void useProgress.getState().refresh();
  }, []);

  const jobs = useMemo<Job[]>(() => jobsRes.data?.jobs ?? [], [jobsRes.data]);
  const applications = useMemo<JobApplication[]>(() => appsRes.data ?? [], [appsRes.data]);
  const jobById = useMemo(() => new Map(jobs.map((j) => [j.id, j])), [jobs]);

  if (jobsRes.loading && !jobsRes.data) {
    return (
      <div className="grid gap-4 p-8" aria-busy="true" aria-label="Loading job portal">
        <Skeleton className="h-[48px] w-[260px]" />
        <Skeleton className="h-[160px]" />
      </div>
    );
  }

  if (jobsRes.error && !jobsRes.data) {
    return (
      <div className="p-8">
        <GlassCard className="mx-auto max-w-[480px] text-center">
          <p className="font-serif text-[20px] text-fg">The job portal could not load</p>
          <p className="mt-2 text-[14px] text-fg-muted">{jobsRes.error.message}</p>
          <Button className="mt-4" variant="glass" onClick={jobsRes.reload}>
            Try again
          </Button>
        </GlassCard>
      </div>
    );
  }

  if (!jobsRes.data?.unlocked) {
    return <LockedJobs completed={progress?.completedScenarios ?? 0} loaded={progress !== null} error={progressError} onBack={() => navigate("/")} />;
  }

  const sheetJob = sheet ? jobById.get(sheet.jobId) : undefined;

  return (
    <div className="flex flex-col gap-6 p-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-fg-muted">Job portal</p>
          <h1 className="mt-1 font-serif text-[32px] font-medium text-fg">Find your next role</h1>
        </div>
        <Tabs<JobsTab> tabs={TABS} value={tab} onChange={setTab} label="Job portal sections" />
      </header>

      {tab === "jobs" ? (
        <JobsBoard jobs={jobs} level={level} loading={jobsRes.loading} onOpen={(jobId) => setSheet({ jobId, view: "detail", applicationId: null })} />
      ) : appsRes.error && !appsRes.data ? (
        <GlassCard className="text-center">
          <p className="text-[14px] text-fg-muted">Your applications could not load: {appsRes.error.message}</p>
          <Button className="mt-3" variant="glass" onClick={appsRes.reload}>
            Try again
          </Button>
        </GlassCard>
      ) : appsRes.loading && !appsRes.data ? (
        <Skeleton className="h-[160px]" />
      ) : applications.length === 0 ? (
        <EmptyState
          title="No applications yet"
          body="Open a job and draft an application with AI. You review every answer before you apply on the employer's site."
          action={
            <Button variant="glass" onClick={() => setTab("jobs")}>
              Browse jobs
            </Button>
          }
        />
      ) : (
        <MyApplications
          applications={applications}
          jobById={jobById}
          onOpen={(app) => setSheet({ jobId: app.jobId, view: "review", applicationId: app.id })}
        />
      )}

      <JobSheet
        open={sheet !== null && sheetJob !== undefined}
        job={sheetJob}
        state={sheet}
        level={level}
        applications={applications}
        onClose={() => setSheet(null)}
        onView={(next) => setSheet(next)}
        onApplicationChange={(app) => {
          appsRes.mutate((prev) => [app, ...(prev ?? []).filter((a) => a.id !== app.id)]);
        }}
      />
    </div>
  );
}

function LockedJobs({ completed, loaded, error, onBack }: { completed: number; loaded: boolean; error: string | null; onBack: () => void }) {
  const needed = 1;
  const ratio = Math.min(1, completed / needed);
  return (
    <div className="flex h-full items-start justify-center p-8">
      <GlassCard className="mt-12 flex w-full max-w-[480px] flex-col items-center gap-4 p-8 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-white/8 text-fg-muted">
          <Lock size={22} aria-hidden="true" />
        </div>
        <h1 className="font-serif text-[26px] font-medium text-fg">Job portal unlocks after you complete 1 project</h1>
        <p className="text-[14px] text-fg-muted">Finish one project on the map and the portal opens with roles matched to your level.</p>
        <div className="w-full text-left">
          <div className="mb-2 flex items-center justify-between font-mono text-[11px] text-fg-muted">
            <span>Progress</span>
            <span>
              {Math.min(completed, needed)} of {needed} project{needed === 1 ? "" : "s"}
            </span>
          </div>
          <ProgressBar value={loaded ? ratio : 0} label="Progress to job portal" />
          {error && <p className="mt-2 text-[12px] text-danger">{error}</p>}
        </div>
        <Button variant="light" onClick={onBack}>
          Go to the map
        </Button>
        <Pill tone="neutral">Locked</Pill>
      </GlassCard>
    </div>
  );
}
