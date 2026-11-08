import { useRef, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { Link } from "react-router";
import { BookOpen, Check, Circle, CircleDot, Lock, Send } from "lucide-react";
import type { Company, Npc, Objective, Stage, StageStatus } from "@pw/shared";
import { cn } from "@/lib/cn";
import { CompanyGlyph } from "@/components/domain/CompanyGlyph";
import { NpcAvatar } from "@/components/domain/NpcAvatar";
import { NotesCard } from "@/components/domain/NotesCard";
import { stagePath, clampRailWidth, RAIL_MAX_WIDTH, RAIL_MIN_WIDTH, toggleChecklistItem, type ChecklistItem } from "./helpers";

export interface StageRailProps {
  objectiveId: string;
  stages: Stage[];
  objective: Objective;
  currentStageId: string;
  company: Company;
  npc: Npc;
  checklist: ChecklistItem[];
  /** The requirements agreed in Plan mode. */
  agreedRequirements: string[];
  width: number;
  onWidthChange(width: number): void;
  /** Called when a drag or key adjustment ends, so the width can be saved. */
  onWidthCommit(width: number): void;
  onToggleTodo(next: ChecklistItem[]): void;
  onOpenLearnItem(itemId: string): void;
  learnItems: Stage["learn"];
  learnCompleted: string[];
  /** Read-only meeting notes. */
  notes: Objective["notes"];
}

const STATUS_ICON: Record<StageStatus, { icon: typeof Check; tone: string; label: string }> = {
  locked: { icon: Lock, tone: "text-fg-muted/60", label: "Locked" },
  available: { icon: Circle, tone: "text-fg-muted", label: "Available" },
  in_progress: { icon: CircleDot, tone: "text-accent", label: "In progress" },
  submitted: { icon: Send, tone: "text-warning", label: "Submitted" },
  completed: { icon: Check, tone: "text-success", label: "Completed" },
};

const SECTION = "flex flex-col gap-2";
const LABEL = "font-mono text-[11px] font-medium tracking-[0.08em] text-fg-muted uppercase";

/** Left rail: company, stage list, requirements, todos, resources and notes. Resizable from its right edge. */
export function StageRail(props: StageRailProps) {
  const { objectiveId, stages, objective, currentStageId, company, npc, checklist, agreedRequirements, width, onWidthChange, onWidthCommit, onToggleTodo, onOpenLearnItem, learnItems, learnCompleted, notes } = props;
  const drag = useRef<{ startX: number; startWidth: number; latest: number } | null>(null);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { startX: e.clientX, startWidth: width, latest: width };
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const next = clampRailWidth(d.startWidth + (e.clientX - d.startX));
    d.latest = next;
    onWidthChange(next);
  };
  const endDrag = () => {
    const d = drag.current;
    drag.current = null;
    if (d) onWidthCommit(d.latest);
  };
  const onHandleKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 24 : 8;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      const next = clampRailWidth(width + (e.key === "ArrowRight" ? step : -step));
      onWidthChange(next);
      onWidthCommit(next);
    }
  };

  const toggle = (id: string) => onToggleTodo(toggleChecklistItem(checklist, id));

  return (
    <aside aria-label="Project rail" className="relative flex h-full min-h-0 shrink-0 flex-col border-r border-line" style={{ width }}>
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-4">
        <section aria-label="Company and manager" className="glass flex items-center gap-3 p-3.5">
          <CompanyGlyph company={company} size="sm" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[14px] font-medium">{company.name}</div>
            <div className="flex items-center gap-2 text-[12px] text-fg-muted">
              <NpcAvatar name={npc.name} seed={npc.avatarSeed} size="xs" />
              <span className="truncate">
                {npc.name}, {npc.role}
              </span>
            </div>
          </div>
        </section>

        <section aria-label="Stages" className={SECTION}>
          <h2 className={LABEL}>Stages</h2>
          <ol className="flex flex-col gap-1">
            {stages.map((s) => {
              const status = objective.stages[s.id]?.status ?? "locked";
              const meta = STATUS_ICON[status];
              const Icon = meta.icon;
              const current = s.id === currentStageId;
              const unlocked = status !== "locked";
              const row = (
                <span className="flex items-center gap-2.5">
                  <Icon size={15} strokeWidth={1.75} className={meta.tone} aria-hidden="true" />
                  <span className="min-w-0 flex-1 truncate">{s.title}</span>
                  <span className="sr-only">{meta.label}</span>
                </span>
              );
              return (
                <li key={s.id}>
                  {unlocked ? (
                    <Link
                      to={stagePath(objectiveId, s)}
                      aria-current={current ? "step" : undefined}
                      className={cn(
                        "block rounded-xl px-3 py-2 text-[13px] transition-colors hover:bg-white/8",
                        current ? "bg-white/10 text-fg" : "text-fg-muted hover:text-fg",
                      )}
                    >
                      {row}
                    </Link>
                  ) : (
                    <div aria-disabled="true" className="block cursor-not-allowed rounded-xl px-3 py-2 text-[13px] text-fg-muted/50">
                      {row}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>

        <section aria-label="Agreed requirements" className={SECTION}>
          <h2 className={LABEL}>Agreed requirements</h2>
          {agreedRequirements.length > 0 ? (
            <ul className="flex list-disc flex-col gap-1 pl-4 text-[13px] text-fg/90">
              {agreedRequirements.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-fg-muted italic">Not agreed yet</p>
          )}
        </section>

        <section aria-label="Todos" className={SECTION}>
          <h2 className={LABEL}>Todos</h2>
          {checklist.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {checklist.map((t) => (
                <li key={t.id}>
                  <label className="flex cursor-pointer items-start gap-2.5 rounded-lg px-1 py-1 text-[13px] hover:bg-white/5">
                    <input type="checkbox" checked={t.done} onChange={() => toggle(t.id)} className="mt-0.5 size-4 accent-accent" />
                    <span className={cn(t.done && "text-fg-muted line-through")}>{t.text}</span>
                  </label>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-[13px] text-fg-muted italic">Todos appear once requirements are agreed.</p>
          )}
        </section>

        <section aria-label="Resources" className={SECTION}>
          <h2 className={LABEL}>Resources</h2>
          {learnItems.length > 0 ? (
            <ul className="flex flex-col gap-1">
              {learnItems.map((item) => {
                const done = learnCompleted.includes(item.id);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => onOpenLearnItem(item.id)}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] text-fg-muted transition-colors hover:bg-white/8 hover:text-fg"
                    >
                      <BookOpen size={14} strokeWidth={1.75} aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">{item.title}</span>
                      <span className="font-mono text-[11px]">{done ? "Done" : `${item.minutes} min`}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-[13px] text-fg-muted italic">No resources for this stage.</p>
          )}
        </section>

        <section aria-label="Meeting notes" className="min-h-0">
          <NotesCard notes={notes} readOnly title="Meeting notes" className="gap-3 p-4 [&_h2]:text-[18px] [&_h3]:text-[14px]" />
        </section>
      </div>

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Resize rail"
        aria-valuemin={RAIL_MIN_WIDTH}
        aria-valuemax={RAIL_MAX_WIDTH}
        aria-valuenow={width}
        tabIndex={0}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={onHandleKey}
        className="absolute inset-y-0 -right-1 z-10 w-2 cursor-col-resize transition-colors hover:bg-accent/30 focus-visible:bg-accent/30 focus-visible:outline-none"
      />
    </aside>
  );
}
