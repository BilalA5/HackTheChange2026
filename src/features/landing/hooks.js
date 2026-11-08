import { useEffect, useLayoutEffect, useRef, useState } from 'react';

export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const ease = (t) => 1 - Math.pow(1 - clamp(t), 3);
export const range = (p, a, b) => clamp((p - a) / (b - a));

/** Calls fn on every animation frame where the page scrolled or resized. */
function useFrame(fn) {
  const saved = useRef(fn);
  saved.current = fn;
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = 0;
      saved.current();
    };
    const on = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    on();
    window.addEventListener('scroll', on, { passive: true });
    window.addEventListener('resize', on);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', on);
      window.removeEventListener('resize', on);
    };
  }, []);
}

/**
 * Progress through a tall section whose child is sticky: 0 when its top reaches the top of the
 * screen, 1 when its bottom reaches the bottom.
 */
export function useStickyProgress() {
  const ref = useRef(null);
  const [p, setP] = useState(0);
  useFrame(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const span = r.height - window.innerHeight;
    setP(span > 0 ? clamp(-r.top / span) : r.top < 0 ? 1 : 0);
  });
  return [ref, p];
}

/** Progress of an element crossing the screen: 0 as its top enters at `from`, 1 at `to` (fractions of the height). */
export function useViewProgress(from = 0.9, to = 0.4) {
  const ref = useRef(null);
  const [p, setP] = useState(0);
  useFrame(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const h = window.innerHeight;
    setP(clamp((h * from - r.top) / (h * (from - to))));
  });
  return [ref, p];
}

export function useScrolled(threshold) {
  const [on, setOn] = useState(false);
  useFrame(() => setOn(window.scrollY > threshold));
  return on;
}

export function useSize(ref) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.offsetWidth, h: el.offsetHeight }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return size;
}

export const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
