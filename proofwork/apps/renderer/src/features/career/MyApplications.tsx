import { useMemo } from "react";
import { Briefcase } from "lucide-react";
import type { Job, JobApplication } from "@pw/shared";
import { GlassCard, Pill } from "@/components/ui";
import { APPLICATION_STATUS_LABEL, APPLICATION_STATUS_TONE } from "./applicationStatus";

interface MyApplicationsProps {
  applications: JobApplication[];
  jobById: ReadonlyMap<string, Job>;
  onOpen: (app: JobApplication) => void;
}

/** Applications newest first. Each row opens the review form. */
export function MyApplications({ applications, jobById, onOpen }: MyApplicationsProps) {
  const sorted = useMemo(
    () => [...applications].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [applications],
  );
  return (
    <ul className="flex flex-col gap-3" aria-label="My applications">
      {sorted.map((app) => {
        const job = jobById.get(app.jobId);
        const last = app.log[app.log.length - 1];
        return (
          <li key={app.id}>
            <button
              type="button"
              onClick={() => onOpen(app)}
              aria-label={`${job?.title ?? "Application"}, ${APPLICATION_STATUS_LABEL[app.status]}. Open review`}
              className="block w-full rounded-glass text-left focus-visible:outline-2 focus-visible:outline-accent"
            >
              <GlassCard className="flex flex-wrap items-center justify-between gap-4 transition-colors hover:bg-white/[0.06]">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-fg-muted" aria-hidden="true">
                    <Briefcase size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-serif text-[17px] font-medium text-fg">{job?.title ?? "Unknown role"}</p>
                    <p className="truncate text-[13px] text-fg-muted">{job?.company ?? ""}</p>
                  </div>
                </div>
                <div className="flex min-w-0 flex-col items-end gap-1">
                  <Pill tone={APPLICATION_STATUS_TONE[app.status]}>{APPLICATION_STATUS_LABEL[app.status]}</Pill>
                  {last && <span className="max-w-[320px] truncate text-[12px] text-fg-muted">{last.text}</span>}
                </div>
              </GlassCard>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
