import { statusOf } from './status.js';

const badge = {
  ready: { label: 'Ready', className: 'bg-spark/15 text-[#7fd693]' },
  completed: { label: 'Completed', className: 'bg-white/10 text-tx' },
  locked: { label: 'Locked', className: 'bg-white/[0.04] text-tx-3' },
};

export default function ScenarioList({ scenarios, progress, selectedId, onSelect }) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" aria-label="Scenarios">
      {scenarios.map((scenario) => {
        const status = statusOf(scenario, progress);
        const selected = scenario.id === selectedId;
        return (
          <li key={scenario.id}>
            <button
              type="button"
              onClick={() => onSelect(scenario.id)}
              aria-pressed={selected}
              className={`flex w-full items-center gap-3 rounded-[16px] p-3 text-left transition ${
                selected
                  ? 'bg-white/[0.08] ring-1 ring-white/20'
                  : 'bg-[#17171a] ring-1 ring-white/[0.06] hover:bg-white/[0.05]'
              }`}
            >
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-white">
                <img src={scenario.logo} alt="" className="h-6 w-6 object-contain" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[14.5px] font-medium text-tx">{scenario.shortTitle}</span>
                <span className="block truncate text-[12.5px] text-tx-3">{scenario.company}</span>
              </span>
              <span className={`rounded-full px-[10px] py-[3px] text-[12px] ${badge[status].className}`}>
                {scenario.comingSoon ? 'Soon' : badge[status].label}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
