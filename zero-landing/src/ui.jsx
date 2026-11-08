import React, { useEffect, useState } from 'react';

/* ------------------------------------------------------------- narrator */

// One clip plays at a time across the page.
let current = null;
const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn(current?.key ?? null));

function playClip(key) {
  if (current?.key === key) {
    current.audio.pause();
    current = null;
    notify();
    return;
  }
  if (current) current.audio.pause();
  const audio = new Audio(`/assets/voice/navid-${key}.m4a`);
  current = { key, audio };
  const done = () => {
    if (current?.audio === audio) {
      current = null;
      notify();
    }
  };
  audio.addEventListener('ended', done);
  audio.addEventListener('error', done);
  audio.play().catch(done);
  notify();
}

/** Navid's face with a speaker badge. Pressing it plays his line for that part of the page. */
export function Narrator({ clip, size = 52, dark = false, className = '' }) {
  const [playing, setPlaying] = useState(null);
  useEffect(() => {
    listeners.add(setPlaying);
    return () => listeners.delete(setPlaying);
  }, []);
  const on = playing === clip;
  return (
    <button
      type="button"
      onClick={() => playClip(clip)}
      aria-pressed={on}
      aria-label={on ? 'Stop Navid' : 'Hear Navid, founder of Zero'}
      title="Navid, founder of Zero"
      className={`relative inline-flex shrink-0 align-middle transition-transform duration-300 hover:scale-105 ${className}`}
      style={{ width: size, height: size }}
    >
      {on && <span className="nv-ring absolute inset-0 rounded-full border-2 border-[var(--wave)]" aria-hidden="true" />}
      <img
        src="/assets/cast/navi-sq.webp"
        alt=""
        className={`h-full w-full rounded-full object-cover ${dark ? 'ring-1 ring-white/15' : 'ring-1 ring-black/5'}`}
        draggable="false"
      />
      <span
        className="absolute -bottom-[3px] -right-[5px] grid h-[46%] w-[46%] place-items-center rounded-full bg-[#111] text-white ring-2 ring-[var(--page)]"
        aria-hidden="true"
        style={dark ? { '--tw-ring-color': '#0b0b0c' } : undefined}
      >
        {on ? (
          <svg viewBox="0 0 24 24" className="h-[52%] w-[52%]">
            <rect x="6" y="6" width="12" height="12" rx="2.8" fill="currentColor" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-[62%] w-[62%]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3.6 9.3v5.4h3.5l5 4.1V5.2l-5 4.1H3.6Z" fill="currentColor" stroke="none" />
            <path d="M15.6 9a4.3 4.3 0 0 1 0 6" />
            <path d="M18.2 6.4a8 8 0 0 1 0 11.2" />
          </svg>
        )}
      </span>
    </button>
  );
}

/* ---------------------------------------------------------------- marks */

export function Mark({ className = '', style }) {
  return <img src="/assets/brand/mark-solid.svg" alt="" aria-hidden="true" className={className} style={style} draggable="false" />;
}

export function Logo({ name, dark = false, className = '', style, alt }) {
  return (
    <img
      src={`/assets/logos/${dark ? 'on-dark/' : ''}${name}.svg`}
      alt={alt ?? name}
      className={className}
      style={style}
      loading="lazy"
      draggable="false"
    />
  );
}

/* ---------------------------------------------------------------- icons */

export const Flame = () => (
  <svg viewBox="0 0 24 24" className="h-[14px] w-[14px]" aria-hidden="true">
    <path d="M12 2.5c.6 3.2 3.9 5 5.2 8.2 1.6 4-1 9.3-5.2 9.3s-6.6-3.4-5.9-6.9c.4-2 1.8-3.2 2.4-4.6.5 1.5 1.2 2.3 2.1 2.6C10 8 11.2 5 12 2.5Z" fill="#ff6a1a" />
    <path d="M12 12.2c1.6 1.7 2.8 3 2.4 4.8-.3 1.5-1.3 2.4-2.4 2.4s-2.3-.9-2.4-2.4c-.1-1.6 1.1-2.9 2.4-4.8Z" fill="#ffc23d" />
  </svg>
);

export const TrendUp = () => (
  <svg viewBox="0 0 24 24" className="h-[14px] w-[14px]" fill="none" stroke="#1d9e4b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 17l6-6 4 4 8-8" />
    <path d="M15 7h6v6" />
  </svg>
);

export const Play = ({ className = 'h-3 w-3' }) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <path d="M7 4.8v14.4a.8.8 0 0 0 1.2.7l11.6-7.2a.8.8 0 0 0 0-1.4L8.2 4.1A.8.8 0 0 0 7 4.8Z" fill="currentColor" />
  </svg>
);

export const SpeakerIcon = ({ muted }) => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
    <path d="M3.6 9.3v5.4h3.5l5 4.1V5.2l-5 4.1H3.6Z" fill="currentColor" stroke="none" />
    {muted ? <path d="M16 9.5l5 5M21 9.5l-5 5" /> : <path d="M15.6 9a4.3 4.3 0 0 1 0 6M18.2 6.4a8 8 0 0 1 0 11.2" />}
  </svg>
);
