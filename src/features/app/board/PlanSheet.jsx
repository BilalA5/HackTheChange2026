import { Link } from 'react-router';
import { withArticle } from '@/features/plan/buildPlan.js';
import { startingPointById } from '@/features/plan/questions.js';
import Sheet from './Sheet.jsx';

export default function PlanSheet({ plan, standing, onClose }) {
  return (
    <Sheet
      eyebrow="Your plan"
      title={`Job-ready as ${withArticle(plan.roleTitle)} in ${plan.totalWeeks} weeks`}
      onClose={onClose}
    >
      <p className="m-0 text-[14.5px] leading-[1.5] text-tx-2">
        {startingPointById[plan.startingPoint]?.label ?? 'Your starting point'}, {plan.hoursPerWeek} hours a week.{' '}
        {plan.stops.length} projects, {plan.totalHours} hours in all. {plan.coach.name} coaches you the whole way.
        {plan.tailoring === 'pending' && ' Your briefs are being tailored to you right now.'}
      </p>

      <ol className="mb-0 mt-6 flex list-none flex-col gap-4 p-0">
        {standing.phases.map((phase) => (
          <li key={phase.id}>
            <div className="flex items-center justify-between gap-3 text-[14px]">
              <span className="flex items-center gap-[10px] text-tx">
                <i className="h-3 w-3 rounded-[4px]" style={{ background: phase.color }} />
                {phase.title}
              </span>
              <span className="tabular-nums text-tx-3">
                {phase.done} / {phase.total}
              </span>
            </div>
            <div className="mt-2 h-[4px] rounded-full bg-white/10">
              <i
                className="block h-full rounded-full transition-[width] duration-700"
                style={{ width: `${(phase.done / phase.total) * 100}%`, background: phase.color }}
              />
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-6 flex flex-wrap gap-2">
        {plan.tools.map((tool) => (
          <span key={tool.name} className="rounded-full px-3 py-[5px] text-[12.5px] text-tx-2 ring-1 ring-white/[0.12]">
            {tool.name}
          </span>
        ))}
      </div>

      <Link
        to="/onboarding/role"
        className="key-dark mt-6 flex h-11 items-center justify-center rounded-full text-[14px] font-medium text-tx"
      >
        Change my goal
      </Link>
    </Sheet>
  );
}
