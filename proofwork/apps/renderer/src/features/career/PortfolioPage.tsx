import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { Briefcase, Check, Download, Link2, Lock, Pencil, X } from "lucide-react";
import type { Portfolio, PortfolioProject } from "@pw/shared";
import { getCompany, getScenario } from "@pw/content";
import { CompanyGlyph, PerformanceBadge, XpChip } from "@/components/domain";
import { Button, EmptyState, GlassCard, IconButton, Input, Pill, Skeleton, Textarea, toast } from "@/components/ui";
import { api, useApi } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { useSession } from "@/stores/session";
import { companyInitials } from "./careerHelpers";

/** Public share host shown in the copied link. Preview only: the link is not live yet. */
const SHARE_ORIGIN = "https://proofwork.app/p/";

const RESUME_CSS = `
.pw-resume { display: none; }
@media print {
  body * { visibility: hidden !important; }
  .pw-resume, .pw-resume * { visibility: visible !important; }
  .pw-resume { display: block !important; position: absolute; left: 0; top: 0; width: 100%; padding: 32px; background: #fff; color: #111; }
  .pw-resume h2 { font-size: 14px; text-transform: uppercase; letter-spacing: .08em; margin: 20px 0 6px; }
  .pw-resume li { margin-bottom: 8px; }
}`;

export default function PortfolioPage() {
  const navigate = useNavigate();
  const name = useSession((s) => s.user?.name ?? "");
  const portfolio = useApi("GET /portfolio");

  if (portfolio.loading && !portfolio.data) {
    return (
      <div className="grid gap-4 p-8" aria-busy="true" aria-label="Loading portfolio">
        <Skeleton className="h-[120px]" />
        <Skeleton className="h-[200px]" />
      </div>
    );
  }

  if (portfolio.error && !portfolio.data) {
    return (
      <div className="p-8">
        <GlassCard className="mx-auto max-w-[480px] text-center">
          <p className="font-serif text-[20px] text-fg">Portfolio could not load</p>
          <p className="mt-2 text-[14px] text-fg-muted">{portfolio.error.message}</p>
          <Button className="mt-4" variant="glass" onClick={portfolio.reload}>
            Try again
          </Button>
        </GlassCard>
      </div>
    );
  }

  const data = portfolio.data;
  if (!data) return null;

  if (!data.unlocked) {
    return <LockedPortfolio onBack={() => navigate("/")} />;
  }

  return <UnlockedPortfolio name={name} portfolio={data} onChange={portfolio.mutate} />;
}

// ───────────────────────────── locked ─────────────────────────────

function LockedPortfolio({ onBack }: { onBack: () => void }) {
  return (
    <div className="relative min-h-full overflow-hidden p-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-8 flex flex-col gap-4 opacity-40 blur-[3px]">
        <div className="h-[110px] rounded-[22px] bg-white/10" />
        <div className="grid grid-cols-2 gap-4">
          <div className="h-[160px] rounded-[22px] bg-white/10" />
          <div className="h-[160px] rounded-[22px] bg-white/10" />
        </div>
      </div>
      <div className="relative mx-auto mt-16 max-w-[460px]">
        <GlassCard className="flex flex-col items-center gap-4 p-8 text-center">
          <div className="flex size-14 items-center justify-center rounded-full bg-white/8 text-fg-muted">
            <Lock size={22} aria-hidden="true" />
          </div>
          <h1 className="font-serif text-[26px] font-medium text-fg">Your portfolio is locked</h1>
          <p className="text-[14px] text-fg-muted">Finish your first project to unlock your portfolio. Each finished project becomes a case study you can share.</p>
          <Button variant="light" onClick={onBack}>
            Back to the map
          </Button>
        </GlassCard>
      </div>
    </div>
  );
}

// ───────────────────────────── unlocked ─────────────────────────────

