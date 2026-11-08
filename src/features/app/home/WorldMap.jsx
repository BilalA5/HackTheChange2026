import { statusOf } from './status.js';

function Pin({ scenario, status, selected, onSelect }) {
  const locked = status === 'locked';
  return (
    <button
      type="button"
      onClick={() => onSelect(scenario.id)}
      aria-pressed={selected}
      aria-label={`${scenario.company}: ${scenario.shortTitle}`}
      className="group absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${scenario.map.x}%`, top: `${scenario.map.y}%` }}
    >
      {!locked && <span className="app-ping absolute left-1/2 top-1/2 h-8 w-8 rounded-full bg-white/50" />}
      <span
        className={`relative flex h-[32px] items-center gap-2 whitespace-nowrap rounded-full pl-[10px] pr-[14px] text-[13.5px] shadow-[0_8px_20px_-8px_rgba(0,0,0,.6)] transition group-hover:scale-105 ${
          locked ? 'bg-[#141416]/80 text-white/70 backdrop-blur-md' : 'bg-white text-[#141416]'
        } ${selected ? 'ring-2 ring-spark ring-offset-2 ring-offset-transparent' : ''}`}
      >
        <img src={scenario.logo} alt="" className={`h-4 w-4 object-contain ${locked ? 'brightness-0 invert' : ''}`} />
        <b className="font-medium">{scenario.company}</b>
        {status === 'completed' && <span className="text-spark-deep">Done</span>}
        {status === 'ready' && (
          <span className="flex items-center gap-[6px] text-spark-deep">
            <i className="h-[6px] w-[6px] rounded-full bg-spark" />
            Ready
          </span>
        )}
        {locked && <span>{scenario.comingSoon ? 'Soon' : `Level ${scenario.unlockLevel}`}</span>}
      </span>
    </button>
  );
}

export default function WorldMap({ scenarios, progress, selectedId, onSelect }) {
  return (
    <div className="relative aspect-[1800/1012] w-full overflow-hidden rounded-[24px] bg-[#16222f] ring-1 ring-white/[0.08]">
      <img
        src="/assets/onboarding/city.jpg"
        alt="Your world: a city of company headquarters"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(8,10,14,.15),rgba(8,10,14,0)_40%,rgba(8,10,14,.35))]" />
      {scenarios.map((scenario) => (
        <Pin
          key={scenario.id}
          scenario={scenario}
          status={statusOf(scenario, progress)}
          selected={scenario.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
