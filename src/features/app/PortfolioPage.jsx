import { Link } from 'react-router';
import { useAuth } from '@/features/auth/auth-context.js';
import { usePlan } from '@/features/plan/usePlan.js';
import InitialsAvatar from '@/shared/InitialsAvatar.jsx';
import Wordmark from '@/shared/Wordmark.jsx';
import AccountMenu from './AccountMenu.jsx';
import CityBackdrop from './board/CityBackdrop.jsx';
import { glass } from './board/glass.js';
import { useProgress } from './useProgress.js';

const skillLabels = {
  insight: 'Insight',
  quality: 'Quality',
  communication: 'Communication',
  reliability: 'Reliability',
};

const dateFormat = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

function averageScores(entries) {
  const totals = {};
  for (const { scores } of entries) {
    for (const [skill, score] of Object.entries(scores)) totals[skill] = (totals[skill] ?? 0) + score;
  }
  return Object.fromEntries(Object.entries(totals).map(([skill, total]) => [skill, total / entries.length]));
}

function SkillBars({ scores }) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
      {Object.entries(scores).map(([skill, score]) => (
        <div key={skill}>
          <dt className="flex justify-between text-[12.5px] text-tx-3">
            {skillLabels[skill]}
            <span className="tabular-nums text-tx">{Math.round(score * 100)}</span>
          </dt>
          <dd className="mt-[6px] h-[4px] rounded-full bg-white/10">
            <i className="block h-full rounded-full bg-spark" style={{ width: `${score * 100}%` }} />
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ProjectCard({ entry }) {
  return (
    <article
      className="relative flex flex-col gap-4 overflow-hidden rounded-[20px] p-5 shadow-[inset_0_0_0_1px_rgba(255,255,255,.08)] sm:flex-row"
      style={glass}
    >
      {entry.color && <i className="absolute inset-y-0 left-0 w-[5px]" style={{ background: entry.color }} />}
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[16px] bg-white/[0.08]">
        <img src={entry.logo} alt="" className="h-7 w-7 object-contain" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-[17px] font-medium tracking-[-0.01em] text-tx">{entry.title}</h3>
          <span className="text-[12.5px] text-tx-3">{dateFormat.format(new Date(entry.completedAt))}</span>
        </div>
        <p className="text-[14px] leading-[1.5] text-tx-2">{entry.summary}</p>
        <SkillBars scores={entry.scores} />
        <div className="flex flex-wrap gap-2">
          {entry.tools.map((tool) => (
            <span key={tool} className="rounded-full px-3 py-[5px] text-[12px] text-tx-2 ring-1 ring-white/[0.12]">
              {tool}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

export default function PortfolioPage() {
  const { user } = useAuth();
  const { plan } = usePlan();
  const progress = useProgress();
  const entries = Object.entries(progress.completed)
    .map(([id, entry]) => ({ id, entry }))
    .sort((a, b) => b.entry.completedAt.localeCompare(a.entry.completedAt));

  return (
    <>
      <CityBackdrop dim />
      <div className="relative z-10 mx-auto flex max-w-[1100px] flex-col gap-8 px-4 py-6 sm:px-8 sm:py-8">
        <title>Portfolio · Flint</title>
        <nav className="flex items-center justify-between gap-4">
          <Link
            to="/app"
            className="flex h-10 items-center gap-3 rounded-full pl-4 pr-5 text-[14px] text-tx shadow-[inset_0_0_0_1px_rgba(255,255,255,.1)]"
            style={glass}
          >
            <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M13 8H3M7 4L3 8l4 4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to the board
          </Link>
          <Wordmark size={22} />
          <AccountMenu />
        </nav>
        <header
          className="flex flex-col gap-6 rounded-[24px] p-6 shadow-[inset_0_0_0_1px_rgba(255,255,255,.08)] sm:flex-row sm:items-center"
          style={glass}
        >
          <InitialsAvatar name={user.name} size={72} className="ring-2 ring-spark" />
          <div className="flex-1">
            <h1 className="text-[28px] font-normal tracking-[-0.03em] text-tx">{user.name}</h1>
            <p className="mt-1 text-[14px] text-tx-2">
              {plan ? `Becoming ${plan.roleTitle} · ` : ''}Level {progress.level} · {progress.xp} XP · {entries.length}{' '}
              {entries.length === 1 ? 'project' : 'projects'}
            </p>
          </div>
        </header>

        {entries.length > 0 && (
          <section className="flex flex-col gap-4">
            <h2 className="text-[13px] uppercase tracking-[0.14em] text-tx-3">Skills so far</h2>
            <SkillBars scores={averageScores(entries.map(({ entry }) => entry))} />
          </section>
        )}

        <section className="flex flex-col gap-4">
          <h2 className="text-[13px] uppercase tracking-[0.14em] text-tx-3">Projects</h2>
          {entries.length ? (
            entries.map(({ id, entry }) => <ProjectCard key={id} entry={entry} />)
          ) : (
            <div className="rounded-[20px] border border-dashed border-white/15 p-10 text-center" style={glass}>
              <p className="text-[15px] text-tx-2">
                Finish a stop on your board and it lands here, reviewed by your manager.
              </p>
              <Link
                to="/app"
                className="key-light mt-5 inline-flex h-11 items-center rounded-full px-6 text-[14.5px] font-medium text-onink"
              >
                Back to the board
              </Link>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
