import React from 'react';
import { ease, range, useViewProgress } from './hooks.js';
import { WaveLine } from './Learn.jsx';
import { Mark, Narrator } from './ui.jsx';

/** A small offer letter that opens between "you" and "hired." and is signed when the wave reaches the end. */
function OfferLetter({ open, signed }) {
  return (
    <span
      className="relative inline-block align-[-0.08em] transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{ width: open ? '1.55em' : '0.25em', height: '0.9em' }}
      aria-hidden="true"
    >
      <span
        className="absolute left-1/2 top-1/2 h-[1.05em] w-[0.82em] rounded-[0.06em] bg-white shadow-[0_0.08em_0.25em_rgba(0,0,0,0.18),0_0_0_0.01em_rgba(0,0,0,0.08)] transition-all duration-700"
        style={{ transform: `translate(-50%,-50%) rotate(${open ? -6 : 0}deg) scale(${open ? 1 : 0.2})`, opacity: open ? 1 : 0 }}
      >
        <i className="absolute left-[0.1em] top-[0.12em] h-[0.06em] w-[0.06em] rounded-full bg-[#1d9e4b]" />
        <i className="absolute left-[0.1em] right-[0.1em] top-[0.26em] h-[0.035em] rounded bg-[#d8d8d3]" />
        <i className="absolute left-[0.1em] right-[0.22em] top-[0.36em] h-[0.035em] rounded bg-[#d8d8d3]" />
        <i className="absolute left-[0.1em] right-[0.16em] top-[0.46em] h-[0.035em] rounded bg-[#d8d8d3]" />
        <i className="absolute bottom-[0.2em] left-[0.1em] right-[0.1em] h-[0.02em] bg-[#bdbdb7]" />
        <svg viewBox="0 0 60 20" className="absolute bottom-[0.2em] left-[0.1em] w-[0.6em]">
          <path
            d="M2 14c6-10 9-10 9-3s3 6 7-1 6-5 6 1 4 3 8-3 6-2 8 1 6 2 16-3"
            fill="none"
            stroke="#1b1d1c"
            strokeWidth="2"
            strokeLinecap="round"
            pathLength="1"
            strokeDasharray="1 1"
            strokeDashoffset={signed ? 0 : 1}
            style={{ transition: 'stroke-dashoffset 0.9s ease 0.2s' }}
          />
        </svg>
      </span>
    </span>
  );
}

export function Hired() {
  const [ref, p] = useViewProgress(0.9, 0.4);
  return (
    <section ref={ref} aria-labelledby="hired-title" className="flex min-h-[72svh] flex-col items-center justify-center px-6 py-[18svh] text-center">
      <h2 id="hired-title" className="text-[length:var(--h2)] font-normal leading-[1.08] tracking-[-0.045em]" aria-label="Built to get you hired.">
        <span aria-hidden="true">
          <WaveLine progress={p * 0.62}>Built to get you</WaveLine>
          <OfferLetter open={p > 0.45} signed={p > 0.95} />
          <WaveLine progress={range(p, 0.55, 1)}>hired.</WaveLine>
        </span>
        <Narrator clip="hired" size={46} className="ml-2 -translate-y-[0.35em]" />
      </h2>
      <p
        className="mt-[34px] text-[17px] leading-[1.3] tracking-[-0.01em] text-[#5b5d5a] transition-all duration-700"
        style={{ opacity: p > 0.7 ? 1 : 0, transform: `translateY(${p > 0.7 ? 0 : 12}px)` }}
      >
        Start free, then only $99 a month.
      </p>
    </section>
  );
}

