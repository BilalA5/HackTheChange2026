import React, { useLayoutEffect, useRef, useState } from 'react';
import { clamp, useViewProgress } from './hooks.js';
import { Logo, Narrator } from './ui.jsx';

/**
 * A line whose colour is a wave run by the scroll: words start pale grey, turn green as the wave
 * passes and settle in ink behind it.
 */
export function WaveLine({ progress, children, className = '' }) {
  const x = -12 + progress * 136; // wave front, in % of the line's width
  return (
    <span
      className={`bg-clip-text text-transparent [-webkit-background-clip:text] ${className}`}
      style={{
        backgroundImage: `linear-gradient(90deg, var(--ink-soft) ${x - 26}%, var(--wave) ${x - 12}%, var(--wave) ${x - 4}%, var(--grey-word) ${x + 4}%)`,
      }}
    >
      {children}
    </span>
  );
}

function WorldWindow() {
  return (
    <div className="relative h-full overflow-hidden rounded-[16px] bg-[#c9d2cd]">
      <div className="h-full w-full origin-[66%_46%] scale-[1.9]">
        <img
          src="/assets/shots/city@2x.webp"
          alt="Zero World: a city of company buildings"
          className="slow-pan h-full w-full object-cover object-[64%_38%]"
          loading="lazy"
        />
      </div>
      <div className="absolute left-[82%] top-[38%]" aria-hidden="true">
        <span className="pin-ping absolute left-1/2 top-[86px] h-6 w-6 rounded-full bg-white/70" />
        <span className="absolute left-1/2 top-[78px] h-[14px] w-[14px] -translate-x-1/2 rounded-full border-[3px] border-white bg-white/50 shadow" />
        <span className="grid h-[56px] w-[56px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-[14px] bg-white shadow-[0_10px_24px_-8px_rgba(0,0,0,0.45)]">
          <Logo name="nike" className="h-auto w-[34px]" alt="" />
        </span>
      </div>
    </div>
  );
}

function ShotWindow({ src, alt }) {
  return <img src={src} alt={alt} className="h-full w-full rounded-[16px] object-cover object-top" loading="lazy" />;
}

function PortfolioWindow() {
  return (
    <div className="h-full overflow-hidden rounded-[16px] bg-white">
      <img
        src="/assets/protos/portfolio-2x.webp"
        alt="A Zero portfolio: Maya Reyes, GTM AI Engineer, with her projects"
        className="portfolio-tour w-full"
        style={{ '--tour': '-42%' }}
        loading="lazy"
      />
    </div>
  );
}

const steps = [
  { lead: 'Build projects in our simulated', last: 'world.', clip: 'world', body: <WorldWindow /> },
  { lead: 'Work with your', last: 'team.', clip: 'team', body: <ShotWindow src="/assets/protos/team.webp" alt="The team workspace: a manager's brief, the team and the ask" /> },
  { lead: 'Get coached along the', last: 'way.', clip: 'coach', body: <ShotWindow src="/assets/protos/coach.webp" alt="Choosing a coach: Jessica, finds the pattern behind the problem" /> },
  { lead: 'Build your', last: 'portfolio.', clip: 'portfolio', body: <PortfolioWindow />, wave: true },
];

/** The path: one line drawn by the scroll, from under the title to a rail beside each step's title. */
function Thread({ box, nodes, progress }) {
  const path = useRef(null);
  const [len, setLen] = useState(0);
  const rail = 6;
  const cx = box.w / 2;
  const last = nodes[nodes.length - 1] ?? 0;
  const d = box.w ? `M ${cx} 0 C ${cx} 150 ${rail} 120 ${rail} 400 L ${rail} ${last}` : '';
  useLayoutEffect(() => {
    if (path.current) setLen(path.current.getTotalLength());
  }, [d]);
  const drawn = len * progress;
  return (
    <svg className="pointer-events-none absolute left-0 top-0 hidden overflow-visible lg:block" width={box.w} height={box.h} aria-hidden="true">
      <path d={d} fill="none" stroke="#d9dad6" strokeWidth="1.2" />
      <path ref={path} d={d} fill="none" stroke="#1b1d1c" strokeWidth="1.4" strokeDasharray={`${len} ${len}`} strokeDashoffset={len - drawn} />
      {nodes.map((y, i) => {
        const reached = drawn >= len - (last - y) - 1;
        return <circle key={i} cx={rail} cy={y} r="5.5" fill="var(--page)" stroke={reached ? '#1b1d1c' : '#c9cbc7'} strokeWidth="1.4" />;
      })}
    </svg>
  );
}

/** "Learn the job by doing it." then four steps, each a title on the left and its window on the right. */
export default function Learn() {
  const [headRef, headP] = useViewProgress(0.95, 0.3);
  const wrap = useRef(null);
  const titles = useRef([]);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [nodes, setNodes] = useState([]);
  const [through, setThrough] = useState(0);
  const [lastP, lastRef] = useLastStepProgress();

  useLayoutEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const measure = () => {
      setBox({ w: el.offsetWidth, h: el.offsetHeight });
      const top = el.getBoundingClientRect().top;
      setNodes(titles.current.map((t) => (t ? t.getBoundingClientRect().top - top + t.offsetHeight / 2 : 0)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    let raf = 0;
    const on = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = wrap.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        setThrough(clamp((window.innerHeight * 0.55 - r.top) / r.height));
      });
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
    };
  }, []);

  return (
    <section id="work" aria-labelledby="learn-title" className="relative pb-[12svh] pt-[22svh]">
      <div ref={headRef} className="sticky top-0 z-20 bg-[linear-gradient(180deg,var(--page)_72%,rgba(248,249,251,0))] pb-[64px] pt-[44px] text-center">
        <h2 id="learn-title" className="px-6 text-[length:var(--h2)] font-normal leading-[1.08] tracking-[-0.045em]">
          <WaveLine progress={headP}>Learn the job by doing it.</WaveLine>
          <Narrator clip="learn" size={46} className="ml-2 -translate-y-[0.35em]" />
        </h2>
      </div>

      <div ref={wrap} className="relative mx-auto mt-[6svh] max-w-[1428px] px-6 lg:px-0 lg:[width:calc(100%-16vw)]">
        <Thread box={box} nodes={nodes} progress={through} />
        <ol className="space-y-[clamp(80px,12svh,208px)] pt-[clamp(80px,14svh,180px)]">
          {steps.map((s, i) => (
            <li key={s.clip} className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,831px)] lg:gap-[clamp(36px,5vw,100px)]">
              <h3
                ref={(el) => {
                  titles.current[i] = el;
                  if (s.wave) lastRef.current = el;
                }}
                className="max-w-[13em] text-[clamp(26px,1.6rem+0.6vw,34px)] font-normal leading-[1.16] tracking-[-0.03em] lg:pl-[34px]"
              >
                {s.wave ? <WaveLine progress={lastP}>{s.lead}</WaveLine> : s.lead}{' '}
                <span className="whitespace-nowrap">
                  {s.wave ? <WaveLine progress={lastP}>{s.last}</WaveLine> : s.last}
                  <Narrator clip={s.clip} size={46} className="ml-2.5 -translate-y-[0.2em]" />
                </span>
              </h3>
              <div className="window aspect-[831/520] w-full">{s.body}</div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function useLastStepProgress() {
  const [ref, p] = useViewProgress(0.75, 0.45);
  return [p, ref];
}
