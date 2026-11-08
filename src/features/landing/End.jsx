import { Link } from 'react-router';
import { ease, range, useViewProgress } from './hooks.js';
import { WaveLine } from './Learn.jsx';
import { Mark, Narrator } from './ui.jsx';

function OfferLetter({ open, signed }) {
  return (
    <span
      className="relative inline-block align-[-0.08em] transition-[width] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
      style={{ width: open ? '1.55em' : '0.25em', height: '0.9em' }}
      aria-hidden="true"
    >
      <span
        className="absolute left-1/2 top-1/2 h-[1.05em] w-[0.82em] rounded-[0.06em] bg-white shadow-[0_0.08em_0.25em_rgba(0,0,0,0.18),0_0_0_0.01em_rgba(0,0,0,0.08)] transition-all duration-700"
        style={{
          transform: `translate(-50%,-50%) rotate(${open ? -6 : 0}deg) scale(${open ? 1 : 0.2})`,
          opacity: open ? 1 : 0,
        }}
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
    <section
      ref={ref}
      aria-labelledby="hired-title"
      className="flex min-h-[72svh] flex-col items-center justify-center px-6 py-[18svh] text-center"
    >
      <h2
        id="hired-title"
        className="text-[length:var(--h2)] font-normal leading-[1.08] tracking-[-0.045em]"
        aria-label="Built to get you hired."
      >
        <span aria-hidden="true">
          <WaveLine progress={p * 0.62}>Built to get you</WaveLine>
          <OfferLetter open={p > 0.45} signed={p > 0.95} />
          <WaveLine progress={range(p, 0.55, 1)}>hired.</WaveLine>
        </span>
        <Narrator clip="hired" size={46} className="ml-2 -translate-y-[0.35em]" />
      </h2>
    </section>
  );
}

export function Footer() {
  const [ref, p] = useViewProgress(1, 0.05);
  const spread = ease(range(p, 0.25, 1));
  const tilt = 16 * (1 - ease(range(p, 0, 0.8)));
  const r = spread * 95; // % of the larger side

  return (
    <footer ref={ref} id="gate" aria-label="Flint World" className="relative h-[max(100svh,620px)] overflow-hidden">
      <div className="absolute inset-0 [perspective:1400px]">
        <div className="absolute inset-[-6%] origin-bottom" style={{ transform: `rotateX(${tilt}deg)` }}>
          <img
            src="/assets/shots/world-pale.webp"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <img
            src="/assets/shots/city@2x.webp"
            alt="Flint World, the city of companies where you work"
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
        <span
          className="dome-ripple absolute left-1/2 top-1/2 h-[180px] w-[180px] rounded-full border border-white/80"
          aria-hidden="true"
        />
        <span
          className="dome-ripple absolute left-1/2 top-1/2 h-[180px] w-[180px] rounded-full border border-white/60 [animation-delay:1.4s]"
          aria-hidden="true"
        />
        <Link
          to="/onboarding"
          className="relative flex items-center gap-2.5 rounded-full bg-white/85 py-2.5 pl-3 pr-5 text-[16px] tracking-[-0.01em] text-[#111] shadow-[0_14px_34px_-14px_rgba(0,0,0,0.5)] backdrop-blur transition-transform hover:scale-[1.03]"
        >
          <Mark className="h-7 w-7" />
          Enter Flint
        </Link>
      </div>
    </footer>
  );
}
