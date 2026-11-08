import { badges } from './content.js';
import { ChevronLeft, Sparkle } from './icons.jsx';

const badgeGlyphs = {
  bulb: (
    <path
      d="M12 3.5a6 6 0 0 0-3.6 10.8c.7.5 1.1 1.3 1.1 2.1v.6h5v-.6c0-.8.4-1.6 1.1-2.1A6 6 0 0 0 12 3.5zM9.8 19h4.4v1.3a1.2 1.2 0 0 1-1.2 1.2h-2a1.2 1.2 0 0 1-1.2-1.2z"
      fill="currentColor"
    />
  ),
  star: <path d="M12 3.2l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.6l-5.2 2.8 1-5.9-4.3-4.1 5.9-.8z" fill="currentColor" />,
  chat: (
    <path
      d="M5.5 5h13A1.5 1.5 0 0 1 20 6.5v8.5a1.5 1.5 0 0 1-1.5 1.5H10l-4.2 3.3c-.3.2-.8 0-.8-.4v-2.9A1.5 1.5 0 0 1 4 15V6.5A1.5 1.5 0 0 1 5.5 5z"
      fill="currentColor"
    />
  ),
  shield: <path d="M12 2.8l7 2.7v5.6c0 4.6-3 8.5-7 10-4-1.5-7-5.4-7-10V5.5z" fill="currentColor" />,
};

const RADIUS = 12.2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function ProgressBadge({ glyph, progress, label }) {
  const percent = Math.round(progress * 100);
  return (
    <div className="relative h-[27px] w-[27px]" title={`${label}: ${percent}%`}>
      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 27 27" aria-hidden="true">
        <circle cx="13.5" cy="13.5" r={RADIUS} fill="none" stroke="#262626" strokeWidth="2.4" />
        <circle
          cx="13.5"
          cy="13.5"
          r={RADIUS}
          fill="none"
          stroke="var(--ring)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeDasharray={`${CIRCUMFERENCE * progress} ${CIRCUMFERENCE}`}
        />
      </svg>
      <div className="badge-face absolute inset-[2px] flex items-center justify-center rounded-full text-[#c8c7c5]">
        <svg width="12" height="12" viewBox="0 0 24 24" aria-hidden="true">
          {badgeGlyphs[glyph]}
        </svg>
      </div>
      <span className="sr-only">
        {label}, {percent} percent
      </span>
    </div>
  );
}

export default function TopBar({ onBack }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex h-[54px] items-center justify-between pl-[19px] pr-[16px]">
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        className="pointer-events-auto flex h-[26px] w-[26px] items-center justify-center rounded-md text-[#b9b9b9] hover:bg-white/5 hover:text-white"
      >
        <ChevronLeft />
      </button>
      <div className="pointer-events-auto flex items-center gap-[7px]">
        <div className="flex h-[31px] items-center gap-[6px] rounded-full border border-[#303030] bg-[var(--chip)] pl-[13px] pr-[15px]">
          <Sparkle />
          <span className="text-[15px] font-medium text-[#f1f1f1]">L1</span>
        </div>
        <div className="flex h-[33px] items-center gap-[3px] rounded-full bg-gradient-to-b from-[#252525] to-[#292929] pl-[3.5px]">
          {badges.map((badge) => (
            <ProgressBadge key={badge.glyph} {...badge} />
          ))}
          <img
            src="/assets/workspace/avatar-user.png"
            alt="Your profile"
            className="ml-[3px] h-[34px] w-[34px] rounded-full object-cover"
          />
        </div>
      </div>
    </div>
  );
}
