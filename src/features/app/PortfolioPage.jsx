import { Link } from 'react-router';
import { getScenario } from '@/data/scenarios/index.js';
import { useAuth } from '@/features/auth/auth-context.js';
import InitialsAvatar from '@/shared/InitialsAvatar.jsx';
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

function ProjectCard({ scenario, entry }) {
  return (
    <article className="flex flex-col gap-4 rounded-[20px] bg-[#17171a] p-5 ring-1 ring-white/[0.06] sm:flex-row">
      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[16px] bg-white">
        <img src={scenario.logo} alt="" className="h-8 w-8 object-contain" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h3 className="text-[17px] font-medium tracking-[-0.01em] text-tx">{scenario.title}</h3>
          <span className="text-[12.5px] text-tx-3">{dateFormat.format(new Date(entry.completedAt))}</span>
        </div>
        <p className="text-[14px] leading-[1.5] text-tx-2">{entry.summary}</p>
        <SkillBars scores={entry.scores} />
        <div className="flex flex-wrap gap-2">
          {scenario.tools.map((tool) => (
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
  const progress = useProgress();
  const entries = Object.entries(progress.completed)
    .map(([id, entry]) => ({ scenario: getScenario(id), entry }))
    .filter(({ scenario }) => scenario)
    .sort((a, b) => b.entry.completedAt.localeCompare(a.entry.completedAt));

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-8 px-4 py-6 sm:px-8 sm:py-10">
      <title>Portfolio · Flint</title>
      <header className="flex flex-col gap-6 rounded-[24px] bg-[linear-gradient(120deg,#1d1d21,#121214)] p-6 ring-1 ring-white/[0.06] sm:flex-row sm:items-center">
        <InitialsAvatar name={user.name} size={72} className="ring-2 ring-spark" />
        <div className="flex-1">
          <h1 className="text-[28px] font-normal tracking-[-0.03em] text-tx">{user.name}</h1>
          <p className="mt-1 text-[14px] text-tx-2">
            Level {progress.level} · {progress.xp} XP · {entries.length} {entries.length === 1 ? 'project' : 'projects'}
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
          entries.map(({ scenario, entry }) => <ProjectCard key={scenario.id} scenario={scenario} entry={entry} />)
        ) : (
          <div className="rounded-[20px] border border-dashed border-white/15 p-10 text-center">
            <p className="text-[15px] text-tx-2">Finish a scenario and it lands here, reviewed by your manager.</p>
            <Link
              to="/app"
              className="key-light mt-5 inline-flex h-11 items-center rounded-full px-6 text-[14.5px] font-medium text-onink"
            >
              Find a scenario
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
