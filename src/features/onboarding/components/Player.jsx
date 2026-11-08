import { IMG, steps } from '../content.js';
import { useTour } from '../tour.js';
import { Avatar, Star } from './brand.jsx';
import { RoundButton } from './controls.jsx';
import { ChevronLeftIcon, ChevronRightIcon, CloseIcon, PauseIcon, SoundIcon } from './icons.jsx';

const glassFrame = {
  background: 'rgba(255,255,255,.1)',
  backdropFilter: 'blur(24px) saturate(1.3)',
  WebkitBackdropFilter: 'blur(24px) saturate(1.3)',
  boxShadow:
    'inset 0 0 0 1px rgba(255,255,255,.13), inset 0 1px 0 rgba(255,255,255,.28), 0 0 0 1px rgba(0,0,0,.55), 0 50px 130px -30px rgba(0,0,0,.85), 0 14px 36px -10px rgba(0,0,0,.5)',
};

export function CityBehind({ blur = 7, dim = 0.5 }) {
  return (
    <div className="bleed overflow-hidden">
      <img
        src={`${IMG}/city.jpg`}
        alt=""
        className="absolute inset-0 h-full w-full scale-[1.035] object-cover"
        style={{ filter: `blur(${blur}px) brightness(${dim}) saturate(.85)` }}
      />
    </div>
  );
}

function StepPill({ step }) {
  const { next, prev } = useTour();
  const current = steps.findIndex((s) => s.id === step);

  return (
    <div className="pill-field inline-flex h-11 select-none items-center gap-[10px] whitespace-nowrap rounded-full px-[6px]">
      <button
        type="button"
        onClick={prev}
        aria-label="Previous step"
        className="grid h-8 w-8 place-items-center rounded-full text-tx-2 hover:text-tx"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </button>
      <span className="text-[13px] text-tx">{steps[current]?.short}</span>
      <span className="flex items-center gap-[6px]">
        {steps.map((s, i) =>
          i === current ? (
            <i key={s.id} className="relative h-1 w-[22px] overflow-hidden rounded-full bg-tx-4">
              <i className="absolute inset-y-0 left-0 w-[30%] rounded-full bg-tx" />
            </i>
          ) : (
            <i key={s.id} className={`h-1 w-1 rounded-full ${i < current ? 'bg-tx-2' : 'bg-tx-4'}`} />
          ),
        )}
      </span>
      <button
        type="button"
        onClick={next}
        aria-label="Next step"
        className="grid h-8 w-8 place-items-center rounded-full text-tx-2 hover:text-tx"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

function PlayerBar({ step, caption, turn, points, guide }) {
  return (
    <div className="absolute left-[96px] top-[716px] z-20 flex h-[100px] w-[1408px] items-center gap-4 px-[22px]">
      {guide ? <Avatar size={52} /> : <span className="w-[52px] flex-none" />}
      <div className="min-w-0 flex-1">
        {turn ? (
          <div className="flex items-center gap-3 whitespace-nowrap text-[16px] leading-[1.2] text-tx-2">
            <span className="flex items-center gap-[10px] font-medium text-tx">
              <i className="animate-wait h-2 w-2 rounded-full bg-tx" />
              Your turn
            </span>
            <span>{turn}</span>
          </div>
        ) : (
          <p className="m-0 max-w-[640px] text-[16px] leading-[1.4] tracking-[-0.012em] text-tx [text-wrap:pretty]">
            {caption}
          </p>
        )}
      </div>
      <div className="pill-field inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-full pl-[13px] pr-4 text-[13px] text-tx">
        <Star />
        <b className="min-w-[1ch] text-right text-[14.5px] font-semibold tabular-nums">{points}</b>
        <em className="not-italic text-tx-3">skill points</em>
      </div>
      <StepPill step={step} />
      <RoundButton label="Pause">
        <PauseIcon className="h-4 w-4" />
      </RoundButton>
      <RoundButton label="Playback speed">
        <span className="text-[13px] font-medium">1x</span>
      </RoundButton>
      <RoundButton label="Sound">
        <SoundIcon className="h-[17px] w-[17px]" />
      </RoundButton>
    </div>
  );
}

/**
 * The in-scenario frame: a glass bezel over the blurred city, the picture inside it, and the bar under it.
 * Set `guide` to false when the guide appears inside the picture, so the bar keeps the avatar's space empty.
 */
export default function Player({ step, caption, turn, points = 0, guide = true, picture = 'bg-[#1E1E1E]', children }) {
  const { exit } = useTour();

  return (
    <>
      <CityBehind />
      <div className="absolute left-[88px] top-[16px] z-[9] h-[808px] w-[1424px] rounded-[30px]" style={glassFrame}>
        <div
          className="absolute inset-2 rounded-[22px] bg-page"
          style={{ boxShadow: '0 0 0 1px rgba(0,0,0,.7), inset 0 1px 0 rgba(255,255,255,.07)' }}
        />
      </div>
      <div
        className={`absolute left-[96px] top-[24px] z-10 h-[692px] w-[1408px] overflow-hidden rounded-t-[22px] ${picture}`}
      >
        {children}
      </div>
      <PlayerBar step={step} caption={caption} turn={turn} points={points} guide={guide} />
      <button
        type="button"
        onClick={exit}
        aria-label="Leave the tour"
        className="absolute right-[28px] top-[46px] z-30 grid h-11 w-11 place-items-center rounded-full bg-[#141416] text-tx shadow-[inset_0_0_0_1px_rgba(255,255,255,.08)] transition hover:bg-[#1f1f22]"
      >
        <CloseIcon className="h-[18px] w-[18px]" />
      </button>
    </>
  );
}
