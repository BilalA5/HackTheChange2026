import type { MouseEvent, ReactNode } from "react";
import { ExternalLink, FileText } from "lucide-react";
import { RUBRIC_LEVEL_LABEL, type Company, type Rubric, type Stage, type StageProgress, type Submission, type SubmissionKind } from "@pw/shared";
import { pw } from "@/lib/bridge";
import { CompanyGlyph } from "@/components/domain/CompanyGlyph";
import { PerformanceBadge } from "@/components/domain/PerformanceBadge";
import { RubricView } from "@/components/domain/RubricView";
import { cn } from "@/lib/cn";
import { overallFromRubric } from "./helpers";

const LABEL = "font-mono text-[11px] font-medium tracking-[0.08em] text-muted uppercase";

/** Opens http(s) links in the system browser when running in the desktop app. */
export function openLink(href: string) {
  return (e: MouseEvent<HTMLAnchorElement>) => {
    if (!pw.isElectron) return;
    e.preventDefault();
    void pw.app.openExternal(href);
  };
}

export function ReviewHero({ company, title, completed, tagline }: { company: Company; title: string; completed: boolean; tagline: string }) {
  return (
    <section
      aria-label="Project summary"
      className="relative flex items-center gap-6 overflow-hidden rounded-card p-8 text-white"
      style={{ background: `linear-gradient(135deg, ${company.color}, color-mix(in srgb, ${company.color} 45%, #0b0c10))` }}
    >
      <CompanyGlyph company={company} size="lg" />
      <div className="min-w-0">
        <p className="font-mono text-[11px] font-medium tracking-[0.08em] uppercase opacity-80">{completed ? "Project complete" : "In progress"}</p>
        <h1 className="mt-1 font-serif text-[30px] leading-tight font-medium">{title}</h1>
        <p className="mt-1 text-[14px] opacity-85">
          {company.name} · {tagline}
        </p>
      </div>
    </section>
  );
}

export function StatCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="paper flex flex-col gap-2 p-5">
      <span className={LABEL}>{label}</span>
      {children}
    </div>
  );
}

export function OverallCard({ performance }: { performance: Rubric | null }) {
  return (
    <section aria-label="Overall performance" className="paper flex flex-col gap-4 p-6 md:col-span-2">
      <div className="flex items-center gap-3">
        <h2 className="font-serif text-[20px] font-medium text-ink">Overall performance</h2>
        <span className="ml-auto">
          <PerformanceBadge level={performance ? overallFromRubric(performance) : null} />
        </span>
      </div>
      {performance ? (
        <RubricView rubric={performance} variant="full" />
      ) : (
        <p className="text-[14px] text-muted italic">Not graded yet. Submit a stage to see your rubric here.</p>
      )}
    </section>
  );
}

const KIND_LABEL: Record<SubmissionKind, string> = { text: "Write-up", url: "Link", github: "Repository", file: "File", recording: "Recording" };

export function SubmissionItem({ submission }: { submission: Submission }) {
  const label = KIND_LABEL[submission.kind];
  if (submission.kind === "text") {
    return (
      <details className="rounded-xl bg-black/[0.03] px-3 py-2">
        <summary className="cursor-pointer text-[13px] text-ink">{label}</summary>
        <p className="mt-2 text-[13px] leading-relaxed whitespace-pre-wrap text-ink/85">{submission.value}</p>
      </details>
    );
  }
  const isLink = submission.kind === "url" || submission.kind === "github" || submission.kind === "file";
  const text = submission.fileName ?? submission.value;
  return (
    <div className="flex items-center gap-2 text-[13px]">
      <FileText size={13} strokeWidth={1.75} className="text-muted" aria-hidden="true" />
      <span className="text-muted">{label}:</span>
      {isLink ? (
        <a href={submission.value} target="_blank" rel="noopener noreferrer" onClick={openLink(submission.value)} className="inline-flex min-w-0 items-center gap-1 truncate text-accent hover:underline">
          <span className="truncate">{text}</span>
          <ExternalLink size={11} strokeWidth={1.75} aria-hidden="true" />
        </a>
      ) : (
        <span className="truncate">{text}</span>
      )}
    </div>
  );
}

export interface StageTimelineProps {
  stages: Stage[];
  progress: Record<string, StageProgress>;
}

/** Each stage with its status, overall level, expandable feedback and submissions. */
export function StageTimeline({ stages, progress }: StageTimelineProps) {
  return (
    <section aria-label="Stage timeline" className="flex flex-col gap-3">
      <h2 className="font-serif text-[20px] font-medium text-ink">Timeline</h2>
      <ol className="flex flex-col gap-3">
        {stages.map((s, i) => {
          const p = progress[s.id];
          const ev = p?.evaluation ?? null;
          return (
            <li key={s.id} className="paper flex gap-4 p-5">
              <span className="font-mono text-[12px] text-muted tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              <div className="flex min-w-0 flex-1 flex-col gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="font-serif text-[17px] font-semibold text-ink">{s.title}</h3>
                  <span className={cn("font-mono text-[11px] tracking-[0.06em] uppercase", p?.status === "completed" ? "text-success" : "text-muted")}>
                    {p ? statusText(p.status) : "Not started"}
                  </span>
                  {ev && <span className="ml-auto text-[12px] text-muted">{RUBRIC_LEVEL_LABEL[ev.overall]}</span>}
                </div>
                {ev ? (
                  <details className="group">
                    <summary className="cursor-pointer text-[14px] text-ink/85 group-open:mb-2">{ev.summary}</summary>
                    <RubricView rubric={ev.rubric} variant="compact" />
                  </details>
                ) : (
                  <p className="text-[13px] text-muted italic">No feedback yet.</p>
                )}
                {p && p.submissions.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {p.submissions.map((sub) => (
                      <SubmissionItem key={sub.id} submission={sub} />
                    ))}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function statusText(status: StageProgress["status"]): string {
  switch (status) {
    case "completed":
      return "Completed";
    case "submitted":
      return "Submitted";
    case "in_progress":
      return "In progress";
    case "available":
      return "Available";
    default:
      return "Locked";
  }
}

