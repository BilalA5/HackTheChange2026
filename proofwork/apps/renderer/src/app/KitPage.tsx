import { useRef, useState, type ReactNode } from "react";
import { ArrowRight, Mic, Plus } from "lucide-react";
import { Button, IconButton } from "@/components/ui/Button";
import { GlassCard, PaperCard } from "@/components/ui/Surfaces";
import { Pill, MonoLabel, Badge } from "@/components/ui/Labels";
import { Modal } from "@/components/ui/Modal";
import { Sheet } from "@/components/ui/Sheet";
import { Popover } from "@/components/ui/Popover";
import { Tabs } from "@/components/ui/Tabs";
import { Input, Textarea, Select, Switch, Slider, Checkbox } from "@/components/ui/Fields";
import { Tooltip } from "@/components/ui/Tooltip";
import { ProgressBar, ProgressRing, DotMeter } from "@/components/ui/Progress";
import { Spinner, Skeleton, EmptyState } from "@/components/ui/Feedback";
import { Markdown } from "@/components/ui/Markdown";
import { Kbd } from "@/components/ui/Kbd";
import { Timer } from "@/components/ui/Timer";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { toast } from "@/components/ui/Toaster";
import { NpcAvatar } from "@/components/domain/NpcAvatar";
import { CompanyGlyph } from "@/components/domain/CompanyGlyph";
import { LevelPill } from "@/components/domain/LevelPill";
import { XpChip } from "@/components/domain/XpChip";
import { RubricView } from "@/components/domain/RubricView";
import { PerformanceBadge } from "@/components/domain/PerformanceBadge";
import { StageModeToggle } from "@/components/domain/StageModeToggle";
import { VoiceBubble } from "@/components/domain/VoiceBubble";
import { PushToTalkButton } from "@/components/domain/PushToTalkButton";
import { NotesCard } from "@/components/domain/NotesCard";
import type { Rubric, StageMode } from "@pw/shared";

const RUBRIC: Rubric = {
  understanding: { level: "exceeding", rationale: "Restated the constraint before proposing a fix." },
  quality: { level: "meeting", rationale: "Tests cover the happy path; edge cases are thin." },
  communication: { level: "meeting", rationale: "Updates were clear and on time." },
  independence: { level: "below", rationale: "Asked for the schema twice before looking it up." },
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="font-mono text-[12px] tracking-[0.08em] text-fg-muted uppercase">{title}</h2>
      {children}
    </section>
  );
}

