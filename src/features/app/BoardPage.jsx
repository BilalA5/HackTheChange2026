import { useState } from 'react';
import { Link, Navigate } from 'react-router';
import { useAuth } from '@/features/auth/auth-context.js';
import { progressOf, readinessOf } from '@/features/plan/progressOf.js';
import { usePlan } from '@/features/plan/usePlan.js';
import { XP_PER_LEVEL } from '@/services/progress.js';
import Wordmark from '@/shared/Wordmark.jsx';
import AccountMenu from './AccountMenu.jsx';
import CityBackdrop from './board/CityBackdrop.jsx';
import CompanyPins from './board/CompanyPins.jsx';
import DeedCard from './board/DeedCard.jsx';
import HiredSheet from './board/HiredSheet.jsx';
import { boardLayout } from './board/layout.js';
import PlanSheet from './board/PlanSheet.jsx';
import { glass } from './board/glass.js';
import Tile, { TileFrame } from './board/Tile.jsx';
import { BriefcaseGlyph, FlagGlyph, SparkGlyph } from './board/glyphs.jsx';
import { useProgress } from './useProgress.js';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function Corner({ slot, label, icon, accent = false, onClick, to, children }) {
  const body = (
    <>
      <span className="flex items-center justify-between">
        <span className={`font-mono text-[10.5px] uppercase tracking-[0.18em] ${accent ? 'text-spark' : 'text-tx-3'}`}>
          {label}
        </span>
        <span className="text-tx-3">{icon}</span>
      </span>
      <span className="mt-auto block">{children}</span>
    </>
  );
  const className = 'flex h-full w-full flex-col p-[14px] text-left transition-colors hover:bg-white/[0.05]';

  return (
    <TileFrame slot={slot}>
      {to ? (
        <Link to={to} className={className}>
          {body}
        </Link>
      ) : (
        <button type="button" onClick={onClick} className={className}>
          {body}
        </button>
      )}
    </TileFrame>
  );
}

function Meter({ value, color = '#49BA61' }) {
  return (
    <span className="mt-2 block h-[4px] rounded-full bg-white/10">
      <i
        className="block h-full rounded-full transition-[width] duration-700"
        style={{ width: `${Math.min(100, value)}%`, background: color }}
      />
    </span>
  );
}

