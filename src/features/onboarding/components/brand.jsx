import Wordmark from '@/shared/Wordmark.jsx';
import { IMG, guide } from '../content.js';

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

export function WordmarkChip() {
  return (
    <div className="absolute left-[22px] top-[22px] grid h-10 place-items-center rounded-full bg-card px-4">
      <Wordmark size={16} />
    </div>
  );
}
