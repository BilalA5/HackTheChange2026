import { useState, type ChangeEvent, type FormEvent } from "react";
import { Check, Sparkles } from "lucide-react";
import { CREDIT_COSTS, type Career, type CareerPathSummary, type PathRequest } from "@pw/shared";
import { ApiError, api, invalidate, useApi, type UseApiResult } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { toast } from "@/components/ui/Toaster";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Feedback";
import { Input, Textarea } from "@/components/ui/Fields";
import { Pill } from "@/components/ui/Labels";
import { cn } from "@/lib/cn";
import { useSession } from "@/stores/session";
import { useCredits } from "@/stores/credits";
import { useProgress } from "@/stores/progress";
import { useUi } from "@/stores/ui";
import { BuildingPath } from "../../onboarding/BuildingPath";
import { pathDraftFromVision, pathRequestFromDraft, type PathDraft } from "../../onboarding/pathRequest";
import { InlineConfirm, SettingsGroup, SettingsSection } from "../ui";

const PATH_COST = CREDIT_COSTS.path_generation.amount;

export function CareerTab() {
  const user = useSession((s) => s.user);
  const careers = useApi("GET /careers", {}, []);
  const pathQ = useApi("GET /me/path", {}, [user?.careerId]);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const list = careers.data ?? [];
  const current = list.find((c) => c.id === user?.careerId) ?? null;
  const pending: Career | null = list.find((c) => c.id === pendingId) ?? null;
  const vision = user?.vision ?? null;

  const switchCareer = async (career: Career) => {
    setBusy(true);
    setError(null);
    try {
      const updated = await api("PATCH /me", { body: { careerId: career.id } });
      useSession.getState().setUser(updated);
      invalidate("GET /scenarios");
      setPendingId(null);
      toast({ title: `Switched to ${career.title}`, body: "Your projects now follow this career.", tone: "success" });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <SettingsSection title="Current career" description="The career decides which projects appear on your map.">
        {careers.loading && !careers.data ? (
          <Skeleton className="h-24" />
        ) : current ? (
          <SettingsGroup>
            <div className="flex items-start gap-4">
              <span className="mt-1 size-3 shrink-0 rounded-full" style={{ background: current.color }} aria-hidden="true" />
              <div className="min-w-0">
                <div className="font-serif text-[18px] text-fg">{current.title}</div>
                <p className="mt-1 text-[13px] text-fg-muted">{current.tagline}</p>
              </div>
            </div>
            {current.skills.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {current.skills.map((skill) => (
                  <Pill key={skill}>{skill}</Pill>
                ))}
              </div>
            )}
          </SettingsGroup>
        ) : (
          <p className="text-[14px] text-fg-muted">No career selected yet. Pick one below to start.</p>
        )}
      </SettingsSection>

      <SettingsSection title="Your path" description="A path is written for you from your answers: three companies, three managers and five jobs.">
        <YourPath query={pathQ} />
        <BuildPathForm />
      </SettingsSection>

      <SettingsSection title="Vision" description="Set during onboarding. Change it from the vision board.">
        <SettingsGroup>
          {vision ? (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[14px]">
              <Field label="Target role" value={vision.targetRole} />
              <Field label="Level" value={vision.level} />
              <Field label="Industry" value={vision.industry} />
              <Field label="Company type" value={vision.companyType} />
              <Field label="Location" value={vision.location} />
              <Field label="Timeline" value={vision.timeline} />
              {vision.why && <Field label="Why" value={vision.why} wide />}
            </dl>
          ) : (
            <p className="text-[14px] text-fg-muted">No vision set yet.</p>
          )}
        </SettingsGroup>
      </SettingsSection>

      <SettingsSection title="Switch career" description="Your progress is kept per project, so switching never erases work.">
        {careers.error && (
          <div role="alert" className="flex items-center justify-between gap-3 text-[13px] text-danger">
            <span>Could not load careers.</span>
            <button type="button" className="underline" onClick={() => careers.reload()}>
              Try again
            </button>
          </div>
        )}
        <div role="radiogroup" aria-label="Career" className="grid grid-cols-1 gap-2">
          {list.map((career) => {
            const selected = career.id === current?.id;
            return (
              <button
                key={career.id}
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={busy}
                onClick={() => {
                  if (!selected) setPendingId(career.id);
                }}
                className={cn(
                  "flex items-center justify-between gap-4 rounded-card border px-4 py-3 text-left transition-colors duration-200",
                  selected ? "border-accent bg-accent/10" : "border-line bg-white/4 hover:bg-white/8",
                )}
              >
                <span className="min-w-0">
                  <span className="flex items-center gap-2 text-[14px] text-fg">
                    {career.title}
                    {career.generated && <Pill tone="accent">Your path</Pill>}
                  </span>
                  <span className="block truncate text-[12px] text-fg-muted">{career.tagline}</span>
                </span>
                {selected && <Check size={16} strokeWidth={1.75} className="shrink-0 text-accent" aria-label="Current career" />}
              </button>
            );
          })}
        </div>

        {pending && (
          <InlineConfirm
            title={`Switch to ${pending.title}?`}
            body="Progress is kept per project. Projects you finished or started in your current career stay saved, and you can switch back at any time."
            confirmLabel="Switch career"
            busy={busy}
            onConfirm={() => void switchCareer(pending)}
            onCancel={() => setPendingId(null)}
          >
            {error && (
              <p role="alert" className="text-[13px] text-danger">
                {error}
              </p>
            )}
          </InlineConfirm>
        )}
      </SettingsSection>
    </div>
  );
}