const social = [
  {
    name: 'LinkedIn',
    href: 'https://www.linkedin.com/',
    d: 'M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.5h4V21H3V9.5Zm7 0h3.8v1.6h.06c.53-1 1.83-2 3.77-2 4.03 0 4.77 2.65 4.77 6.1V21h-4v-5.1c0-1.22-.02-2.78-1.7-2.78-1.7 0-1.96 1.33-1.96 2.7V21H10V9.5Z',
  },
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/',
    d: 'M12 7.3a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4Zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6Zm6-7.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0ZM12 3.6c2.7 0 3 0 4.1.06 2.7.12 4 1.42 4.13 4.13.05 1.06.06 1.38.06 4.1s0 3.05-.06 4.1c-.12 2.71-1.42 4.01-4.13 4.13-1.07.05-1.39.06-4.1.06s-3.04 0-4.1-.06c-2.72-.12-4.01-1.42-4.13-4.13C3.6 15.05 3.6 14.73 3.6 12s0-3.04.06-4.1C3.78 5.18 5.08 3.88 7.8 3.76 8.96 3.6 9.28 3.6 12 3.6Z',
  },
  { name: 'X', href: 'https://x.com/', d: 'M17.8 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8L17.8 3Zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5Z' },
];

/** The foot of the page: Zero World. Colour spreads out from Zero's dome as it comes into view. */
export function Footer() {
  const [ref, p] = useViewProgress(1, 0.05);
  const spread = ease(range(p, 0.25, 1));
  const tilt = 16 * (1 - ease(range(p, 0, 0.8)));
  const r = spread * 95; // % of the larger side

  return (
    <footer ref={ref} id="gate" aria-label="Zero World" className="relative h-[max(100svh,620px)] overflow-hidden">
      <div className="absolute inset-0 [perspective:1400px]">
        <div className="absolute inset-[-6%] origin-bottom" style={{ transform: `rotateX(${tilt}deg)` }}>
          <img src="/assets/shots/world-pale.webp" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
          <img
            src="/assets/shots/city@2x.webp"
            alt="Zero World, the city of companies where you work"
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              WebkitMaskImage: `radial-gradient(circle at 50% 52%, #000 ${r}%, rgba(0,0,0,0.35) ${r + 6}%, transparent ${r + 14}%)`,
              maskImage: `radial-gradient(circle at 50% 52%, #000 ${r}%, rgba(0,0,0,0.35) ${r + 6}%, transparent ${r + 14}%)`,
            }}
          />
        </div>
      </div>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[38%] bg-gradient-to-b from-[var(--page)] via-[rgba(248,249,251,0.6)] to-transparent" />

      <div className="absolute left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2">
        <span className="dome-ripple absolute left-1/2 top-1/2 h-[180px] w-[180px] rounded-full border border-white/80" aria-hidden="true" />
        <span className="dome-ripple absolute left-1/2 top-1/2 h-[180px] w-[180px] rounded-full border border-white/60 [animation-delay:1.4s]" aria-hidden="true" />
        <a
          href="https://learnwithzero.com"
          target="_blank"
          rel="noreferrer"
          className="relative flex items-center gap-2.5 rounded-full bg-white/85 py-2.5 pl-3 pr-5 text-[16px] tracking-[-0.01em] text-[#111] shadow-[0_14px_34px_-14px_rgba(0,0,0,0.5)] backdrop-blur transition-transform hover:scale-[1.03]"
        >
          <Mark className="h-7 w-7" />
          Enter Zero
        </a>
      </div>

      <div className="absolute inset-x-0 bottom-[max(24px,4svh)] mx-auto flex max-w-[1428px] items-center justify-between gap-3 px-4 lg:[width:calc(100%-16vw)] lg:px-0">
        <nav aria-label="Legal" className="flex h-[43px] items-center gap-[clamp(10px,1.5vw,22px)] rounded-full bg-[rgba(52,52,52,0.78)] px-[18px] text-[14px] text-white backdrop-blur">
          <a href="https://learnwithzero.com/terms.html" className="hover:underline">
            Terms
          </a>
          <a href="https://learnwithzero.com/privacy.html" className="hover:underline">
            Privacy
          </a>
          <span className="text-white/70">© 2026 Zero</span>
        </nav>
        <nav aria-label="Zero on social" className="flex h-[43px] items-center gap-[14px] rounded-full bg-[rgba(52,52,52,0.78)] px-[16px] text-white backdrop-blur">
          {social.map((s) => (
            <a key={s.name} href={s.href} target="_blank" rel="noreferrer" aria-label={`Zero on ${s.name}`} className="opacity-90 hover:opacity-100">
              <svg viewBox="0 0 24 24" className="h-[16px] w-[16px]" fill="currentColor" aria-hidden="true">
                <path d={s.d} />
              </svg>
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
