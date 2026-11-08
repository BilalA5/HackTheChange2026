import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type PointerEvent as ReactPointerEvent } from "react";
import { Check, ImagePlus, RefreshCw, Trash2, Undo2 } from "lucide-react";
import { FEATURE_TAXONOMY, type BugReportInput } from "@pw/shared";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Switch, Textarea } from "@/components/ui/Fields";
import { EmptyState, Spinner } from "@/components/ui/Feedback";
import { api } from "@/lib/api";
import { pw } from "@/lib/bridge";
import { errorMessage } from "@/lib/errors";
import type { PanelProps } from "@/stores/ui";
import { cn } from "@/lib/cn";
import { Segmented } from "./ui";
import { composeScreenshot, MIN_RECT_SIDE, normalizeRect, paintRects, readAsDataUrl, type Point, type Rect } from "./lib/annotate";
import { readIncludeLogs, writeIncludeLogs } from "./lib/prefs";

type Severity = BugReportInput["severity"];

const SEVERITY_OPTIONS: { value: Severity; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "blocker", label: "Blocker" },
];

const FEATURE_OPTIONS = FEATURE_TAXONOMY.map((f) => ({ value: f, label: f }));

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

type Shot =
  | { kind: "loading" }
  | { kind: "ready"; dataUrl: string }
  | { kind: "unavailable" }
  | { kind: "error"; message: string }
  | { kind: "none" };

/** Highlight colour, read from the theme token so the canvas matches the accent. */
function accentColor(): string {
  if (typeof document === "undefined") return "rgb(123 108 246)";
  return getComputedStyle(document.documentElement).getPropertyValue("--color-accent").trim() || "rgb(123 108 246)";
}

