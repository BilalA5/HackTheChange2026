import { Link } from "react-router";
import { ArrowLeft } from "lucide-react";
import type { Rubric, StageMode } from "@pw/shared";
import { StageModeToggle } from "@/components/domain/StageModeToggle";
import { XpChip } from "@/components/domain/XpChip";
import { PerformanceBadge } from "@/components/domain/PerformanceBadge";
import { RubricView } from "@/components/domain/RubricView";
import { LevelPill } from "@/components/domain/LevelPill";
import { Tooltip } from "@/components/ui/Tooltip";
import { Timer } from "@/components/ui/Timer";
import { overallFromRubric } from "./helpers";

export interface StageTopBarProps {
  scenarioTitle: string;
  stageTitle: string;
  stageId: string;
  mode: StageMode;
  onModeChange(mode: StageMode): void;
  modeDisabled: boolean;
  timeSpentSec: number;
  timerRunning: boolean;
  xpEarned: number;
  performance: Rubric | null;
  level: number | undefined;
}

/** 52 px bar: back, title, mode toggle, live timer, XP, performance and level. */
export function StageTopBar({
  scenarioTitle,
  stageTitle,
  stageId,
  mode,
  onModeChange,
  modeDisabled,
  timeSpentSec,
  timerRunning,
  xpEarned,
  performance,
  level,
}: StageTopBarProps) {
  return (
    <header className="flex h-[52px] shrink-0 items-center gap-3 border-b border-line px-4">
      <Link
        to="/"
        aria-label="Back to map"
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-fg-muted transition-colors hover:bg-white/8 hover:text-fg"
      >
        <ArrowLeft size={17} strokeWidth={1.75} aria-hidden="true" />
      </Link>
      <h1 className="min-w-0 truncate text-[14px] font-medium">
        <span className="text-fg-muted">{scenarioTitle}</span>
        <span className="mx-2 text-fg-muted/60" aria-hidden="true">
          ·
        </span>
        {stageTitle}
      </h1>

      <div className="ml-auto flex shrink-0 items-center gap-3">
        <StageModeToggle value={mode} onChange={onModeChange} disabled={modeDisabled} />
        <Timer key={stageId} initialSeconds={timeSpentSec} running={timerRunning} className="w-[52px] text-right" />
        <XpChip amount={xpEarned} />
        {performance ? (
          <Tooltip content={<RubricView rubric={performance} variant="full" className="w-[300px] text-fg" />} side="bottom">
            <span className="inline-flex">
              <PerformanceBadge level={overallFromRubric(performance)} />
            </span>
          </Tooltip>
        ) : (
          <PerformanceBadge level={null} />
        )}
        {level !== undefined && <LevelPill level={level} />}
      </div>
    </header>
  );
}
