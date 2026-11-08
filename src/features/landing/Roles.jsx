import { useLayoutEffect, useRef, useState } from 'react';
import { roles, sections } from '@/data/roles.js';
import { useStickyProgress } from './hooks.js';
import { Flame, TrendUp } from './ui.jsx';

function Tag({ tag }) {
  if (!tag) return null;
  return (
    <span className="absolute left-5 top-5 z-10 inline-flex h-[26px] items-center gap-[5px] rounded-full bg-white/90 pl-[7px] pr-[10px] text-[14px] leading-none tracking-[-0.012em] text-[var(--ink)] backdrop-blur">
      {tag === 'Hot' ? <Flame /> : <TrendUp />}
      {tag}
    </span>
  );
}

function ToolIcon({ tool }) {
  return (
    <span className="grid h-[26px] w-[26px] place-items-center rounded-full bg-white" title={tool.name}>
      {tool.tint ? (
        <i
          className="block h-[15px] w-[15px]"
          style={{
            background: tool.tint,
            WebkitMask: `url(${tool.src}) center/contain no-repeat`,
            mask: `url(${tool.src}) center/contain no-repeat`,
          }}
        />
      ) : (
        <img src={tool.src} alt="" className="h-[15px] w-[15px] object-contain" />
      )}
      <span className="sr-only">{tool.name}</span>
    </span>
  );
}

function ChartPoster({ chart }) {
  const max = Math.max(...chart.points.map(([, value]) => value));
  return (
    <figure className="h-full w-full bg-[radial-gradient(120%_90%_at_80%_0%,#3a2410_0%,#151413_55%,#0d0d0d_100%)]">
      <figcaption className="absolute inset-x-5 top-[62px] text-[11px] font-medium uppercase tracking-[0.14em] text-white/55">
        {chart.label}
      </figcaption>
      <div className="absolute inset-x-5 bottom-[36%] top-[92px] flex items-end gap-3">
        {chart.points.map(([year, value]) => (
          <div key={year} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5">
            <span className="text-[13px] tabular-nums tracking-[-0.01em] text-white">${value.toFixed(2)}</span>
            <span
              className="w-full rounded-t-[8px] bg-gradient-to-b from-[#ffb03a] to-[#ff6a1a]"
              style={{ height: `${(value / max) * 78}%` }}
            />
            <span className="text-[12px] tabular-nums text-white/55">{year}</span>
          </div>
        ))}
      </div>
      <p className="absolute right-5 top-5 text-[10.5px] text-white/40">Source: {chart.source}</p>
    </figure>
  );
}

