import SoundToggle from '@/shared/SoundToggle.jsx';
import { play } from '@/shared/sound.js';
import { useTour } from '../tour.js';
import { Avatar, WordmarkChip } from './brand.jsx';
import { ContinueButton } from './controls.jsx';
import { ChevronLeftIcon } from './icons.jsx';

const QUESTION_COUNT = 3;

function Steps({ current }) {
  return (
    <div className="absolute left-1/2 top-[34px] flex -translate-x-1/2 items-center gap-[6px]" aria-hidden="true">
      {Array.from({ length: QUESTION_COUNT }, (_, i) => (
        <i
          key={i}
          className={`h-1 rounded-full transition-all duration-500 ease-tour ${
            i === current ? 'w-[22px] bg-tx' : i < current ? 'w-1 bg-tx-2' : 'w-1 bg-tx-4'
          }`}
        />
      ))}
    </div>
  );
}

/** The frame shared by the "build your plan" questions: guide, question, answers, back and continue. */
export default function Question({ step, title, hint, canContinue, onContinue, children }) {
  const { index, prev, next } = useTour();

  return (
    <div className="absolute inset-0 bg-page">
      <WordmarkChip />
      <Steps current={step} />
      <div className="absolute inset-x-0 top-[72px] flex flex-col items-center text-center">
        <Avatar size={56} />
        <h1 className="mb-0 mt-[22px] max-w-[760px] font-serif text-[36px] font-normal leading-[1.1] tracking-[-0.03em] text-tx [text-wrap:balance]">
          {title}
        </h1>
        {hint && <p className="mb-0 mt-[10px] text-[16px] leading-[1.4] text-tx-2">{hint}</p>}
      </div>
      {children}
      {index > 0 && (
        <button
          type="button"
          onClick={prev}
          className="key-dark absolute bottom-[20px] left-[22px] z-30 flex h-11 items-center gap-2 rounded-full pl-4 pr-5 text-[14px] font-medium text-tx transition hover:-translate-y-0.5"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          Back
        </button>
      )}
      <ContinueButton disabled={!canContinue} onClick={onContinue ?? next} />
      <SoundToggle className="absolute right-[22px] top-[22px] h-10 w-10 bg-card text-tx-2 hover:text-tx" />
    </div>
  );
}

export function Choice({ selected, onSelect, className = '', children }) {
  return (
    <button
      type="button"
      onClick={() => {
        play('tick');
        onSelect();
      }}
      aria-pressed={selected}
      className={`text-left transition duration-200 ease-tour hover:-translate-y-0.5 ${
        selected ? 'key-light text-onink' : 'key-dark text-tx'
      } ${className}`}
    >
      {children}
    </button>
  );
}