function UnlockedPortfolio({ name, portfolio, onChange }: { name: string; portfolio: Portfolio; onChange: (next: Portfolio) => void }) {
  const shareUrl = `${SHARE_ORIGIN}${portfolio.shareSlug}`;

  const saveField = async (patch: { headline?: string; bio?: string }) => {
    const next = await api("PATCH /portfolio", { body: patch });
    onChange(next);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({ title: "Share link copied", body: "This is a preview link. Public sharing is not live yet.", tone: "success" });
    } catch (e) {
      toast({ title: "Could not copy the link", body: errorMessage(e), tone: "danger" });
    }
  };

  return (
    <div className="flex flex-col gap-6 p-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-fg-muted">Portfolio</p>
          <h1 className="mt-1 font-serif text-[32px] font-medium text-fg">{name || "Your portfolio"}</h1>
          <div className="mt-3 max-w-[640px]">
            <EditableText
              label="Headline"
              value={portfolio.headline}
              placeholder="A one-line summary of the work you do"
              display={(v) => <p className="text-[18px] text-fg">{v || "Add a headline"}</p>}
              onSave={(v) => saveField({ headline: v })}
            />
          </div>
          <div className="mt-3 max-w-[640px]">
            <EditableText
              label="Bio"
              multiline
              value={portfolio.bio}
              placeholder="Tell reviewers how you work"
              display={(v) => <p className="text-[14px] leading-relaxed text-fg-muted">{v || "Add a short bio"}</p>}
              onSave={(v) => saveField({ bio: v })}
            />
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="glass" icon={<Link2 size={16} />} onClick={() => void copyLink()}>
            Copy share link
          </Button>
          <Button variant="primary" icon={<Download size={16} />} onClick={() => window.print()}>
            Download résumé
          </Button>
        </div>
      </header>

      <p className="text-[12px] text-fg-muted">
        Preview link: <span className="font-mono">{shareUrl}</span>
      </p>

      <section aria-labelledby="skills-heading" className="flex flex-col gap-3">
        <h2 id="skills-heading" className="font-mono text-[11px] uppercase tracking-[0.08em] text-fg-muted">
          Skills
        </h2>
        {portfolio.skills.length === 0 ? (
          <p className="text-[14px] text-fg-muted">Skills appear here as you finish projects.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {portfolio.skills.map((skill) => (
              <Pill key={skill} tone="accent">
                {skill}
              </Pill>
            ))}
          </div>
        )}
      </section>

      <section aria-labelledby="projects-heading" className="flex flex-col gap-3">
        <h2 id="projects-heading" className="font-mono text-[11px] uppercase tracking-[0.08em] text-fg-muted">
          Projects
        </h2>
        {portfolio.projects.length === 0 ? (
          <EmptyState icon={<Briefcase size={18} />} title="No projects yet" body="Finished projects show up here as case studies." />
        ) : (
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
            {portfolio.projects.map((p) => (
              <ProjectCard key={p.scenarioId} project={p} />
            ))}
          </div>
        )}
      </section>

      <Resume portfolio={portfolio} name={name} />
    </div>
  );
}

function ProjectCard({ project }: { project: PortfolioProject }) {
  const scenario = getScenario(project.scenarioId);
  const company = scenario ? getCompany(scenario.companyId) : undefined;
  const glyph = company ?? { name: project.company, glyph: companyInitials(project.company), color: "#3A3D46" };
  const completed = new Date(project.completedAt);
  return (
    <GlassCard className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <CompanyGlyph company={glyph} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-[13px] text-fg-muted">{project.company}</p>
          <h3 className="truncate font-serif text-[18px] font-medium text-fg">{project.title}</h3>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <PerformanceBadge level={project.overall} />
        <XpChip amount={project.xp} />
        <span className="font-mono text-[11px] text-fg-muted">
          {Number.isNaN(completed.getTime()) ? "" : completed.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
        </span>
      </div>
      <p className="text-[14px] text-fg-muted">{project.summary}</p>
    </GlassCard>
  );
}

// ───────────────────────────── inline edit ─────────────────────────────

interface EditableTextProps {
  label: string;
  value: string;
  placeholder: string;
  multiline?: boolean;
  display: (value: string) => ReactNode;
  onSave: (value: string) => Promise<void>;
}

function EditableText({ label, value, placeholder, multiline = false, display, onSave }: EditableTextProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);

  const start = () => {
    setDraft(value);
    setEditing(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      await onSave(draft.trim());
      setEditing(false);
    } catch (e) {
      toast({ title: `${label} not saved`, body: errorMessage(e), tone: "danger" });
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">{display(value)}</div>
        <IconButton label={`Edit ${label.toLowerCase()}`} icon={<Pencil size={15} />} variant="ghost" size="sm" onClick={start} />
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        void save();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") setEditing(false);
      }}
    >
      {multiline ? (
        <Textarea label={label} value={draft} placeholder={placeholder} rows={4} onChange={(e) => setDraft(e.target.value)} autoFocus />
      ) : (
        <Input label={label} value={draft} placeholder={placeholder} maxLength={120} onChange={(e) => setDraft(e.target.value)} autoFocus />
      )}
      <div className="flex gap-2">
        <Button type="submit" size="sm" loading={saving} icon={<Check size={14} />}>
          Save
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)} icon={<X size={14} />}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

// ───────────────────────────── résumé (print only) ─────────────────────────────

function Resume({ portfolio, name }: { portfolio: Portfolio; name: string }) {
  return (
    <section className="pw-resume" aria-label="Résumé for printing">
      <style>{RESUME_CSS}</style>
      <h1 style={{ fontSize: 26, margin: 0 }}>{name || "Candidate"}</h1>
      <p style={{ margin: "4px 0 12px" }}>{portfolio.headline}</p>
      <p style={{ margin: 0 }}>{portfolio.bio}</p>
      <h2>Skills</h2>
      <p style={{ margin: 0 }}>{portfolio.skills.join(", ") || "None yet"}</p>
      <h2>Projects</h2>
      <ul style={{ paddingLeft: 18, margin: 0 }}>
        {portfolio.projects.map((p) => (
          <li key={p.scenarioId}>
            <strong>{p.title}</strong>, {p.company}. {p.overall} overall. {p.summary}
          </li>
        ))}
      </ul>
    </section>
  );
}