// ───────────────────────────── your path ─────────────────────────────

function YourPath({ query }: { query: UseApiResult<"GET /me/path"> }) {
  if (query.loading && !query.data) return <Skeleton className="h-32" />;
  if (query.error && !query.data) {
    return (
      <div role="alert" className="flex items-center justify-between gap-3 text-[13px] text-danger">
        <span>Could not load your path.</span>
        <button type="button" className="underline" onClick={query.reload}>
          Try again
        </button>
      </div>
    );
  }
  const path = query.data?.path ?? null;
  if (!path) {
    return <p className="text-[14px] text-fg-muted">You are on a ready-made career. Build your own path below.</p>;
  }
  return (
    <SettingsGroup>
      <PathSummary path={path} />
    </SettingsGroup>
  );
}

export function builtLabel(engine: CareerPathSummary["engine"], createdAt: string): string {
  const when = new Date(createdAt);
  const date = Number.isNaN(when.getTime())
    ? ""
    : when.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
  const by = engine === "live" ? "AI" : "practice generator";
  return date ? `Built ${date} by ${by}` : `Built by ${by}`;
}

function PathSummary({ path }: { path: CareerPathSummary }) {
  const req = path.request;
  const rows: [string, string | undefined][] = [
    ["Level", req.level],
    ["Industry", req.industry],
    ["Company type", req.companyType],
    ["Location", req.location],
    ["Timeline", req.timeline],
  ];
  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="font-serif text-[20px] text-fg">{path.title}</div>
        <p className="mt-1 font-mono text-[11px] tracking-[0.08em] text-fg-muted uppercase">{builtLabel(path.engine, path.createdAt)}</p>
      </div>
      <div>
        <p className="font-mono text-[11px] tracking-[0.08em] text-fg-muted uppercase">Projects</p>
        <ol className="mt-2 flex flex-col gap-1.5 text-[14px] text-fg">
          {path.scenarioTitles.map((t, i) => (
            <li key={`${i}-${t}`} className="flex gap-3">
              <span className="font-mono text-[12px] text-fg-muted">{i + 1}</span>
              <span className="min-w-0">{t}</span>
            </li>
          ))}
        </ol>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-[14px]">
        {rows.map(([label, value]) => (
          <Field key={label} label={label} value={value ?? ""} />
        ))}
      </dl>
    </div>
  );
}

// ───────────────────────────── build a new path ─────────────────────────────

