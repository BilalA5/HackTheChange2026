import { Link } from 'react-router';
import { glass } from './glass.js';
import { ArrowGlyph, LockGlyph } from './glyphs.jsx';

function Person({ persona }) {
  return (
    <div className="flex min-w-0 items-center gap-[10px]">
      <img src={persona.photo} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-white/10" />
      <div className="min-w-0 leading-tight">
        <div className="truncate text-[13.5px] font-medium text-tx">{persona.name}</div>
        <div className="text-[12px] text-tx-3">{persona.role}</div>
      </div>
    </div>
  );
}

function Fact({ label, children }) {
  return (
    <div>
      <dt className="text-[11.5px] text-tx-3">{label}</dt>
      <dd className="mt-[3px] text-[13.5px] tabular-nums text-tx">{children}</dd>
    </div>
  );
}

/** The selected stop, drawn like a property's title deed: colour band on top, the terms underneath. */
export default function DeedCard({ stop, number, phase, status, previous, review }) {
  return (
    <article
      className="pointer-events-auto flex max-h-full w-full flex-col overflow-hidden rounded-[22px] shadow-[inset_0_0_0_1px_rgba(255,255,255,.09),0_30px_60px_-30px_rgba(0,0,0,.9)]"
      style={glass}
    >
      <header className="px-5 pb-[14px] pt-[13px] text-center" style={{ background: stop.color }}>
        <p className="m-0 font-mono text-[10.5px] uppercase tracking-[0.18em] text-black/55">
          Stop {number} · {phase.title}
        </p>
        <h2 className="mb-0 mt-[6px] text-[19px] font-semibold leading-[1.15] tracking-[-0.02em] text-[#111] [text-wrap:balance]">
          {stop.title}
        </h2>
      </header>

      <div className="no-scrollbar flex min-h-0 flex-col gap-4 overflow-y-auto px-5 pb-5 pt-4">
        <p className="m-0 text-[14px] leading-[1.5] text-tx-2">{stop.summary}</p>

        <div className="grid grid-cols-2 gap-3">
          <Person persona={stop.manager} />
          <Person persona={stop.coach} />
        </div>

        <div className="flex flex-wrap gap-[6px]">
          {stop.skills.map((skill) => (
            <span
              key={skill}
              className="rounded-full px-[10px] py-[5px] text-[12px] text-tx-2 ring-1 ring-white/[0.12]"
            >
              {skill}
            </span>
          ))}
        </div>

        <dl className="m-0 grid grid-cols-3 gap-3 border-t border-white/[0.08] pt-4">
          <Fact label="Week">{stop.week}</Fact>
          <Fact label="Time">{stop.hours} hrs</Fact>
          <Fact label="Reward">+{stop.xp} XP</Fact>
        </dl>

        {review && (
          <p className="m-0 rounded-[12px] bg-spark/10 px-4 py-3 text-[13px] leading-[1.45] text-[#bfe8c8]">
            {review.summary}
          </p>
        )}

        {status === 'locked' ? (
          <p className="m-0 flex items-center justify-center gap-2 rounded-full bg-white/[0.05] px-4 py-[14px] text-[13.5px] text-tx-2">
            <LockGlyph className="h-[14px] w-[14px]" />
            Finish {previous ? `“${previous.shortTitle}”` : 'the stop before'} first
          </p>
        ) : (
          <Link
            to={`/app/scenarios/${encodeURIComponent(stop.id)}`}
            className="key-light flex h-[50px] items-center justify-center gap-2 rounded-full text-[15.5px] font-medium text-onink transition hover:-translate-y-0.5"
          >
            {status === 'done' ? 'Open again' : 'Start this stop'}
            <ArrowGlyph className="h-4 w-4" />
          </Link>
        )}
      </div>
    </article>
  );
}
