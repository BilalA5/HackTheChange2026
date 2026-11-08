import { Link } from 'react-router';

function Person({ persona }) {
  return (
    <div className="flex items-center gap-3">
      <img src={persona.photo} alt="" className="h-10 w-10 rounded-full object-cover ring-2 ring-white/10" />
      <div className="leading-tight">
        <div className="text-[14px] font-medium text-tx">{persona.name}</div>
        <div className="text-[12.5px] text-tx-3">
          {persona.role}
          {persona.style && ` · ${persona.style}`}
        </div>
      </div>
    </div>
  );
}

const actionLabel = { ready: 'Start scenario', completed: 'Open again' };

export default function ScenarioDetail({ scenario, status, review }) {
  if (status === 'locked') {
    return (
      <section className="rounded-[24px] bg-[#17171a] p-6 ring-1 ring-white/[0.06]">
        <img src={scenario.logo} alt="" className="h-8 w-8 object-contain brightness-0 invert" />
        <h2 className="mt-4 text-[22px] font-medium tracking-[-0.02em] text-tx">{scenario.shortTitle}</h2>
        <p className="mt-2 text-[14.5px] leading-[1.5] text-tx-2">{scenario.summary}</p>
        <p className="mt-6 rounded-[12px] bg-white/[0.04] px-4 py-3 text-[13.5px] text-tx-2">
          Unlocks at level {scenario.unlockLevel}. Finish ready scenarios to level up.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-5 rounded-[24px] bg-[#17171a] p-6 ring-1 ring-white/[0.06]">
      {scenario.art ? (
        <img src={scenario.art} alt="" className="mx-auto w-[240px]" />
      ) : (
        <span className="grid h-14 w-14 place-items-center rounded-[16px] bg-white">
          <img src={scenario.logo} alt="" className="h-8 w-8 object-contain" />
        </span>
      )}
      <div>
        <p className="text-[12.5px] uppercase tracking-[0.14em] text-tx-3">
          {scenario.company} · {scenario.role}
        </p>
        <h2 className="mt-2 text-[22px] font-medium leading-[1.2] tracking-[-0.02em] text-tx">{scenario.title}</h2>
        <p className="mt-2 text-[14.5px] leading-[1.5] text-tx-2">{scenario.summary}</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Person persona={scenario.manager} />
        <Person persona={scenario.coach} />
      </div>

      <div className="flex flex-wrap gap-2">
        {scenario.skills.map((skill) => (
          <span key={skill} className="rounded-full px-3 py-[6px] text-[12.5px] text-tx-2 ring-1 ring-white/[0.12]">
            {skill}
          </span>
        ))}
      </div>

      <dl className="grid grid-cols-2 gap-3 text-[13px]">
        <div>
          <dt className="text-tx-3">Estimated time</dt>
          <dd className="mt-1 text-tx">{scenario.duration}</dd>
        </div>
        <div>
          <dt className="text-tx-3">Tools</dt>
          <dd className="mt-1 text-tx">{scenario.tools.join(', ')}</dd>
        </div>
      </dl>

      {review && (
        <p className="rounded-[12px] bg-spark/10 px-4 py-3 text-[13.5px] leading-[1.45] text-[#bfe8c8]">
          {review.summary}
        </p>
      )}

      <Link
        to={`/app/scenarios/${scenario.id}`}
        className="key-light flex h-[52px] items-center justify-center rounded-full text-[16px] font-medium text-onink transition hover:-translate-y-0.5"
      >
        {actionLabel[status]}
      </Link>
    </section>
  );
}
