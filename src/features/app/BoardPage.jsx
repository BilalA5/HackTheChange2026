import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router';
import { useAuth } from '@/features/auth/auth-context.js';
import { progressOf, readinessOf } from '@/features/plan/progressOf.js';
import { usePlan } from '@/features/plan/usePlan.js';
import { XP_PER_LEVEL } from '@/services/progress.js';
import SoundToggle from '@/shared/SoundToggle.jsx';
import Wordmark from '@/shared/Wordmark.jsx';
import { play } from '@/shared/sound.js';
import AccountMenu from './AccountMenu.jsx';
import Board3D from './board/Board3D.jsx';
import DeedCard from './board/DeedCard.jsx';
import HiredSheet from './board/HiredSheet.jsx';
import PlanSheet from './board/PlanSheet.jsx';
import { useProgress } from './useProgress.js';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const initialsOf = (name) =>
  name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const panel = 'rounded-[18px] bg-[#141416]/90 shadow-[inset_0_0_0_1px_rgba(255,255,255,.08)] backdrop-blur-md';

function Stat({ label, value, meter }) {
  return (
    <div className="min-w-[96px]">
      <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-tx-3">{label}</div>
      <div className="mt-1 text-[18px] font-medium tabular-nums tracking-[-0.02em] text-tx">{value}</div>
      {meter !== undefined && (
        <div className="mt-[6px] h-[3px] rounded-full bg-white/10">
          <i
            className="block h-full rounded-full bg-spark transition-[width] duration-700"
            style={{ width: `${meter}%` }}
          />
        </div>
      )}
    </div>
  );
}