function RoleCard({ role }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <li className="w-[clamp(250px,21.2vw,360px)] shrink-0 [perspective:1400px]">
      <div className={`card-flip relative aspect-[360/427] ${flipped ? '[transform:rotateY(180deg)]' : ''}`}>
        <div className="card-face absolute inset-0 overflow-hidden rounded-[18px] bg-[#1a1a1a]">
          {role.chart ? (
            <ChartPoster chart={role.chart} />
          ) : (
            <img src={role.poster} alt="" className="h-full w-full object-cover" loading="lazy" />
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
          <Tag tag={role.tag} />
          <button
            type="button"
            onClick={() => setFlipped(true)}
            className="absolute inset-x-0 bottom-0 z-[5] px-5 pb-5 pt-16 text-left"
            aria-label={`${role.title}: see what you ship`}
          >
            <span className="block text-[clamp(20px,1.55vw,26px)] leading-[1.05] tracking-[-0.045em] text-white">
              {role.title}
            </span>
            <span className="mt-3 flex gap-[6px]">
              {role.tools.map((t) => (
                <ToolIcon key={t.src} tool={t} />
              ))}
            </span>
          </button>
        </div>

        <div className="card-face absolute inset-0 flex flex-col overflow-hidden rounded-[18px] bg-[#f4f3ee] p-6 text-[var(--ink)] [transform:rotateY(180deg)]">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-[clamp(22px,1.7vw,28px)] leading-[1.02] tracking-[-0.045em]">{role.title}</h3>
            <button
              type="button"
              onClick={() => setFlipped(false)}
              aria-label="Turn the card back"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-black/[0.06] hover:bg-black/10"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>
          <p className="mt-5 text-[11px] font-medium uppercase tracking-[0.16em] text-[#8a8b87]">What you ship</p>
          <ul className="mt-2 space-y-1.5 text-[14.5px] leading-[1.3] tracking-[-0.01em]">
            {role.projects.map((p) => (
              <li key={p} className="flex gap-2">
                <span className="mt-[0.5em] h-1 w-1 shrink-0 rounded-full bg-[#1d9e4b]" />
                {p}
              </li>
            ))}
          </ul>
          <div className="mt-auto flex flex-wrap gap-[6px] pt-4">
            {role.tools.map((t) => (
              <span key={t.src} className="rounded-full bg-white px-2.5 py-1 text-[12px] text-[#3a3b39]">
                {t.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </li>
  );
}

export default function Roles() {
  const [field, setField] = useState('popular');
  const shown = roles.filter((r) => (field === 'popular' ? r.popular : r.section === field));
  const track = useRef(null);
  const [run, setRun] = useState(0);
  const [ref, p] = useStickyProgress();

  useLayoutEffect(() => {
    const el = track.current;
    if (!el) return;
    const measure = () => setRun(Math.max(0, el.scrollWidth - window.innerWidth));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [shown.length]);

  return (
    <section id="roles" aria-labelledby="roles-title" className="relative text-white">
      <svg
        viewBox="0 0 1700 90"
        preserveAspectRatio="none"
        className="-mb-px block h-[clamp(40px,5.3vw,90px)] w-full"
        aria-hidden="true"
      >
        <path d="M0 90H1700V42Q850 -38 0 42Z" fill="var(--night)" />
      </svg>
      <div ref={ref} className="bg-[var(--night)]" style={{ height: `calc(100svh + ${run}px)` }}>
        <div className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden pb-[9svh]">
          <h2
            id="roles-title"
            className="mx-auto max-w-[16em] px-6 text-center text-[length:var(--h2)] font-normal leading-[1.05] tracking-[-0.045em]"
          >
            Train for <span className="whitespace-nowrap">Alberta’s hottest roles.</span>
          </h2>
          <p className="mx-auto mt-3 max-w-[34em] px-6 text-center text-[16px] leading-[1.4] tracking-[-0.01em] text-white/60">
            Energy, AI and data drive Alberta’s economy. Start where the work is.
          </p>
          <div
            className="no-scrollbar mx-auto mt-[clamp(20px,3svh,34px)] flex max-w-full gap-[clamp(14px,1.6vw,27px)] overflow-x-auto px-6"
            role="group"
            aria-label="Fields"
          >
            {sections.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setField(s.id)}
                aria-pressed={field === s.id}
                className={`shrink-0 border-b-2 pb-1.5 text-[14px] tracking-[-0.005em] transition-colors ${
                  field === s.id
                    ? 'border-white font-semibold text-white'
                    : 'border-transparent text-white/65 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          <ul
            ref={track}
            className="mt-[clamp(36px,6svh,62px)] flex w-max gap-4 pl-[8vw] pr-[8vw] will-change-transform"
            style={{ transform: `translateX(${-p * run}px)` }}
          >
            {shown.map((r) => (
              <RoleCard key={r.id} role={r} />
            ))}
          </ul>
        </div>
      </div>
      <svg
        viewBox="0 0 1700 90"
        preserveAspectRatio="none"
        className="block h-[clamp(40px,5.3vw,90px)] w-full"
        aria-hidden="true"
      >
        <path d="M0 0H1700V48Q850 128 0 48Z" fill="var(--night)" />
      </svg>
    </section>
  );
}
