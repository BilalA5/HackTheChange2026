import { useState } from 'react';
import { caseStudy, guide, learner } from '../../content.js';
import { TurnHint } from '../hints.jsx';
import { ArrowUpIcon, PlusIcon } from '../icons.jsx';
import MonoLabel from '../MonoLabel.jsx';

function DraftAttachment() {
  return (
    <div className="w-[150px] overflow-hidden rounded-[10px] bg-[#1E1E21] shadow-[inset_0_0_0_1px_rgba(255,255,255,.08)]">
      <div className="h-[73px] bg-[#E9E8E3] px-[25px] pt-[8px]">
        <div className="h-full rounded-t-[2px] bg-white px-[8px] pt-[8px] text-[5px] leading-[1.6] text-[#333]">
          <b className="block text-[5.5px]">Why hosts cancel</b>
          <span className="block text-[#999]">
            {learner.name} · {learner.role}
          </span>
          <span className="mt-1 block text-[#999]">Top reason</span>
          <b className="block">Calendar conflicts</b>
          <i className="mt-1 block h-[2px] w-full bg-[#ddd]" />
        </div>
      </div>
      <div className="px-[9px] pb-[8px] pt-[7px]">
        <div className="text-[11px] font-medium text-tx">{caseStudy.stage.draft}</div>
        <MonoLabel className="mt-[2px] text-[8px] text-tx-3">PDF · Your draft</MonoLabel>
      </div>
    </div>
  );
}

function GuidedToggle() {
  const [guided, setGuided] = useState(false);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={guided}
      onClick={() => setGuided((on) => !on)}
      className="flex items-center gap-[8px] text-[12.5px] text-tx-2"
    >
      <span className={`relative h-[16px] w-[28px] rounded-full transition ${guided ? 'bg-spark' : 'bg-[#3A3A3E]'}`}>
        <i
          className={`absolute top-[2px] h-3 w-3 rounded-full transition-all ${guided ? 'left-[14px] bg-white' : 'left-[2px] bg-[#9a9aa0]'}`}
        />
      </span>
      Guided mode
    </button>
  );
}

export default function Composer({ attachment = false, onSubmit }) {
  return (
    <div
      className={`absolute left-[581px] w-[526px] rounded-[18px] bg-[#262629] px-[11px] pb-[11px] shadow-[inset_0_0_0_1px_rgba(255,255,255,.08)] ${
        attachment ? 'top-[456px] pt-[10px]' : 'top-[572px] pt-[16px]'
      }`}
    >
      {attachment && <DraftAttachment />}
      <input
        type="text"
        placeholder={`Message ${guide.name}...`}
        aria-label={`Message ${guide.name}`}
        className={`block w-full bg-transparent px-[4px] text-[13.5px] text-tx placeholder:text-tx-3 focus:outline-none ${attachment ? 'mt-[14px]' : ''}`}
      />
      <div className="mt-[16px] flex items-center gap-[12px] pl-[4px]">
        <button type="button" aria-label="Attach" className="text-tx-2">
          <PlusIcon className="h-[13px] w-[13px]" />
        </button>
        <GuidedToggle />
        <span className="flex-1" />
        {attachment ? (
          <div className="relative">
            <TurnHint className="!absolute bottom-[46px] left-1/2 -translate-x-1/2 whitespace-nowrap" />
            <span className="absolute -inset-[5px] rounded-full shadow-[0_0_0_2px_#fff]" />
            <button
              type="button"
              onClick={onSubmit}
              className="relative flex h-8 items-center gap-[7px] rounded-full bg-white px-4 text-[13px] font-semibold text-[#141416]"
            >
              Submit
              <ArrowUpIcon className="h-3 w-3" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            aria-label="Send"
            className="grid h-8 w-8 place-items-center rounded-full bg-[#323236] text-tx-4"
          >
            <ArrowUpIcon className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
