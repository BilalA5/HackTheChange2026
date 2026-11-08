import { Link } from 'react-router';
import { roles } from '@/data/roles.js';
import Wordmark from '@/shared/Wordmark.jsx';
import { Play } from './ui.jsx';

const industries = ['Energy', 'Clean tech', 'AI & data', 'Agriculture', 'Finance', 'Health'];

const poolPrice = roles.find((role) => role.id === 'energy-analyst').chart;

function PriceDrop() {
  const max = Math.max(...poolPrice.points.map(([, value]) => value));
  return (
    <div className="mt-6 flex h-[180px] items-end gap-4" role="img" aria-label={`${poolPrice.label}: 2023 to 2025`}>
      {poolPrice.points.map(([year, value], i) => (
        <div key={year} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
          <span className="text-[14px] tabular-nums tracking-[-0.01em] text-[var(--ink)]">${value.toFixed(2)}</span>
          <span
            className="hero-bar w-full rounded-t-[10px] bg-gradient-to-b from-[#ffb03a] to-[#ff6a1a]"
            style={{ height: `${(value / max) * 72}%`, animationDelay: `${i * 120}ms` }}
          />
          <span className="text-[13px] tabular-nums text-[var(--muted)]">{year}</span>
        </div>
      ))}
    </div>
  );
}

function BriefCard() {
  return (
    <article className="window relative p-6 sm:p-8" aria-labelledby="brief-title">
      <p className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#ff6a1a]" />
        Your first brief · Energy Analyst
      </p>
      <h2 id="brief-title" className="mt-4 text-[clamp(22px,1.2rem+0.7vw,30px)] leading-[1.12] tracking-[-0.035em]">
        Alberta’s power price fell 53% in a year. Find out why.
      </h2>
      <PriceDrop />
      <p className="mt-3 text-[12.5px] text-[var(--muted)]">
        {poolPrice.label}. Source: {poolPrice.source}.
      </p>
      <ul className="mt-6 flex flex-wrap gap-2 border-t border-black/[0.06] pt-5 text-[13px] text-[#3a3b39]">
        {['Real AESO data', 'A manager and a coach', 'AI review of your work'].map((item) => (
          <li key={item} className="rounded-full bg-black/[0.04] px-3 py-1.5">
            {item}
          </li>
        ))}
      </ul>
    </article>
  );
}

export default function Hero() {
  return (
    <section id="top" aria-labelledby="hero-title" className="relative overflow-hidden">
      <div className="absolute inset-0" aria-hidden="true">
        <img
          src="/assets/shots/world-pale.webp"
          alt=""
          className="h-full w-full object-cover object-[50%_70%] opacity-60"
          draggable="false"
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,var(--page)_0%,rgba(248,249,251,0.82)_45%,var(--page)_100%)]" />
      </div>

      <header className="relative z-10 mx-auto flex max-w-[1280px] items-center justify-between px-6 pt-6">
        <Link to="/" aria-label="Flint home">
          <Wordmark size={26} tone="dark" />
        </Link>
        <Link
          to="/login"
          className="rounded-full px-4 py-2 text-[15px] tracking-[-0.01em] text-[var(--ink)] hover:bg-black/[0.05]"
        >
          Log in
        </Link>
      </header>

      <div className="relative z-10 mx-auto grid max-w-[1280px] items-center gap-12 px-6 pb-[clamp(48px,8svh,96px)] pt-[clamp(48px,10svh,120px)] lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-[13px] tracking-[-0.005em] text-[#3a3b39] shadow-[0_0_0_0.5px_rgba(0,0,0,0.08)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1d9e4b]" />
            Made for Alberta
          </p>
          <h1
            id="hero-title"
            className="mt-6 max-w-[12em] text-[clamp(2.6rem,1.4rem+3.6vw,5rem)] font-normal leading-[0.98] tracking-[-0.055em] text-[var(--ink)]"
          >
            Real work experience for Alberta’s next jobs.
          </h1>
          <p className="mt-6 max-w-[30em] text-[clamp(17px,1rem+0.25vw,19px)] leading-[1.45] tracking-[-0.012em] text-[var(--muted)]">
            Take on projects built from public Alberta data. Work them through with a manager and a coach, get your work
            reviewed, and leave with a portfolio you can show.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link
              to="/login"
              className="start-key flex h-[54px] items-center gap-2.5 rounded-[15px] px-7 text-[16px] font-medium text-white transition-transform hover:scale-[1.015] active:scale-[0.985]"
            >
              <Play className="h-3 w-3" />
              Start a project
            </Link>
            <a
              href="#roles"
              className="soft-key flex h-[52px] items-center rounded-[15px] px-6 text-[16px] text-[var(--ink)]"
            >
              See the roles
            </a>
          </div>
        </div>
        <BriefCard />
      </div>

      <div className="relative z-10 mx-auto max-w-[1280px] px-6 pb-[10svh]">
        <p className="text-[13px] uppercase tracking-[0.14em] text-[var(--muted)]">
          Projects across the province’s industries
        </p>
        <ul className="mt-4 flex flex-wrap gap-2.5">
          {industries.map((industry) => (
            <li
              key={industry}
              className="rounded-full bg-white px-4 py-2 text-[15px] tracking-[-0.01em] text-[var(--ink)] shadow-[0_0_0_0.5px_rgba(0,0,0,0.08)]"
            >
              {industry}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