function useArrowKeys(stops, selectedId, select) {
  useEffect(() => {
    const onKey = (event) => {
      if (event.target.closest('input, textarea, [contenteditable]')) return;
      const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
      if (!step) return;
      event.preventDefault();
      const index = stops.findIndex((stop) => stop.id === selectedId);
      const next = stops[(index + step + stops.length) % stops.length];
      select(next.id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stops, selectedId, select]);
}

function Board({ plan, progress, user }) {
  const standing = progressOf(plan, progress);
  const [selectedId, setSelectedId] = useState(() => (standing.current ?? plan.stops.at(-1)).id);
  const [overview, setOverview] = useState(false);
  const [sheet, setSheet] = useState(null);
  const selected = plan.stops.find((stop) => stop.id === selectedId) ?? plan.stops[0];
  const readiness = readinessOf(plan, progress);
  const intoLevel = progress.xp % XP_PER_LEVEL;
  const portfolioCount = Object.keys(progress.completed).length;

  const select = (id) => {
    if (id === selectedId && !overview) return;
    play('slide');
    play('tick', { delay: 0.05 });
    setOverview(false);
    setSelectedId(id);
  };
  const openSheet = (name) => {
    play('whoosh');
    setSheet(name);
  };
  const toggleOverview = () => {
    play('slide');
    setOverview((value) => !value);
  };

  useArrowKeys(plan.stops, selectedId, select);

  const corners = {
    start: {
      label: 'Start',
      onClick: () => openSheet('plan'),
      children: (
        <>
          <span className="text-[17px] font-semibold tracking-[-0.02em] text-ink">Your plan</span>
          <span className="text-[12px] text-ink-3">{plan.totalWeeks} weeks</span>
        </>
      ),
    },
    portfolio: {
      label: 'Portfolio',
      children: (
        <>
          <span className="font-serif text-[40px] leading-none text-ink">{portfolioCount}</span>
          <span className="text-[12px] text-ink-3">reviewed</span>
        </>
      ),
    },
    level: {
      label: 'Level',
      children: (
        <>
          <span className="font-serif text-[40px] leading-none text-ink">{progress.level}</span>
          <span className="text-[12px] tabular-nums text-ink-3">
            {intoLevel} / {XP_PER_LEVEL} XP
          </span>
        </>
      ),
    },
    hired: {
      label: 'Get hired',
      onClick: () => openSheet('hired'),
      children: (
        <>
          <span className="font-serif text-[40px] leading-none text-ink">{readiness.percent}%</span>
          <span className="text-[12px] text-ink-3">job-ready</span>
        </>
      ),
    },
  };

  const deed = (
    <DeedCard
      key={selected.id}
      stop={selected}
      number={plan.stops.indexOf(selected) + 1}
      phase={plan.phases.find((phase) => phase.id === selected.phaseId)}
      status={standing.statusOf(selected)}
      previous={standing.previousOf(selected)}
      review={progress.completed[selected.id]}
    />
  );

  return (
    <div className="board-room relative flex min-h-svh flex-col lg:block lg:h-svh lg:overflow-hidden">
      <header className="relative z-20 flex items-start justify-between gap-4 px-5 pt-5 lg:absolute lg:inset-x-0 lg:top-0">
        <div>
          <Link to="/app" aria-label="Flint home" className="inline-flex">
            <Wordmark size={22} />
          </Link>
          <p className="mb-0 mt-4 text-[14px] text-tx-2">
            {greeting()}, {user.name.split(' ')[0]}
          </p>
          <h1 className="mb-0 mt-1 font-serif text-[clamp(1.7rem,1.1rem+1.4vw,2.6rem)] font-normal leading-[1.04] tracking-[-0.03em] text-tx">
            The road to {plan.roleTitle}
          </h1>
          {plan.tailoring === 'pending' && (
            <p className="mb-0 mt-2 flex items-center gap-2 text-[13px] text-tx-2">
              <i className="h-[6px] w-[6px] animate-pulse rounded-full bg-spark" />
              Tailoring your briefs
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <SoundToggle className={`h-[42px] w-[42px] text-tx-2 hover:text-tx ${panel}`} />
          <AccountMenu />
        </div>
      </header>

      <div className="relative h-[62svh] shrink-0 lg:absolute lg:inset-y-0 lg:left-0 lg:right-[400px] lg:h-auto">
        <Board3D
          plan={plan}
          standing={standing}
          selectedId={selected.id}
          onSelect={select}
          overview={overview}
          initials={initialsOf(user.name)}
          corners={corners}
        />
      </div>

      <div
        className={`relative z-20 mx-4 flex flex-wrap items-center gap-x-6 gap-y-3 px-5 py-4 lg:absolute lg:bottom-5 lg:left-5 lg:mx-0 ${panel}`}
      >
        <Stat label="Level" value={progress.level} meter={(intoLevel / XP_PER_LEVEL) * 100} />
        <Stat label="XP" value={progress.xp.toLocaleString()} />
        <Stat label="Portfolio" value={portfolioCount} />
        <button
          type="button"
          onClick={() => openSheet('hired')}
          className="text-left transition hover:opacity-80"
          aria-label="See what job-ready means"
        >
          <Stat label="Job-ready" value={`${readiness.percent}%`} meter={readiness.percent} />
        </button>
        <span className="hidden h-9 w-px bg-white/10 sm:block" />
        <button
          type="button"
          onClick={toggleOverview}
          className="h-9 rounded-full bg-white/[0.07] px-4 text-[13px] text-tx-2 transition hover:bg-white/[0.12] hover:text-tx"
        >
          {overview ? 'Back to my stop' : 'See the whole board'}
        </button>
      </div>

      <aside className="relative z-20 px-4 pb-8 pt-4 lg:absolute lg:bottom-5 lg:right-5 lg:top-[92px] lg:flex lg:w-[370px] lg:items-end lg:p-0">
        {deed}
      </aside>

      {sheet === 'plan' && <PlanSheet plan={plan} standing={standing} onClose={() => setSheet(null)} />}
      {sheet === 'hired' && <HiredSheet plan={plan} readiness={readiness} onClose={() => setSheet(null)} />}
    </div>
  );
}

export default function BoardPage() {
  const { user } = useAuth();
  const { plan, ready } = usePlan();
  const progress = useProgress();

  if (!ready || !progress.ready) return <div className="board-room min-h-svh" />;
  if (!plan) return <Navigate to="/onboarding/role" replace />;

  return (
    <>
      <title>Your board · Flint</title>
      <Board key={plan.createdAt} plan={plan} progress={progress} user={user} />
    </>
  );
}
