import { ease, range, useStickyProgress } from './hooks.js';
import { Logo, Mark, Narrator } from './ui.jsx';

const rowA = ['google', 'openai', 'airbnb', 'stripe', 'netflix', 'spotify', 'notion', 'shopify', 'slack', 'figma', 'uber', 'meta'];
const rowB = ['microsoft', 'amazon', 'apple', 'nike', 'adobe', 'anthropic', 'samsung', 'ibm', 'paypal', 'zoom', 'duolingo', 'hubspot'];

function LogoRow({ names, direction }) {
  // Two copies side by side so the drift loops without a seam.
  const items = [...names, ...names];
  return (
    <div className="overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_14%,#000_86%,transparent)]">
      <div className={`flex w-max items-center gap-[clamp(40px,5vw,84px)] ${direction === 'left' ? 'drift-left' : 'drift-right'}`}>
        {items.map((n, i) => (
          <Logo key={i} name={n} dark className="h-[clamp(18px,1.8vw,28px)] w-auto opacity-55" alt={i < names.length ? n : ''} />
        ))}
      </div>
    </div>
  );
}

export default function Hero() {
  const [ref, p] = useStickyProgress();
  const zoom = ease(range(p, 0.06, 0.5));
  const markScale = 1 + Math.pow(range(p, 0.06, 0.5), 2.6) * 46;
  const black = range(p, 0.36, 0.48);
  const copyOut = range(p, 0.02, 0.16);
  const net = ease(range(p, 0.5, 0.64));
  const rows = ease(range(p, 0.6, 0.74));

  return (
    <section id="top" ref={ref} className="relative h-[330vh]" aria-labelledby="hero-title">
      <div className="sticky top-0 h-[100svh] overflow-hidden bg-[var(--page)]">
        <div className="absolute inset-0" aria-hidden="true" style={{ transform: `scale(${1 + zoom * 1.1})`, transformOrigin: '50% 59%' }}>
          <img src="/assets/shots/world-pale.webp" alt="" className="h-full w-full object-cover object-[50%_60%]" draggable="false" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,var(--page)_0%,var(--page)_22%,rgba(248,249,251,0.75)_34%,rgba(248,249,251,0.25)_55%,rgba(248,249,251,0.12)_100%)]" />
        </div>

        <div
          className="absolute inset-x-0 top-[17svh] z-10 px-6 text-center"
          style={{ opacity: 1 - copyOut, transform: `translateY(${-copyOut * 60}px)` }}
        >
          <h1 id="hero-title" className="text-[clamp(2.5rem,1.2rem+3.4vw,4.5rem)] font-normal leading-[0.99] tracking-[-0.052em] text-[var(--ink)]">
            Get hired with{' '}
            <span className="whitespace-nowrap">
              no experience.
              <Narrator clip="hero" size={44} className="ml-3 -translate-y-[0.35em]" />
            </span>
          </h1>
        </div>

        <div className="absolute left-1/2 top-[59%] z-10 h-[clamp(130px,11.5vw,196px)] w-[clamp(130px,11.5vw,196px)] -translate-x-1/2 -translate-y-1/2">
          <Mark className="h-full w-full will-change-transform" style={{ transform: `scale(${markScale})` }} />
        </div>

        <div className="absolute inset-0 z-20 bg-[var(--night)]" style={{ opacity: black, pointerEvents: black > 0.5 ? 'auto' : 'none' }}>
          <div className="flex h-full flex-col items-center justify-center px-6 pb-[18svh] text-center text-white">
            <h2 id="network" className="font-normal" style={{ opacity: net, transform: `translateY(${(1 - net) * 40}px)` }}>
              <span className="block text-[clamp(4.5rem,2rem+9vw,11rem)] leading-[0.9] tracking-[-0.07em]">5,000+</span>
              <span className="mt-[0.34em] block text-[clamp(1.6rem,1rem+1.6vw,2.7rem)] leading-[1.05] tracking-[-0.045em] text-white/70">
                companies hiring in our talent network.
              </span>
            </h2>
          </div>
          <div
            className="absolute inset-x-0 bottom-[16svh] space-y-[clamp(22px,3svh,36px)]"
            style={{ opacity: rows, transform: `translateY(${(1 - rows) * 30}px) perspective(900px) rotateX(18deg)` }}
            role="group"
            aria-label="Companies hiring in our talent network"
          >
            <LogoRow names={rowA} direction="left" />
            <LogoRow names={rowB} direction="right" />
          </div>
        </div>

        <p
          className="absolute bottom-7 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 text-[14px] tracking-[-0.01em] text-[#5f615e] transition-opacity duration-500"
          style={{ opacity: p < 0.01 ? 1 : 0 }}
          aria-hidden="true"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 animate-bounce" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M6 13l6 6 6-6" />
          </svg>
          Scroll down
        </p>
      </div>
    </section>
  );
}
