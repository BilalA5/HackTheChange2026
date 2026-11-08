import { Link } from 'react-router';
import { withArticle } from '@/features/plan/buildPlan.js';
import Sheet from './Sheet.jsx';
import { CheckGlyph } from './glyphs.jsx';

export default function HiredSheet({ plan, readiness, onClose }) {
  const ready = readiness.percent === 100;

  return (
    <Sheet
      eyebrow="Get hired"
      title={ready ? `You're ready to apply as ${withArticle(plan.roleTitle)}` : `${readiness.percent}% job-ready`}
      onClose={onClose}
    >
      <p className="m-0 text-[14.5px] leading-[1.5] text-tx-2">
        {ready
          ? 'Lead with your capstone, link your portfolio, and use your reviews as talking points.'
          : 'Hiring managers want proof you can do the work. Check these off and your portfolio does the talking.'}
      </p>
      <ul className="mb-0 mt-5 flex list-none flex-col gap-2 p-0">
        {readiness.checks.map((check) => (
          <li
            key={check.label}
            className="flex items-center gap-3 rounded-[14px] bg-white/[0.04] px-4 py-3 text-[14px]"
          >
            <i
              className={`grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full ${
                check.done ? 'bg-spark text-spark-ink' : 'ring-1 ring-white/20'
              }`}
            >
              {check.done && <CheckGlyph className="h-3 w-3" />}
            </i>
            <span className={check.done ? 'text-tx' : 'text-tx-2'}>{check.label}</span>
          </li>
        ))}
      </ul>
      <Link
        to="/app/portfolio"
        className="key-light mt-6 flex h-11 items-center justify-center rounded-full text-[14px] font-medium text-onink"
      >
        Open my portfolio
      </Link>
    </Sheet>
  );
}