/** Bug reporter dialog. Captures the screen on open in the desktop app, or accepts an image file in the browser. */
export default function BugReporter({ onClose }: PanelProps) {
  const [shot, setShot] = useState<Shot>(() => (pw.isElectron ? { kind: "loading" } : { kind: "unavailable" }));
  const [rects, setRects] = useState<Rect[]>([]);
  const [attempt, setAttempt] = useState(0);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [feature, setFeature] = useState<string>(FEATURE_TAXONOMY[0]);
  const [includeLogs, setIncludeLogs] = useState(() => readIncludeLogs());

  const [attempted, setAttempted] = useState(false);
  const [sending, setSending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [doneId, setDoneId] = useState<string | null>(null);

  useEffect(() => {
    if (!pw.isElectron) return;
    let alive = true;
    pw.capture
      .screenshot({ maxWidth: 1280 })
      .then((r) => {
        if (alive) setShot({ kind: "ready", dataUrl: r.dataUrl });
      })
      .catch((e: unknown) => {
        if (alive) setShot({ kind: "error", message: errorMessage(e) });
      });
    return () => {
      alive = false;
    };
  }, [attempt]);

  const titleError = attempted && title.trim().length < 3 ? "Add a short title, at least 3 characters." : undefined;
  const descError = attempted && description.trim().length < 10 ? "Describe what happened, at least 10 characters." : undefined;

  const setImage = (dataUrl: string) => {
    setRects([]);
    setShot({ kind: "ready", dataUrl });
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setAttempted(true);
    if (title.trim().length < 3 || description.trim().length < 10) return;
    setSending(true);
    setSubmitError(null);
    try {
      const screenshotDataUrl = shot.kind === "ready" ? await composeScreenshot(shot.dataUrl, rects, accentColor()) : undefined;
      const logs = includeLogs ? await pw.app.getLogs().catch(() => "") : undefined;
      const res = await api("POST /support/bug", {
        body: {
          title: title.trim(),
          description: description.trim(),
          severity,
          feature,
          screenshotDataUrl,
          logs,
        },
      });
      setDoneId(res.id);
    } catch (err) {
      setSubmitError(errorMessage(err));
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Report a bug" widthClass="max-w-[820px]">
      {doneId ? (
        <EmptyState
          icon={<Check size={20} strokeWidth={1.75} />}
          title="Thanks, your report is in"
          body={`Reference ${doneId}. Keep it if you need to follow up.`}
          action={
            <Button variant="glass" onClick={onClose}>
              Close
            </Button>
          }
        />
      ) : (
        <form onSubmit={submit} noValidate className="grid grid-cols-1 gap-6 md:grid-cols-[1.15fr_1fr]">
          <section aria-label="Screenshot" className="flex min-w-0 flex-col gap-3">
            <ScreenshotPane
              shot={shot}
              rects={rects}
              onRectsChange={setRects}
              onRetry={() => {
                setShot({ kind: "loading" });
                setAttempt((n) => n + 1);
              }}
              onImage={setImage}
              onError={(message) => setShot({ kind: "error", message })}
              onRemove={() => {
                setRects([]);
                setShot({ kind: "none" });
              }}
            />
          </section>

          <div className="flex min-w-0 flex-col gap-4">
            <Input
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What broke?"
              maxLength={120}
              error={titleError}
              autoComplete="off"
            />
            <Textarea
              label="What happened"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Steps you took, what you expected, and what happened instead."
              rows={4}
              maxRows={9}
              error={descError}
            />
            <div className="flex flex-col gap-1.5">
              <span className="font-mono text-[11px] font-medium tracking-[0.08em] text-fg-muted uppercase">Severity</span>
              <Segmented label="Severity" value={severity} options={SEVERITY_OPTIONS} onChange={(next) => setSeverity(next)} />
            </div>
            <Select label="Feature" value={feature} options={FEATURE_OPTIONS} onValueChange={setFeature} />
            <Switch
              checked={includeLogs}
              onCheckedChange={(on) => {
                writeIncludeLogs(on);
                setIncludeLogs(on);
              }}
              label="Include app logs"
              description="Recent log lines, with secrets removed."
            />
            {submitError && (
              <p role="alert" className="text-[13px] text-danger">
                Could not send the report. {submitError}
              </p>
            )}
            <div className="mt-auto flex justify-end gap-2 pt-2">
              <Button variant="ghost" onClick={onClose} disabled={sending}>
                Cancel
              </Button>
              <Button type="submit" loading={sending}>
                Send report
              </Button>
            </div>
          </div>
        </form>
      )}
    </Modal>
  );
}

interface ScreenshotPaneProps {
  shot: Shot;
  rects: Rect[];
  onRectsChange(next: Rect[]): void;
  onRetry(): void;
  onImage(dataUrl: string): void;
  onError(message: string): void;
  onRemove(): void;
}

function ScreenshotPane({ shot, rects, onRectsChange, onRetry, onImage, onError, onRemove }: ScreenshotPaneProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return onError("That file is not an image.");
    if (file.size > MAX_IMAGE_BYTES) return onError("Images must be 10 MB or smaller.");
    try {
      onImage(await readAsDataUrl(file));
    } catch (err) {
      onError(errorMessage(err));
    }
  };

  const attachButton = (
    <Button variant="glass" size="sm" icon={<ImagePlus size={15} strokeWidth={1.75} />} onClick={() => fileRef.current?.click()}>
      Attach image file
    </Button>
  );

  const hiddenInput = (
    <input ref={fileRef} type="file" accept="image/*" className="sr-only" tabIndex={-1} aria-hidden="true" onChange={(e) => void onFile(e)} />
  );

  if (shot.kind === "loading") {
    return (
      <div className="flex h-64 items-center justify-center gap-3 rounded-card border border-line text-[14px] text-fg-muted">
        <Spinner label="Capturing screen" />
        Capturing screen...
      </div>
    );
  }

  if (shot.kind === "unavailable") {
    return (
      <>
        {hiddenInput}
        <EmptyState
          icon={<ImagePlus size={20} strokeWidth={1.75} />}
          title="Screenshot unavailable in browser"
          body="Screen capture needs the desktop app. You can attach an image you already have."
          action={attachButton}
        />
      </>
    );
  }

  if (shot.kind === "error") {
    return (
      <>
        {hiddenInput}
        <EmptyState
          icon={<RefreshCw size={20} strokeWidth={1.75} />}
          title="Could not capture the screen"
          body={shot.message}
          action={
            <div className="flex flex-wrap justify-center gap-2">
              {pw.isElectron && (
                <Button variant="glass" size="sm" icon={<RefreshCw size={15} strokeWidth={1.75} />} onClick={onRetry}>
                  Try again
                </Button>
              )}
              {attachButton}
            </div>
          }
        />
      </>
    );
  }

  if (shot.kind === "none") {
    return (
      <>
        {hiddenInput}
        <EmptyState title="No screenshot attached" body="The report is sent without an image." action={attachButton} />
      </>
    );
  }

  return (
    <>
      {hiddenInput}
      <Annotator dataUrl={shot.dataUrl} rects={rects} onChange={onRectsChange} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[12px] text-fg-muted">Drag on the screenshot to highlight an area.</span>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" icon={<Undo2 size={14} strokeWidth={1.75} />} disabled={rects.length === 0} onClick={() => onRectsChange(rects.slice(0, -1))}>
            Undo
          </Button>
          <Button variant="ghost" size="sm" icon={<Trash2 size={14} strokeWidth={1.75} />} onClick={onRemove}>
            Remove
          </Button>
        </div>
      </div>
    </>
  );
}

/** Screenshot with a canvas layer for drawing highlight rectangles. Rects are stored in 0..1 image space. */
function Annotator({ dataUrl, rects, onChange }: { dataUrl: string; rects: Rect[]; onChange(next: Rect[]): void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dragStart = useRef<Point | null>(null);
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [draft, setDraft] = useState<Rect | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !natural) return;
    paintRects(ctx, natural.w, natural.h, draft ? [...rects, draft] : rects, accentColor());
  }, [natural, rects, draft]);

  const toPoint = (e: ReactPointerEvent<HTMLCanvasElement>): Point => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };

  return (
    <div className="relative overflow-hidden rounded-card border border-line bg-black/30">
      <img
        src={dataUrl}
        alt="Screenshot of the app"
        draggable={false}
        className="block w-full select-none"
        onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
      />
      <canvas
        ref={canvasRef}
        width={natural?.w ?? 0}
        height={natural?.h ?? 0}
        aria-label="Highlight area. Drag to draw a rectangle."
        className={cn("absolute inset-0 size-full touch-none", natural ? "cursor-crosshair" : "pointer-events-none")}
        onPointerDown={(e) => {
          if (e.button !== 0) return;
          e.currentTarget.setPointerCapture(e.pointerId);
          dragStart.current = toPoint(e);
          setDraft(null);
        }}
        onPointerMove={(e) => {
          if (!dragStart.current) return;
          setDraft(normalizeRect(dragStart.current, toPoint(e)));
        }}
        onPointerUp={(e) => {
          const start = dragStart.current;
          dragStart.current = null;
          setDraft(null);
          if (!start) return;
          const r = normalizeRect(start, toPoint(e));
          if (r.w >= MIN_RECT_SIDE && r.h >= MIN_RECT_SIDE) onChange([...rects, r]);
        }}
        onPointerCancel={() => {
          dragStart.current = null;
          setDraft(null);
        }}
      />
    </div>
  );
}
