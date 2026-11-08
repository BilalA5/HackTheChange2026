import { IMG, caseStudy } from '../../content.js';
import { CaretUpIcon, ChevronLeftIcon, LockIcon, TableIcon } from '../icons.jsx';
import MonoLabel from '../MonoLabel.jsx';

export default function StagePanel({ highlightResources = false }) {
  const { stage } = caseStudy;

  return (
    <aside className="absolute left-[14px] top-[22px] w-[250px]">
      <button type="button" aria-label="Back" className="ml-[10px] grid h-6 w-6 place-items-center text-tx-2">
        <ChevronLeftIcon className="h-4 w-4" />
      </button>
      <div className="mt-[8px] flex items-center gap-[11px] pl-[4px]">
        <span className="grid h-8 w-8 flex-none place-items-center rounded-full bg-[#2A1A1E]">
          <img src={`${IMG}/ws-airbnb-mark.svg`} alt="" className="h-[18px] w-[18px]" />
        </span>
        <span className="text-[13.5px] font-medium leading-[1.3] text-tx">
          {caseStudy.title}
          <br />
          at {caseStudy.company}
        </span>
      </div>

      <div className="mt-[14px] rounded-[14px] bg-[#1F1F22] px-[15px] pb-[4px] pt-[14px] shadow-[inset_0_0_0_1px_rgba(255,255,255,.06)]">
        <h2 className="m-0 text-[17px] font-semibold tracking-[-0.015em] text-tx">{stage.title}</h2>
        <MonoLabel className="mt-[18px] text-tx-2">Requirements</MonoLabel>
        <ul className="m-0 mt-[12px] flex list-none flex-col gap-[16px] p-0">
          {stage.requirements.map((requirement) => (
            <li key={requirement} className="flex gap-[14px] text-[13px] font-medium leading-[1.3] text-tx">
              <i className="mt-[6px] h-[5px] w-[5px] flex-none rounded-full bg-tx-4" />
              <span className="max-w-[162px]">{requirement}</span>
            </li>
          ))}
        </ul>
        <div
          className={`-mx-[11px] mt-[18px] rounded-[12px] px-[11px] pb-[12px] pt-[10px] ${
            highlightResources ? 'shadow-[0_0_0_2px_#fff]' : ''
          }`}
        >
          <MonoLabel className="text-tx-2">Resources</MonoLabel>
          <div className="mt-[12px] flex items-center gap-[10px] text-[12.5px] text-tx">
            <TableIcon className="h-3 w-3 text-tx-3" />
            {stage.resource}
          </div>
        </div>
      </div>

      <div className="mt-[22px] flex items-center justify-between px-[4px] text-tx-3">
        <span className="flex items-center gap-2">
          <CaretUpIcon className="h-[9px] w-[9px]" />
          <MonoLabel as="span">Upcoming stages</MonoLabel>
        </span>
        <span className="font-mono text-[10px]">{stage.upcoming.length}</span>
      </div>
      <ul className="m-0 mt-[14px] flex list-none flex-col gap-[16px] p-0 pl-[4px]">
        {stage.upcoming.map((title) => (
          <li key={title} className="flex items-center gap-[12px] text-[12.5px] text-tx-4">
            <LockIcon className="h-3 w-3" />
            {title}
          </li>
        ))}
      </ul>
    </aside>
  );
}