function PhaseLegend({ phases, onSelect }) {
  return (
    <ul className="pointer-events-auto m-0 flex list-none flex-wrap gap-2 p-0">
      {phases.map((phase) => (
        <li key={phase.id}>
          <button
            type="button"
            onClick={() => onSelect(phase)}
            className="flex h-8 items-center gap-2 rounded-full pl-3 pr-[12px] text-[12.5px] text-tx-2 shadow-[inset_0_0_0_1px_rgba(255,255,255,.08)] transition hover:text-tx"
            style={glass}
          >
            <i className="h-[10px] w-[10px] rounded-[3px]" style={{ background: phase.color }} />
            <span className="max-w-[170px] truncate">{phase.title}</span>
            <span className="tabular-nums text-tx-3">
              {phase.done}/{phase.total}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function TailoringBadge({ state }) {
  if (state !== 'pending') return null;
  return (
    <span className="ml-3 inline-flex h-7 items-center gap-2 rounded-full bg-white/10 px-3 align-middle text-[12.5px] text-tx-2">
      <i className="h-[6px] w-[6px] animate-pulse rounded-full bg-spark" />
      Tailoring your briefs
    </span>
  );
}

function Board({ plan, progress, user }) {
  const standing = progressOf(plan, progress);
  const [selectedId, setSelectedId] = useState(() => (standing.current ?? plan.stops.at(-1)).id);
  const [sheet, setSheet] = useState(null);
  const selected = plan.stops.find((stop) => stop.id === selectedId) ?? plan.stops[0];
  const selectedNumber = plan.stops.indexOf(selected) + 1;
  const phaseOf = (stop) => plan.phases.find((phase) => phase.id === stop.phaseId);
  const layout = boardLayout(plan.stops.length);
  const readiness = readinessOf(plan, progress);
  const intoLevel = progress.xp % XP_PER_LEVEL;
  const portfolioCount = Object.keys(progress.completed).length;

  const selectPhase = (phase) => {
    const stops = plan.stops.filter((stop) => stop.phaseId === phase.id);
    setSelectedId((stops.find((stop) => standing.statusOf(stop) !== 'done') ?? stops[0]).id);
  };

  const deed = (
    <DeedCard
      key={selected.id}
      stop={selected}
      number={selectedNumber}
      phase={phaseOf(selected)}
      status={standing.statusOf(selected)}
      previous={standing.previousOf(selected)}
      review={progress.completed[selected.id]}
    />
  );

  const header = (
    <header className="pointer-events-auto">
      <Link to="/app" aria-label="Flint home" className="inline-flex drop-shadow-[0_2px_10px_rgba(0,0,0,.4)]">
        <Wordmark size={22} />
      </Link>
      <p className="mb-0 mt-4 text-[14px] text-white/75 drop-shadow-[0_1px_6px_rgba(0,0,0,.6)]">
        {greeting()}, {user.name.split(' ')[0]}
      </p>
      <h1 className="mb-0 mt-1 font-serif text-[clamp(1.9rem,1.2rem+1.6vw,2.9rem)] font-normal leading-[1.04] tracking-[-0.03em] text-white drop-shadow-[0_2px_18px_rgba(0,0,0,.55)]">
        Your path to {plan.roleTitle}
        <TailoringBadge state={plan.tailoring} />
      </h1>
      <p className="mb-0 mt-2 text-[14px] text-white/75 drop-shadow-[0_1px_6px_rgba(0,0,0,.6)]">
        {standing.complete
          ? `Plan complete: all ${plan.stops.length} projects done.`
          : `Week ${standing.week} of ${plan.totalWeeks} · ${standing.doneCount} of ${plan.stops.length} projects done`}
      </p>
    </header>
  );

  return (
    <>
      <CityBackdrop>
        <CompanyPins
          stops={plan.stops}
          statusOf={standing.statusOf}
          selectedId={selected.id}
          onSelect={setSelectedId}
        />
      </CityBackdrop>

      <div
        className="board-grid pointer-events-none fixed inset-3 z-10 hidden lg:grid"
        style={{
          gridTemplateColumns: `var(--corner) repeat(${layout.across}, minmax(0, 1fr)) var(--corner)`,
          gridTemplateRows: `var(--corner) repeat(${layout.sides}, minmax(0, 1fr)) var(--corner)`,
        }}
      >
        <Corner
          slot={layout.corners.start}
          label="Start"
          icon={<FlagGlyph className="h-[18px] w-[18px]" />}
          accent
          onClick={() => setSheet('plan')}
        >
          <span className="block text-[15px] font-medium leading-[1.15] tracking-[-0.02em] text-tx">Your plan</span>
          <span className="mt-1 block text-[12px] text-tx-3">
            {plan.totalWeeks} weeks · {plan.hoursPerWeek} hrs/wk
          </span>
        </Corner>

        {plan.stops.map((stop, i) => (
          <Tile
            key={stop.id}
            stop={stop}
            number={i + 1}
            slot={layout.slots[i]}
            status={standing.statusOf(stop)}
            selected={stop.id === selected.id}
            userName={user.name}
            onSelect={setSelectedId}
          />
        ))}

        {layout.slots.slice(plan.stops.length).map((slot) => (
          <TileFrame key={`${slot.row}-${slot.column}`} slot={slot}>
            <div className="flex h-full flex-col items-center justify-center gap-2 p-3 text-center">
              <img src={plan.coach.photo} alt="" className="h-9 w-9 rounded-full object-cover ring-2 ring-white/10" />
              <span className="text-[12px] leading-[1.3] text-tx-3">
                Stuck? {plan.coach.name} is in every project chat.
              </span>
            </div>
          </TileFrame>
        ))}

        <Corner
          slot={layout.corners.portfolio}
          label="Portfolio"
          icon={<BriefcaseGlyph className="h-[18px] w-[18px]" />}
          to="/app/portfolio"
        >
          <span className="block font-serif text-[30px] leading-none tracking-[-0.03em] text-tx">{portfolioCount}</span>
          <span className="mt-1 block text-[12px] text-tx-3">
            reviewed {portfolioCount === 1 ? 'project' : 'projects'}
          </span>
        </Corner>

        <Corner slot={layout.corners.level} label="Level" icon={<SparkGlyph className="h-[16px] w-[16px]" />}>
          <span className="block font-serif text-[30px] leading-none tracking-[-0.03em] text-tx">{progress.level}</span>
          <span className="mt-1 block text-[12px] tabular-nums text-tx-3">
            {intoLevel} / {XP_PER_LEVEL} XP
          </span>
          <Meter value={(intoLevel / XP_PER_LEVEL) * 100} />
        </Corner>

        <Corner
          slot={layout.corners.hired}
          label="Get hired"
          icon={<BriefcaseGlyph className="h-[18px] w-[18px]" />}
          accent={readiness.percent === 100}
          onClick={() => setSheet('hired')}
        >
          <span className="block font-serif text-[30px] leading-none tracking-[-0.03em] text-tx">
            {readiness.percent}%
          </span>
          <span className="mt-1 block text-[12px] text-tx-3">job-ready</span>
          <Meter value={readiness.percent} />
        </Corner>

        <div
          className="grid min-h-0 grid-cols-[minmax(0,1fr)_minmax(320px,380px)] gap-6 p-5"
          style={{ gridRow: layout.center.row, gridColumn: layout.center.column }}
        >
          <div className="flex min-h-0 flex-col justify-between gap-4">
            {header}
            <PhaseLegend phases={standing.phases} onSelect={selectPhase} />
          </div>
          <div className="flex min-h-0 flex-col items-end gap-3">
            <AccountMenu />
            <div className="flex min-h-0 w-full flex-1 items-end">{deed}</div>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex min-h-svh flex-col gap-5 px-4 pb-8 pt-5 lg:hidden">
        <div className="flex items-start justify-between gap-4">
          {header}
          <AccountMenu />
        </div>
        <ol className="no-scrollbar -mx-4 flex list-none gap-3 overflow-x-auto px-4 pb-1">
          {plan.stops.map((stop, i) => (
            <li key={stop.id} className="grid h-[132px] w-[200px] shrink-0">
              <Tile
                stop={stop}
                number={i + 1}
                slot={{ side: 'bottom', row: 1, column: 1 }}
                status={standing.statusOf(stop)}
                selected={stop.id === selected.id}
                userName={user.name}
                onSelect={setSelectedId}
              />
            </li>
          ))}
        </ol>
        {deed}
        <div className="grid grid-cols-2 gap-3 text-[13px]">
          <button
            type="button"
            onClick={() => setSheet('plan')}
            className="rounded-[14px] px-4 py-3 text-left text-tx"
            style={glass}
          >
            Your plan · {plan.totalWeeks} weeks
          </button>
          <Link to="/app/portfolio" className="rounded-[14px] px-4 py-3 text-tx" style={glass}>
            Portfolio · {portfolioCount}
          </Link>
          <span className="rounded-[14px] px-4 py-3 text-tx" style={glass}>
            Level {progress.level} · {progress.xp} XP
          </span>
          <button
            type="button"
            onClick={() => setSheet('hired')}
            className="rounded-[14px] px-4 py-3 text-left text-tx"
            style={glass}
          >
            {readiness.percent}% job-ready
          </button>
        </div>
      </div>

      {sheet === 'plan' && <PlanSheet plan={plan} standing={standing} onClose={() => setSheet(null)} />}
      {sheet === 'hired' && <HiredSheet plan={plan} readiness={readiness} onClose={() => setSheet(null)} />}
    </>
  );
}

export default function BoardPage() {
  const { user } = useAuth();
  const { plan, ready } = usePlan();
  const progress = useProgress();

  if (!ready || !progress.ready) return <CityBackdrop />;
  if (!plan) return <Navigate to="/onboarding/role" replace />;

  return (
    <>
      <title>Your board · Flint</title>
      <Board key={plan.createdAt} plan={plan} progress={progress} user={user} />
    </>
  );
}
