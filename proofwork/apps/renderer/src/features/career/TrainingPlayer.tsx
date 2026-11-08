import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { X, Volume2, VolumeX, ChevronLeft, ChevronRight, Check, Sparkles } from "lucide-react";
import type { Training, TrainingProgress } from "@pw/shared";
import { Button, IconButton, Markdown, Modal, Select, Switch, toast } from "@/components/ui";
import { tts } from "@/lib/voice/tts";
import { errorMessage } from "@/lib/errors";
import { clampLessonIndex, readStoredSpeed, SPEEDS, stripMarkdown, writeStoredSpeed, type Speed } from "./careerHelpers";

interface TrainingPlayerProps {
  training: Training;
  /** Saved position, used to resume. */
  initial: TrainingProgress | undefined;
  saveProgress: (trainingId: string, lessonIndex: number, completed: boolean) => Promise<TrainingProgress>;
  /** Called when the learner leaves the reader. The page returns to the shelf. */
  onExit: () => void;
  backTo: string;
}

const SPEED_OPTIONS = SPEEDS.map((s) => ({ value: String(s), label: `${s}×` }));

/** Full-height lesson reader with read-aloud, captions, lesson dots and saved progress. */
export function TrainingPlayer({ training, initial, saveProgress, onExit }: TrainingPlayerProps) {
  const lessons = training.lessons;
  const last = lessons.length - 1;
  const reduce = useReducedMotion();

  const [index, setIndex] = useState(() => clampLessonIndex(initial?.lessonIndex ?? 0, lessons.length));
  /** True once the learner finishes the last lesson in this visit. Shows the celebration. */
  const [finished, setFinished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [speed, setSpeed] = useState<Speed>(() => readStoredSpeed());
  const [captions, setCaptions] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const speakingRef = useRef(false);

  const lesson = lessons[index];
  const plainBody = useMemo(() => stripMarkdown(lesson.body), [lesson.body]);

  // Stop speech when the lesson changes or the reader closes.
  useEffect(() => {
    tts.cancel();
    speakingRef.current = false;
    setSpeaking(false);
  }, [index]);
  useEffect(() => () => tts.cancel(), []);

  const readAloud = () => {
    if (speakingRef.current) {
      tts.cancel();
      return;
    }
    speakingRef.current = true;
    setSpeaking(true);
    tts.speak(plainBody, {
      voice: { rate: speed },
      onStart: () => setSpeaking(true),
      onEnd: () => {
        speakingRef.current = false;
        setSpeaking(false);
      },
    });
  };

  const changeSpeed = (next: Speed) => {
    setSpeed(next);
    writeStoredSpeed(next);
  };

  const advance = async () => {
    const isLast = index === last;
    const nextIndex = isLast ? index : index + 1;
    if (isLast) {
      setSaving(true);
      try {
        await saveProgress(training.id, index, true);
        setFinished(true);
      } catch (e) {
        toast({ title: "Progress not saved", body: errorMessage(e), tone: "danger" });
      } finally {
        setSaving(false);
      }
      return;
    }
    setIndex(nextIndex);
    setSaving(true);
    try {
      await saveProgress(training.id, nextIndex, false);
    } catch (e) {
      toast({ title: "Progress not saved", body: errorMessage(e), tone: "danger" });
    } finally {
      setSaving(false);
    }
  };

  const requestExit = () => {
    if (!finished && index > 0) setExitOpen(true);
    else onExit();
  };

  if (finished) {
    return (
      <div className="flex h-full min-h-0 flex-col items-center justify-center gap-5 p-8 text-center" role="status">
        <motion.div
          initial={reduce ? false : { scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.26, ease: "easeOut" }}
          className="relative flex size-20 items-center justify-center rounded-full bg-success/20 text-success"
        >
          <Check size={36} aria-hidden="true" />
          {!reduce &&
            [0, 1, 2, 3, 4, 5].map((i) => (
              <motion.span
                key={i}
                aria-hidden="true"
                className="absolute size-2 rounded-full bg-xp"
                initial={{ opacity: 0, x: 0, y: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  x: Math.cos((i / 6) * Math.PI * 2) * 70,
                  y: Math.sin((i / 6) * Math.PI * 2) * 70,
                }}
                transition={{ duration: 0.9, delay: 0.15, ease: "easeOut" }}
              />
            ))}
        </motion.div>
        <h2 className="font-serif text-[28px] font-medium text-fg">Training complete</h2>
        <p className="max-w-[420px] text-[14px] text-fg-muted">
          <Sparkles size={14} className="mr-1 inline text-xp" aria-hidden="true" />
          {training.title} is finished. It stays in your library so you can review it any time.
        </p>
        <Button variant="light" onClick={onExit}>
          Back to the shelf
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-line px-6 py-4">
        <div className="min-w-0">
          <p className="truncate font-mono text-[11px] uppercase tracking-[0.08em] text-fg-muted">{training.title}</p>
          <h1 className="truncate font-serif text-[22px] font-medium text-fg">{lesson.title}</h1>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <span className="font-mono text-[11px] text-fg-muted">
            Lesson {index + 1} of {lessons.length}
          </span>
          <IconButton label="Close training" variant="glass" size="md" onClick={requestExit} icon={<X size={18} />} />
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-[760px] flex-col gap-6 px-8 py-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2" role="group" aria-label="Lessons">
              {lessons.map((l, i) => {
                const reached = i <= (initial?.lessonIndex ?? 0) || i <= index;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`Lesson ${i + 1}: ${l.title}`}
                    aria-current={i === index ? "step" : undefined}
                    className={
                      "size-3 rounded-full transition-transform focus-visible:outline-2 focus-visible:outline-accent " +
                      (i === index ? "scale-125 bg-accent" : reached ? "bg-success" : "bg-white/20 hover:bg-white/40")
                    }
                  />
                );
              })}
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <div className="w-[120px]">
                <Select
                  label="Read-aloud speed"
                  options={SPEED_OPTIONS}
                  value={String(speed)}
                  onValueChange={(v) => {
                    const parsed = Number(v);
                    if ((SPEEDS as readonly number[]).includes(parsed)) changeSpeed(parsed as Speed);
                  }}
                />
              </div>
              <Button
                variant="glass"
                size="sm"
                icon={speaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
                onClick={readAloud}
                aria-pressed={speaking}
              >
                {speaking ? "Stop reading" : "Read aloud"}
              </Button>
              <Switch checked={captions} onCheckedChange={setCaptions} label="Captions" />
            </div>
          </div>

          <article aria-label={`Lesson ${index + 1} text`} className="min-w-0">
            <Markdown source={lesson.body} tone="night" />
          </article>

          {captions && lesson.caption && (
            <p
              role="note"
              aria-label="Captions"
              className="mx-auto max-w-[90%] rounded-lg bg-black/75 px-4 py-2 text-center text-[15px] leading-snug text-white"
            >
              {lesson.caption}
            </p>
          )}
        </div>
      </div>

      <footer className="flex shrink-0 items-center justify-between gap-4 border-t border-line px-6 py-4">
        <Button variant="glass" icon={<ChevronLeft size={16} />} onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
          Prev
        </Button>
        <Button variant="light" size="lg" loading={saving} onClick={() => void advance()} iconRight={index === last ? <Check size={16} /> : <ChevronRight size={16} />}>
          {index === last ? "Finish" : "Next"}
        </Button>
      </footer>

      <Modal open={exitOpen} onClose={() => setExitOpen(false)} title="Leave this training?">
        <p className="text-[14px] text-fg-muted">Your place is saved.</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setExitOpen(false)}>
            Stay
          </Button>
          <Button variant="primary" onClick={onExit}>
            Leave
          </Button>
        </div>
      </Modal>
    </div>
  );
}
