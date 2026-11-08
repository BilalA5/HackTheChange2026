// Vision board: a paper-style sheet with the learner's vision. Fields edit inline. Save sends PATCH /me.
import { useMemo, useState } from "react";
import { Link } from "react-router";
import type { VisionBoard } from "@pw/shared";
import { api, useApi } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { cn } from "@/lib/cn";
import { useSession } from "@/stores/session";
import type { PanelProps } from "@/stores/ui";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { EmptyState, Skeleton } from "@/components/ui/Feedback";
import { MonoLabel } from "@/components/ui/Labels";
import { toast } from "@/components/ui/Toaster";
import {
  VISION_LABELS,
  draftFromVision,
  eligibleJobCount,
  isVisionDraftDirty,
  visionPatchFromDraft,
  type VisionDraft,
  type VisionTextField,
} from "./model";

const FIELDS: { key: VisionTextField; placeholder: string; multiline?: boolean }[] = [
  { key: "targetRole", placeholder: "e.g. AI Engineer" },
  { key: "level", placeholder: "e.g. Junior" },
  { key: "industry", placeholder: "e.g. Retail" },
  { key: "companyType", placeholder: "e.g. Scale-up" },
  { key: "location", placeholder: "e.g. Remote, Berlin" },
  { key: "timeline", placeholder: "e.g. 3 months" },
  { key: "why", placeholder: "Why this matters to you", multiline: true },
];

interface FieldProps {
  label: string;
  value: string;
  placeholder: string;
  multiline: boolean;
  editing: boolean;
  onEdit: () => void;
  onChange: (v: string) => void;
  onDone: () => void;
}

function Field({ label, value, placeholder, multiline, editing, onEdit, onChange, onDone }: FieldProps) {
  const inputClass =
    "mt-1 w-full rounded-lg border border-black/15 bg-white px-2.5 py-1.5 text-[15px] text-ink outline-none focus-visible:border-accent";
  return (
    <div className="py-3">
      <MonoLabel>{label}</MonoLabel>
      {editing ? (
        multiline ? (
          <textarea
            autoFocus
            rows={3}
            aria-label={label}
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onDone}
            className={cn(inputClass, "resize-none")}
          />
        ) : (
          <input
            autoFocus
            type="text"
            aria-label={label}
            value={value}
            placeholder={placeholder}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onDone}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            className={inputClass}
          />
        )
      ) : (
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${label.toLowerCase()}`}
          className="-mx-1 mt-0.5 block w-[calc(100%+0.5rem)] rounded-lg px-1 py-0.5 text-left text-[15px] whitespace-pre-line text-ink hover:bg-black/5"
        >
          {value ? value : <span className="text-fg-muted italic">{placeholder}</span>}
        </button>
      )}
    </div>
  );
}

export default function VisionBoardPanel({ onClose }: PanelProps) {
  const vision: VisionBoard | null = useSession((s) => s.user?.vision ?? null);
  const progressQ = useApi("GET /progress");
  const jobsQ = useApi("GET /jobs");

  const level = progressQ.data?.level ?? 0;
  const eligible = jobsQ.data ? eligibleJobCount(jobsQ.data.jobs, level) : null;

  const saved = useMemo(() => draftFromVision(vision), [vision]);
  const [started, setStarted] = useState(false);
  const [draft, setDraft] = useState<VisionDraft>(() => draftFromVision(vision));
  const [editing, setEditing] = useState<VisionTextField | null>(null);
  const [saving, setSaving] = useState(false);

  const showBoard = vision !== null || started;
  const dirty = isVisionDraftDirty(draft, saved);

  const save = async () => {
    setSaving(true);
    try {
      await api("PATCH /me", { body: { vision: visionPatchFromDraft(draft) } });
      await useSession.getState().refreshUser();
      setDraft(draftFromVision(useSession.getState().user?.vision));
      setEditing(null);
      toast({ title: "Vision board saved", tone: "success" });
    } catch (e) {
      toast({ title: "Could not save your vision", body: errorMessage(e), tone: "danger" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open onClose={onClose} title="Vision board" width={460}>
      {!showBoard ? (
        <EmptyState
          title="Your vision board is empty"
          body="Write down the role you want, your level, industry, company type, location, timeline and why."
          action={
            <Button variant="primary" onClick={() => setStarted(true)}>
              Start my vision board
            </Button>
          }
        />
      ) : (
        <div className="theme-paper paper flex flex-col gap-3 p-5">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-serif text-[22px] leading-tight font-medium">Where I am headed</h3>
            <MonoLabel>Vision</MonoLabel>
          </div>

          {vision?.drawingDataUrl && (
            <img
              src={vision.drawingDataUrl}
              alt="Your drawing from onboarding"
              className="w-full rounded-xl border border-black/10 bg-white object-contain"
            />
          )}

          <div className="divide-y divide-black/10">
            {FIELDS.map((f) => (
              <Field
                key={f.key}
                label={VISION_LABELS[f.key]}
                value={draft[f.key]}
                placeholder={f.placeholder}
                multiline={!!f.multiline}
                editing={editing === f.key}
                onEdit={() => setEditing(f.key)}
                onChange={(v) => setDraft((d) => ({ ...d, [f.key]: v }))}
                onDone={() => setEditing((e) => (e === f.key ? null : e))}
              />
            ))}
          </div>

          <div className="rounded-2xl bg-paper p-4">
            {jobsQ.loading && !jobsQ.data ? (
              <Skeleton className="h-10 w-full" />
            ) : jobsQ.error && !jobsQ.data ? (
              <p className="text-[13px] text-fg-muted">Eligible jobs are unavailable right now.</p>
            ) : (
              <>
                <MonoLabel>Eligible jobs</MonoLabel>
                <p className="mt-1 font-serif text-[18px] leading-snug">
                  {eligible ?? 0} {eligible === 1 ? "job" : "jobs"} match Level {level}
                </p>
                {jobsQ.data?.unlocked ? (
                  <Link to="/jobs" onClick={onClose} className="mt-1 inline-block text-[13px] font-medium text-accent">
                    Open the job portal
                  </Link>
                ) : (
                  <p className="mt-1 text-[13px] text-fg-muted">The job portal unlocks after your first project.</p>
                )}
              </>
            )}
          </div>

          <div className="flex justify-end pt-1">
            <Button variant="primary" loading={saving} disabled={!dirty} onClick={() => void save()}>
              Save vision
            </Button>
          </div>
        </div>
      )}
    </Sheet>
  );
}
