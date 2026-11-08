import React from 'react';
import { ease, range, useStickyProgress } from './hooks.js';
import { Logo, Narrator } from './ui.jsx';

// Company and the logo's width-to-height ratio, as the live site lists them.
const companies = [
  ['google', 2.96],
  ['spotify', 3.24],
  ['airbnb', 3.12],
  ['stripe', 2.35],
  ['netflix', 3.6],
  ['openai', 3.61],
  ['shopify', 3.41],
  ['slack', 3.84],
  ['microsoft', 4.54],
  ['figma', 2.05],
];

// Stage is 1100 x 520; the portfolio sits in the middle.
const PF = { x: 550, y: 280, w: 560, h: 340 };
const slots = [0, 1, 2, 3, 4].map((row) => 80 + row * 100);

function Odometer({ value }) {
  const digits = String(value).padStart(2, ' ').split('');
  return (
    <span className="inline-flex overflow-hidden tabular-nums" style={{ height: '1.1em' }} aria-hidden="true">
      {digits.map((d, i) => (
        <span key={i} className="inline-block transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ transform: `translateY(${d === ' ' ? 0 : -Number(d) * 1.1}em)` }}>
          {Array.from({ length: 10 }, (_, n) => (
            <span key={n} className="block h-[1.1em] leading-[1.1em]" style={{ visibility: d === ' ' ? 'hidden' : 'visible' }}>
              {n}
            </span>
          ))}
        </span>
      ))}
    </span>
  );
}

/** "You learn. We match." The portfolio rests in the middle and companies are matched to it one by one. */
export default function Match() {
  const [ref, p] = useStickyProgress();
  const shown = companies.filter((_, i) => p > 0.12 + i * 0.075).length;
  const level = Math.max(1, shown);
  const head = ease(range(p, 0, 0.1));

  return (
    <section ref={ref} id="match" aria-labelledby="match-title" className="relative h-[280vh]">
      <div className="sticky top-0 flex h-[100svh] flex-col items-center justify-center overflow-hidden px-6 pb-[8svh]">
        <div className="text-center" style={{ opacity: 0.25 + head * 0.75 }}>
          <h2 id="match-title" className="text-[clamp(1.9rem,1.1rem+1.9vw,3.1rem)] font-normal leading-[1.06] tracking-[-0.045em]">
            You learn. We match.
            <Narrator clip="match" size={42} className="ml-2 -translate-y-[0.3em]" />
          </h2>
          <p className="mt-2 text-[17px] leading-[1.3] tracking-[-0.012em] text-[var(--muted)]">We’ll connect you into our talent network.</p>
        </div>

        <div className="relative mt-[4svh] aspect-[1100/520] w-[min(1100px,100%)]">
          <svg viewBox="0 0 1100 520" className="absolute inset-0 h-full w-full" aria-hidden="true">
            {companies.map(([name], i) => {
              const left = i % 2 === 0;
              const y = slots[Math.floor(i / 2)];
              const sx = left ? PF.x - PF.w / 2 : PF.x + PF.w / 2;
              const ex = left ? 170 : 930;
              const on = i < shown;
              return (
                <path
                  key={name}
                  d={`M ${sx} ${PF.y} C ${(sx + ex) / 2} ${PF.y} ${(sx + ex) / 2} ${y} ${ex} ${y}`}
                  fill="none"
                  stroke="#1b1d1c"
                  strokeOpacity="0.28"
                  strokeWidth="1.2"
                  pathLength="1"
                  strokeDasharray="1 1"
                  strokeDashoffset={on ? 0 : 1}
                  style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.22,1,0.36,1)' }}
                />
              );
            })}
          </svg>

          <figure
            className="window absolute overflow-hidden"
            style={{ left: `${((PF.x - PF.w / 2) / 1100) * 100}%`, top: `${((PF.y - PF.h / 2) / 520) * 100}%`, width: `${(PF.w / 1100) * 100}%`, height: `${(PF.h / 520) * 100}%` }}
          >
            <img src="/assets/protos/portfolio-2x.webp" alt="A Flint portfolio" className="w-full" loading="lazy" />
            <p className="absolute right-4 top-3 flex items-center gap-[0.26em] rounded-full bg-white/90 px-3 py-1 text-[clamp(14px,1.4vw,22px)] tracking-[-0.02em] text-[#1b1d1c] shadow-sm backdrop-blur">
              <span className="text-[#8a8b87]">Level</span>
              <Odometer value={level} />
              <span className="sr-only">Level {level}</span>
            </p>
          </figure>

          <ul aria-label="Companies in the talent network">
            {companies.map(([name, ratio], i) => {
              const left = i % 2 === 0;
              const y = slots[Math.floor(i / 2)];
              const on = i < shown;
              return (
                <li
                  key={name}
                  className="absolute flex h-[clamp(34px,4.2vw,48px)] -translate-y-1/2 items-center rounded-full bg-white px-[clamp(12px,1.4vw,18px)] shadow-[0_10px_26px_-14px_rgba(0,0,0,0.35),0_0_0_0.5px_rgba(0,0,0,0.08)] transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
                  style={{
                    top: `${(y / 520) * 100}%`,
                    // Left chips end where their line starts (x 170); right chips begin at x 930.
                    ...(left ? { right: `${((1100 - 170) / 1100) * 100}%` } : { left: `${(930 / 1100) * 100}%` }),
                    opacity: on ? 1 : 0,
                    transform: `translateY(-50%) scale(${on ? 1 : 0.6})`,
                  }}
                >
                  <Logo name={name} className="h-[clamp(13px,1.4vw,19px)] w-auto" style={{ aspectRatio: ratio }} />
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
