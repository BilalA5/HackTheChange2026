import { IMG, guide } from '../content.js';

const MARKS = {
  light: '/assets/brand/flint-mark-light.svg',
  dark: '/assets/brand/flint-mark.svg',
};

export function Wordmark({ size = 24, tone = 'light', className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-[0.26em] font-semibold leading-none tracking-[-0.05em] ${
        tone === 'light' ? 'text-white' : 'text-[#141416]'
      } ${className}`}
      style={{ fontSize: size }}
    >
      <img src={MARKS[tone]} alt="" className="h-[1.05em] w-[1.05em]" />
      flint
    </span>
  );
}

export function Star({ className = 'h-[19px] w-[19px]' }) {
  return <img src={`${IMG}/xp-star.webp`} alt="" className={`${className} object-contain`} />;
}

const RING = '0 0 0 3px rgba(255,255,255,.85), 0 8px 18px -8px rgba(0,0,0,.6)';

export function Avatar({ src = guide.photo, size = 56, ring = true, className = '' }) {
  return (
    <span
      className={`relative inline-block flex-none overflow-hidden rounded-full ${className}`}
      style={{ width: size, height: size, boxShadow: ring ? RING : undefined }}
    >
      <img src={src} alt="" className="h-full w-full object-cover" />
    </span>
  );
}
