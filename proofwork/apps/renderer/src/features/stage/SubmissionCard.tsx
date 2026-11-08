import { useRef, useState, type DragEvent } from "react";
import { FileUp, Send, X } from "lucide-react";
import type { Evaluation, Objective, Stage, StageProgress, SubmissionKind } from "@pw/shared";
import { api, uploadFile } from "@/lib/api";
import { Button, IconButton } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Fields";
import { Markdown } from "@/components/ui/Markdown";
import { Spinner } from "@/components/ui/Feedback";
import { cn } from "@/lib/cn";
import { UPLOAD_MAX_BYTES, formatBytes, validateSubmission, type SubmissionDraft, type SubmissionErrors } from "./helpers";

export interface SubmissionCardProps {
  objectiveId: string;
  stage: Stage;
  progress: StageProgress;
  onSubmitted(objective: Objective, evaluation: Evaluation): void;
  onError(e: unknown): void;
}

interface UploadItem {
  localId: number;
  fileName: string;
  size: number;
  status: "uploading" | "ready" | "error";
  value?: string;
  error?: string;
}

let uploadSeq = 0;

/** Submission inputs for the kinds this stage accepts, plus submit and the full-screen reviewing state. */
export function SubmissionCard({ objectiveId, stage, progress, onSubmitted, onError }: SubmissionCardProps) {
  const kinds = stage.submission.kinds;
  const readOnly = progress.status === "completed";
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [github, setGithub] = useState("");
  const [files, setFiles] = useState<UploadItem[]>([]);
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const readyFiles = files.filter((f): f is UploadItem & { value: string } => f.status === "ready" && typeof f.value === "string");
  const draft: SubmissionDraft = {
    text,
    url,
    github,
    files: readyFiles.map((f) => ({ value: f.value, fileName: f.fileName })),
  };
  const validation = validateSubmission(kinds, draft);
  const errors: SubmissionErrors = {
    ...validation.errors,
    form: attempted ? validation.errors.form : undefined,
  };
  const uploading = files.some((f) => f.status === "uploading");
  const has = (k: SubmissionKind) => kinds.includes(k);

  const addFiles = (list: File[]) => {
    for (const file of list) {
      uploadSeq += 1;
      const localId = uploadSeq;
      if (file.size > UPLOAD_MAX_BYTES) {
        setFiles((prev) => [...prev, { localId, fileName: file.name, size: file.size, status: "error", error: "Larger than 25 MB" }]);
        continue;
      }
      setFiles((prev) => [...prev, { localId, fileName: file.name, size: file.size, status: "uploading" }]);
      uploadFile(file)
        .then((res) => {
          setFiles((prev) => prev.map((f) => (f.localId === localId ? { ...f, status: "ready", value: res.url, fileName: res.fileName } : f)));
        })
        .catch((e: unknown) => {
          const message = e instanceof Error ? e.message : "Upload failed";
          setFiles((prev) => prev.map((f) => (f.localId === localId ? { ...f, status: "error", error: message } : f)));
        });
    }
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    if (readOnly || submitting) return;
    addFiles(Array.from(e.dataTransfer.files));
  };

  const submit = async () => {
    setAttempted(true);
    if (!validation.valid || uploading || submitting || readOnly) return;
    setSubmitting(true);
    try {
      const res = await api("POST /objectives/:id/stages/:stageId/submit", {
        params: { id: objectiveId, stageId: stage.id },
        body: { submissions: validation.submissions },
      });
      onSubmitted(res.objective, res.evaluation);
    } catch (e) {
      onError(e);
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = readOnly || submitting;

  return (
    <section aria-label="Submission" className="glass flex flex-col gap-5 p-5">
      <header className="flex flex-col gap-1.5">
        <h2 className="font-serif text-[20px] font-medium">Submit your work</h2>
        {stage.submission.instructions && <Markdown source={stage.submission.instructions} tone="night" className="text-[14px] text-fg-muted" />}
      </header>

      {has("text") && (
        <Textarea
          label="Write-up"
          placeholder="Describe what you built, what you tested and what is left."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled}
          error={errors.text}
          rows={4}
          maxRows={14}
        />
      )}

      {has("url") && (
        <Input
          label="Link"
          type="url"
          inputMode="url"
          placeholder="https://"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={disabled}
          error={errors.url}
        />
      )}

      {has("github") && (
        <Input
          label="GitHub repository"
          type="url"
          inputMode="url"
          placeholder="https://github.com/owner/repo"
          value={github}
          onChange={(e) => setGithub(e.target.value)}
          disabled={disabled}
          error={errors.github}
        />
      )}

      {has("file") && (
        <div className="flex flex-col gap-2.5">
          <span className="font-mono text-[11px] font-medium tracking-[0.08em] text-fg-muted uppercase">Files</span>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              if (!disabled) setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={cn(
              "flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line px-4 py-6 text-center transition-colors",
              dragOver && "border-accent bg-accent/10",
            )}
          >
            <FileUp size={20} strokeWidth={1.75} className="text-fg-muted" aria-hidden="true" />
            <p className="text-[13px] text-fg-muted">Drop files here, up to 25 MB each</p>
            <Button variant="glass" size="sm" disabled={disabled} onClick={() => inputRef.current?.click()}>
              Choose files
            </Button>
            <input
              ref={inputRef}
              type="file"
              multiple
              className="hidden"
              disabled={disabled}
              onChange={(e) => {
                addFiles(Array.from(e.target.files ?? []));
                e.target.value = "";
              }}
            />
          </div>
          {files.length > 0 && (
            <ul className="flex flex-wrap gap-2" aria-label="Attached files">
              {files.map((f) => (
                <li
                  key={f.localId}
                  className={cn(
                    "flex max-w-full items-center gap-2 rounded-full border border-line bg-white/6 py-1 pr-1 pl-3 text-[12.5px]",
                    f.status === "error" && "border-danger/50 text-danger",
                  )}
                >
                  <span className="max-w-[200px] truncate">{f.fileName}</span>
                  <span className="font-mono text-[11px] text-fg-muted">
                    {f.status === "uploading" ? "Uploading…" : f.status === "error" ? (f.error ?? "Failed") : formatBytes(f.size)}
                  </span>
                  <IconButton label={`Remove ${f.fileName}`} size="sm" icon={<X size={13} strokeWidth={1.75} />} disabled={disabled} onClick={() => setFiles((prev) => prev.filter((x) => x.localId !== f.localId))} />
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {has("recording") && (
        <p className="rounded-2xl bg-white/5 px-4 py-3 text-[13px] text-fg-muted">
          Recordings happen on the presentation stage. You will record your walkthrough there.
        </p>
      )}

      {errors.form && (
        <p role="alert" className="text-[13px] text-danger">
          {errors.form}
        </p>
      )}

      {readOnly ? (
        <p className="text-[13px] text-fg-muted">This stage is complete. Your submission is locked.</p>
      ) : (
        <div className="flex items-center justify-end gap-3">
          {uploading && <span className="text-[12px] text-fg-muted">Waiting for uploads to finish…</span>}
          <Button variant="primary" size="md" loading={submitting} disabled={uploading || submitting} onClick={() => void submit()} icon={<Send size={15} strokeWidth={1.75} aria-hidden="true" />}>
            Submit for review
          </Button>
        </div>
      )}

      {submitting && (
        <div role="status" aria-live="assertive" className="fixed inset-0 z-[70] flex flex-col items-center justify-center gap-4 bg-night/92 backdrop-blur-sm">
          <Spinner size={30} label="Reviewing" />
          <h2 className="font-serif text-[24px] font-medium text-fg">Your manager is reviewing…</h2>
          <p className="max-w-[360px] text-center text-[14px] text-fg-muted">This can take a few seconds. Keep this window open.</p>
        </div>
      )}
    </section>
  );
}