function Demo({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

/** Dev gallery of every UI and domain component, in dark and paper contexts. */
export default function KitPage() {
  const [tab, setTab] = useState("one");
  const [mode, setMode] = useState<StageMode>("plan");
  const [modal, setModal] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [pop, setPop] = useState(false);
  const [sw, setSw] = useState(true);
  const [check, setCheck] = useState(false);
  const [rate, setRate] = useState(1);
  const [notes, setNotes] = useState({ problem: "Tickets route to the wrong team.", outcome: "", process: "" });
  const [sent, setSent] = useState<string[]>([]);
  const anchor = useRef<HTMLButtonElement>(null);

  const body = (
    <div className="flex flex-col gap-10">
      <Section title="Buttons">
        <Demo>
          <Button variant="primary">Primary</Button>
          <Button variant="light">Light</Button>
          <Button variant="glass">Glass</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button size="sm" icon={<Plus size={14} />}>Small</Button>
          <Button size="md" iconRight={<ArrowRight size={16} />}>Medium</Button>
          <Button size="lg" loading>Loading</Button>
          <Button disabled>Disabled</Button>
          <IconButton label="Mic" icon={<Mic size={16} />} />
        </Demo>
      </Section>

      <Section title="Surfaces, labels and badges">
        <div className="grid grid-cols-2 gap-4">
          <GlassCard>
            <MonoLabel>XP earned</MonoLabel>
            <p className="mt-2 text-[14px] text-fg-muted">Glass card body text.</p>
          </GlassCard>
          <PaperCard className="theme-paper">
            <MonoLabel>Paper</MonoLabel>
            <p className="mt-2 text-[14px] text-ink">Paper card body text.</p>
          </PaperCard>
        </div>
        <Demo>
          <Pill tone="accent">Accent</Pill>
          <Pill tone="xp">XP</Pill>
          <Pill tone="success">Success</Pill>
          <Pill tone="warning">Warning</Pill>
          <Pill tone="danger">Danger</Pill>
          <Badge>3</Badge>
          <XpChip amount={150} />
          <XpChip amount={100} held />
          <LevelPill level={2} />
          <PerformanceBadge level="meeting" />
          <PerformanceBadge level={null} />
        </Demo>
      </Section>

      <Section title="Overlays">
        <Demo>
          <Button variant="glass" onClick={() => setModal(true)}>Open modal</Button>
          <Button variant="glass" onClick={() => setSheet(true)}>Open sheet</Button>
          <Button ref={anchor} variant="glass" onClick={() => setPop((v) => !v)}>Toggle popover</Button>
          <Tooltip content="Tooltip text">
            <Button variant="ghost">Hover me</Button>
          </Tooltip>
        </Demo>
        <Modal open={modal} onClose={() => setModal(false)} title="A modal">
          <p className="text-[14px] text-fg-muted">Press Escape to close. Focus stays inside.</p>
        </Modal>
        <Sheet open={sheet} onClose={() => setSheet(false)} title="A sheet">
          <p className="text-[14px] text-fg-muted">Side panel for longer content.</p>
        </Sheet>
        <Popover open={pop} onClose={() => setPop(false)} anchorRef={anchor} placement="bottom-end" label="Popover demo">
          <p className="text-[14px]">Anchored to the button.</p>
        </Popover>
      </Section>

      <Section title="Tabs and fields">
        <Tabs
          label="Demo tabs"
          value={tab}
          onChange={setTab}
          tabs={[
            { id: "one", label: "One" },
            { id: "two", label: "Two" },
            { id: "three", label: "Three", disabled: true },
          ]}
        />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Email" placeholder="you@example.com" />
          <Input label="With error" error="Something is wrong" defaultValue="oops" />
          <Textarea label="Auto-grow" placeholder="Type a few lines" />
          <Select
            label="Select"
            value="b"
            onValueChange={() => undefined}
            options={[
              { value: "a", label: "Option A" },
              { value: "b", label: "Option B" },
            ]}
          />
        </div>
        <Demo>
          <Switch checked={sw} onCheckedChange={setSw} label="Sounds" description="Interface sound effects" />
          <Checkbox checked={check} onCheckedChange={setCheck} label="Remember me" />
        </Demo>
        <div className="max-w-[360px]">
          <Slider label="Voice rate" value={rate} min={0.5} max={2} step={0.1} onValueChange={setRate} unit="x" />
        </div>
      </Section>

      <Section title="Progress, feedback and misc">
        <div className="flex max-w-[360px] flex-col gap-3">
          <ProgressBar value={0.6} label="Progress" />
          <ProgressBar value={0.3} tone="xp" label="XP" />
        </div>
        <Demo>
          <ProgressRing value={0.7}>
            <span className="font-mono text-[12px]">70%</span>
          </ProgressRing>
          <DotMeter value={2} max={4} />
          <Spinner />
          <Skeleton className="h-8 w-40" />
          <Kbd>Space</Kbd>
          <Timer initialSeconds={75} />
          <Button size="sm" variant="glass" onClick={() => toast({ title: "Saved", body: "Your notes are up to date.", tone: "success" })}>
            Toast
          </Button>
        </Demo>
        <EmptyState title="Nothing here yet" body="Empty states explain the next step." />
        <ErrorBoundary fallback={(err, reset) => <Button onClick={reset}>Recovered from {err.message}</Button>}>
          <span className="text-[13px] text-fg-muted">ErrorBoundary wraps this content.</span>
        </ErrorBoundary>
        <Markdown source={"## Heading\n\nBody with **bold**, `code`, and a [link](https://example.com).\n\n<script>no raw html</script>"} />
      </Section>

      <Section title="Domain components">
        <Demo>
          <NpcAvatar name="Priya Shah" seed="priya" />
          <NpcAvatar name="Tom Lee" seed="tom" size="lg" speaking />
          <CompanyGlyph company={{ name: "Kettle Commerce", glyph: "KC", color: "var(--color-accent)" }} />
          <CompanyGlyph company={{ name: "Harbor Labs", glyph: "HL", color: "var(--color-success)" }} size="lg" />
        </Demo>
        <RubricView rubric={RUBRIC} variant="compact" />
        <RubricView rubric={RUBRIC} variant="full" />
        <StageModeToggle value={mode} onChange={setMode} />
        <div className="flex flex-col gap-4">
          <VoiceBubble side="npc" name="Priya Shah" avatarSeed="priya" text="Walk me through how you would route a ticket that mentions two products." />
          <VoiceBubble side="learner" name="You" text="I would tag the product first, then send it to the owning queue." />
        </div>
        <div className="max-w-[480px]">
          <PushToTalkButton onFinal={(t) => setSent((s) => [...s, t])} />
          {sent.length > 0 && <p className="mt-3 text-[13px] text-fg-muted">Last: {sent[sent.length - 1]}</p>}
        </div>
      </Section>

      <Section title="Paper context">
        <div className="theme-paper paper-page -mx-6 flex flex-col gap-6 rounded-[28px] p-6">
          <NotesCard notes={notes} onChange={(s, v) => setNotes((n) => ({ ...n, [s]: v }))} />
          <NotesCard notes={{ problem: "Read only **notes** with Markdown." }} readOnly />
          <div className="flex flex-col gap-2">
            <VoiceBubble side="npc" name="Tom Lee" avatarSeed="tom" text="Read-only transcript on paper." />
            <Skeleton className="h-6 w-1/2 bg-black/10" />
          </div>
          <Button variant="primary" iconRight={<ArrowRight size={16} />}>Paper primary</Button>
        </div>
      </Section>
    </div>
  );

  return (
    <div className="h-full overflow-y-auto bg-night text-fg">
      <div className="mx-auto flex max-w-[1080px] flex-col gap-10 p-8">
        <header className="flex items-center justify-between">
          <h1 className="font-serif text-[32px] font-medium">Component kit</h1>
          <Pill tone="neutral">Dev only · /__kit</Pill>
        </header>
        <GlassCard className="theme-night">{body}</GlassCard>
      </div>
    </div>
  );
}
