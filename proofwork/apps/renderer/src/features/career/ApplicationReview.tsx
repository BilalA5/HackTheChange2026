import { useState } from "react";
import { AlertTriangle, Check, ClipboardList } from "lucide-react";
import type { Job, JobApplication, JobApplyField } from "@pw/shared";
import { Button, Input, Pill, Select, Textarea, toast } from "@/components/ui";
import { api } from "@/lib/api";
import { errorMessage } from "@/lib/errors";
import { APPLY_DISCLAIMER, validateAnswers } from "./careerHelpers";
import { APPLICATION_STATUS_LABEL, APPLICATION_STATUS_TONE } from "./applicationStatus";

type Action = "save" | "ready" | "submitted";

interface ApplicationReviewProps {
  job: Job;
  application: JobApplication;
  onSaved: (app: JobApplication) => void;
}

/** Human-in-the-loop review of AI-drafted answers. Nothing is sent anywhere by Proofwork. */
export function ApplicationReview({ job, application, onSaved }: ApplicationReviewProps) {
  const [answers, setAnswers] = useState<Record<string, string>>(application.answers);
  const [coverLetter, setCoverLetter] = useState(application.coverLetter);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<Action | null>(null);
  const guessed = new Set(application.guessed);
  const locked = application.status === "submitted";

  const setAnswer = (key: string, value: string) => setAnswers((a) => ({ ...a, [key]: value }));

  const run = async (action: Action) => {
    if (action !== "save") {
      const found = validateAnswers(job.applyFields, answers);
      setErrors(found);
      const firstKey = Object.keys(found)[0];
      if (firstKey !== undefined) {
        document.getElementById(`apply-${firstKey}`)?.focus();
        toast({ title: "A few required answers are missing", tone: "warning" });
        return;
      }
    }
    setBusy(action);
    try {
      const body: { answers: Record<string, string>; coverLetter: string; status?: JobApplication["status"] } = { answers, coverLetter };
      if (action === "ready") body.status = "ready";
      if (action === "submitted") body.status = "submitted";
      const next = await api("PATCH /applications/:id", { params: { id: application.id }, body });
      onSaved(next);
      setErrors({});
      toast({
        title: action === "save" ? "Draft saved" : action === "ready" ? "Marked ready" : "Recorded as submitted",
        tone: "success",
      });
    } catch (e) {
      toast({ title: "Could not save the application", body: errorMessage(e), tone: "danger" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={APPLICATION_STATUS_TONE[application.status]}>{APPLICATION_STATUS_LABEL[application.status]}</Pill>
        <span className="text-[13px] text-fg-muted">Review every answer before you apply on the employer's site.</span>
      </div>

      <p className="glass flex items-start gap-2 p-4 text-[13px] text-fg">
        <AlertTriangle size={16} className="mt-0.5 shrink-0 text-warning" aria-hidden="true" />
        {APPLY_DISCLAIMER}
      </p>

      <fieldset disabled={locked} className="flex flex-col gap-5 disabled:opacity-70">
        <legend className="sr-only">Application answers for {job.title}</legend>
        {job.applyFields.map((field) => (
          <FieldInput
            key={field.key}
            field={field}
            value={answers[field.key] ?? ""}
            guessed={guessed.has(field.key)}
            error={errors[field.key]}
            onChange={(v) => setAnswer(field.key, v)}
          />
        ))}

        <div className="flex flex-col gap-2">
          <Textarea
            id="apply-cover_letter"
            label="Cover letter"
            hint="Written from your profile. Edit it to sound like you."
            rows={6}
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
          />
        </div>
      </fieldset>

      <div className="flex flex-wrap gap-2">
        <Button variant="glass" loading={busy === "save"} disabled={busy !== null || locked} onClick={() => void run("save")}>
          Save
        </Button>
        <Button variant="primary" loading={busy === "ready"} disabled={busy !== null || locked} onClick={() => void run("ready")}>
          Mark ready
        </Button>
        <Button variant="ghost" loading={busy === "submitted"} disabled={busy !== null || locked} onClick={() => void run("submitted")} icon={<Check size={14} />}>
          I submitted it myself
        </Button>
      </div>

      <section aria-labelledby="log-heading" className="flex flex-col gap-2">
        <h3 id="log-heading" className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.08em] text-fg-muted">
          <ClipboardList size={13} aria-hidden="true" /> Activity
        </h3>
        <ActivityLog log={application.log} />
      </section>
    </div>
  );
}

function FieldInput({
  field,
  value,
  guessed,
  error,
  onChange,
}: {
  field: JobApplyField;
  value: string;
  guessed: boolean;
  error: string | undefined;
  onChange: (value: string) => void;
}) {
  const id = `apply-${field.key}`;
  const label = field.required ? `${field.label} *` : field.label;
  const hint = guessed ? "AI guessed: check this" : undefined;

  const control =
    field.type === "textarea" ? (
      <Textarea id={id} label={label} rows={4} value={value} error={error} onChange={(e) => onChange(e.target.value)} />
    ) : field.type === "select" ? (
      <Select
        id={id}
        label={label}
        error={error}
        value={value}
        options={[{ value: "", label: "Choose one" }, ...(field.options ?? []).map((o) => ({ value: o, label: o }))]}
        onValueChange={onChange}
      />
    ) : (
      <Input id={id} label={label} type={field.type === "email" ? "email" : field.type === "url" ? "url" : "text"} value={value} error={error} onChange={(e) => onChange(e.target.value)} />
    );

  if (!guessed) return <div>{control}</div>;
  return (
    <div className="rounded-2xl bg-warning/10 p-3 ring-1 ring-warning/60" data-guessed="true">
      {control}
      <p className="mt-2 flex items-center gap-1.5 text-[12px] font-medium text-warning">
        <AlertTriangle size={13} aria-hidden="true" /> {hint}
      </p>
    </div>
  );
}

function ActivityLog({ log }: { log: JobApplication["log"] }) {
  if (log.length === 0) return <p className="text-[13px] text-fg-muted">No activity yet.</p>;
  return (
    <ol className="flex flex-col gap-2">
      {[...log].reverse().map((entry, i) => {
        const at = new Date(entry.at);
        return (
          <li key={`${entry.at}-${i}`} className="flex flex-col gap-0.5 text-[13px]">
            <span className="text-fg">{entry.text}</span>
            <span className="font-mono text-[11px] text-fg-muted">{Number.isNaN(at.getTime()) ? "" : at.toLocaleString()}</span>
          </li>
        );
      })}
    </ol>
  );
}
