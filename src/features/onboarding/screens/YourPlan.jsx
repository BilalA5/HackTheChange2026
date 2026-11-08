import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/features/auth/auth-context.js';
import { buildPlan, sameAnswers, withArticle } from '@/features/plan/buildPlan.js';
import { planStore, savePlan, tailorPlan } from '@/services/plans.js';
import { Avatar, WordmarkChip } from '../components/brand.jsx';
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon } from '../components/icons.jsx';
import { useTour } from '../tour.js';

const buildingSteps = [
  'Reading your goal',
  'Choosing your projects',
  'Matching you with companies',
  'Setting your pace',
];
const BUILD_MS = 2200;

function Building({ roleTitle }) {
  const [done, setDone] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setDone((count) => count + 1), BUILD_MS / buildingSteps.length);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="absolute inset-0 flex flex-col items-center bg-page">
      <WordmarkChip />
      <Avatar size={64} className="mt-[220px]" />
      <p className="mb-0 mt-[30px] font-serif text-[34px] leading-[1.14] tracking-[-0.03em] text-tx">
        Building your plan to become {withArticle(roleTitle)}
      </p>
      <ul className="mt-[40px] flex flex-col gap-[14px]">
        {buildingSteps.map((step, i) => (
          <li
            key={step}
            className={`flex items-center gap-3 text-[16px] transition-colors duration-300 ${i < done ? 'text-tx' : 'text-tx-4'}`}
          >
            <i
              className={`grid h-5 w-5 place-items-center rounded-full transition ${i < done ? 'bg-spark text-spark-ink' : 'bg-field'}`}
            >
              {i < done && <CheckIcon className="h-[10px] w-[10px]" />}
            </i>
            {step}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PhaseList({ plan }) {
  const stopsById = new Map(plan.stops.map((stop) => [stop.id, stop]));
  let number = 0;

  return (
    <ol className="no-scrollbar flex h-full flex-col gap-6 overflow-y-auto pb-6 pr-2">
      {plan.phases.map((phase) => {
        const stops = phase.stopIds.map((id) => stopsById.get(id));
        const firstWeek = stops[0].week;
        const lastWeek = stops.at(-1).week;
        return (
          <li key={phase.id} className="animate-rise">
            <header className="flex items-center gap-3">
              <i className="h-3 w-3 rounded-[4px]" style={{ background: phase.color }} />
              <h3 className="m-0 text-[15px] font-medium tracking-[-0.01em] text-tx">{phase.title}</h3>
              <span className="text-[13px] text-tx-3">
                {firstWeek === lastWeek ? `Week ${firstWeek}` : `Weeks ${firstWeek}–${lastWeek}`}
              </span>
            </header>
            <ul className="mt-3 flex flex-col gap-2">
              {stops.map((stop) => {
                number += 1;
                return (
                  <li
                    key={stop.id}
                    className="flex items-center gap-4 rounded-[16px] bg-card px-4 py-3 shadow-[inset_0_0_0_1px_rgba(255,255,255,.05)]"
                  >
                    <span className="w-5 text-right font-mono text-[12px] tabular-nums text-tx-3">{number}</span>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-[#2a2a2f]">
                      <img src={stop.logo} alt="" className="h-[18px] w-[18px] object-contain" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] text-tx">{stop.title}</span>
                      <span className="block truncate text-[13px] text-tx-3">{stop.task}</span>
                    </span>
                    <span className="shrink-0 text-[13px] tabular-nums text-tx-2">{stop.hours} hrs</span>
                    <span className="w-[62px] shrink-0 text-right text-[13px] tabular-nums text-tx-3">
                      +{stop.xp} XP
                    </span>
                  </li>
                );
              })}
            </ul>
          </li>
        );
      })}
    </ol>
  );
}

function Stat({ value, label }) {
  return (
    <div>
      <div className="font-serif text-[30px] leading-none tracking-[-0.03em] text-white">{value}</div>
      <div className="mt-2 text-[13px] text-white/60">{label}</div>
    </div>
  );
}

export default function YourPlan() {
  const { user } = useAuth();
  const { answers, prev, finish } = useTour();
  const plan = useMemo(() => {
    const saved = planStore.peek(user.id);
    return sameAnswers(saved, answers) ? saved : buildPlan(answers);
  }, [answers, user.id]);
  const [building, setBuilding] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setBuilding(false), BUILD_MS + 300);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (planStore.peek(user.id) === plan) return;
    savePlan(user.id, plan).then(() => tailorPlan(user.id));
  }, [plan, user.id]);

  if (building) return <Building roleTitle={plan.roleTitle} />;

  const totalXp = plan.stops.reduce((sum, stop) => sum + stop.xp, 0);

  return (
    <div className="absolute inset-0 bg-page">
      <WordmarkChip />

      <section className="animate-rise absolute left-[96px] top-[86px] h-[640px] w-[520px] overflow-hidden rounded-[30px] bg-card">
        <img src={plan.poster} alt="" className="absolute inset-0 h-full w-full object-cover object-top" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/10" />
        <div className="absolute inset-x-8 bottom-8">
          <p className="m-0 font-mono text-[12px] uppercase tracking-[0.16em] text-white/60">Your plan</p>
          <h1 className="mb-0 mt-3 font-serif text-[40px] font-normal leading-[1.06] tracking-[-0.03em] text-white [text-wrap:balance]">
            Job-ready as {withArticle(plan.roleTitle)} in {plan.totalWeeks} weeks
          </h1>
          <div className="mt-7 grid grid-cols-3 gap-4">
            <Stat value={plan.stops.length} label="projects" />
            <Stat value={`${plan.hoursPerWeek} hrs`} label="a week" />
            <Stat value={totalXp.toLocaleString()} label="XP to earn" />
          </div>
          <div className="mt-7 flex items-center gap-3 border-t border-white/15 pt-5">
            <Avatar src={plan.coach.photo} size={40} ring={false} />
            <p className="m-0 text-[14px] leading-[1.4] text-white/80">
              <b className="font-medium text-white">{plan.coach.name}</b> coaches you the whole way, and a new manager
              runs each project.
            </p>
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            {plan.tools.map((tool) => (
              <span key={tool.name} className="rounded-full bg-white/10 px-3 py-[5px] text-[12.5px] text-white/85">
                {tool.name}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="absolute left-[664px] right-[96px] top-[86px] h-[640px]">
        <PhaseList plan={plan} />
      </section>

      <button
        type="button"
        onClick={prev}
        className="key-dark absolute bottom-[20px] left-[22px] z-30 flex h-11 items-center gap-2 rounded-full pl-4 pr-5 text-[14px] font-medium text-tx transition hover:-translate-y-0.5"
      >
        <ChevronLeftIcon className="h-4 w-4" />
        Change answers
      </button>
      <button
        type="button"
        onClick={() => finish('/app')}
        className="key-light absolute bottom-[20px] right-[22px] z-30 flex h-11 items-center gap-2 rounded-full pl-5 pr-4 text-[14px] font-medium text-onink transition hover:-translate-y-0.5"
      >
        Start my plan
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