/** Short fields shown in a two-column grid, in form order. */
const GRID_FIELDS: { key: "level" | "industry" | "companyType" | "location" | "timeline"; label: string }[] = [
  { key: "level", label: "Level" },
  { key: "industry", label: "Industry" },
  { key: "companyType", label: "Company type" },
  { key: "location", label: "Location" },
  { key: "timeline", label: "Timeline" },
];

function BuildPathForm() {
  const user = useSession((s) => s.user);
  const [draft, setDraft] = useState<PathDraft>(() => pathDraftFromVision(user?.vision ?? null));
  const [building, setBuilding] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [outOfCredits, setOutOfCredits] = useState(false);

  const set = (key: keyof PathDraft) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.value;
    setDraft((d) => ({ ...d, [key]: value }));
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (building) return;
    const body: PathRequest | null = pathRequestFromDraft(draft);
    if (!body) {
      setFormError("Enter the role you want to work towards.");
      return;
    }
    setFormError(null);
    setOutOfCredits(false);
    setBuilding(true);
    try {
      await api("POST /me/path", { body });
      await Promise.allSettled([useSession.getState().refreshUser(), useCredits.getState().refresh(), useProgress.getState().refresh()]);
      invalidate("GET /scenarios");
      invalidate("GET /careers");
      invalidate("GET /me/path");
      invalidate("GET /jobs");
      toast({ title: "Your new path is ready", tone: "success" });
    } catch (err) {
      if (err instanceof ApiError && (err.status === 402 || err.code === "insufficient_credits")) {
        setOutOfCredits(true);
      } else {
        setFormError(errorMessage(err));
      }
    } finally {
      setBuilding(false);
    }
  };

  if (building) {
    return (
      <SettingsGroup>
        <BuildingPath compact industry={draft.industry} roleTitle={draft.targetRole} />
      </SettingsGroup>
    );
  }

  return (
    <form onSubmit={(e) => void submit(e)} className="flex flex-col gap-4" aria-label="Build a new path">
      <div className="flex flex-col gap-1">
        <h3 className="font-serif text-[18px] text-fg">Build a new path</h3>
        <p className="text-[13px] text-fg-muted">
          Costs {PATH_COST} credits. This makes your new path your career. Your earlier projects stay saved.
        </p>
      </div>

      {outOfCredits && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-warning/40 bg-warning/10 px-4 py-3 text-[13px] text-fg">
          <span>Not enough credits. A new path costs {PATH_COST} credits.</span>
          <Button variant="glass" size="sm" onClick={() => useUi.getState().openPanel("credits")}>
            Get credits
          </Button>
        </div>
      )}

      <Input
        label="Target role (required)"
        required
        aria-required="true"
        placeholder="Any job title you want"
        value={draft.targetRole}
        onChange={set("targetRole")}
        maxLength={120}
      />
      <div className="grid grid-cols-2 gap-4">
        {GRID_FIELDS.map((f) => (
          <Input key={f.key} label={f.label} value={draft[f.key]} onChange={set(f.key)} maxLength={120} />
        ))}
      </div>
      <Textarea label="Why" rows={2} maxRows={6} value={draft.why} onChange={set("why")} placeholder="What draws you to this work" />
      <Textarea label="Background" rows={2} maxRows={6} value={draft.background} onChange={set("background")} placeholder="What you already know: studies, a current job, skills" />

      {formError && (
        <p role="alert" className="text-[13px] text-danger">
          {formError}
        </p>
      )}

      <div className="flex items-center justify-between gap-4">
        <span className="font-mono text-[11px] tracking-[0.08em] text-fg-muted uppercase">Costs {PATH_COST} credits</span>
        <Button type="submit" variant="primary" icon={<Sparkles size={15} aria-hidden="true" />} disabled={building}>
          Build a new path
        </Button>
      </div>
    </form>
  );
}

function Field({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return (
    <div className={cn("min-w-0", wide && "col-span-2")}>
      <dt className="font-mono text-[11px] tracking-[0.08em] text-fg-muted uppercase">{label}</dt>
      <dd className="mt-0.5 text-fg">{value || "Not set"}</dd>
    </div>
  );
}
