import { useEffect, useState } from 'react';
import { play } from '@/shared/sound.js';

const STEP_MS = 340;
const START = -1;

const keyFor = (planId) => `flint.pawn.${planId}`;

function readSeen(planId) {
  try {
    const saved = localStorage.getItem(keyFor(planId));
    return saved === null ? START : Number(saved);
  } catch {
    return START;
  }
}

function writeSeen(planId, index) {
  try {
    localStorage.setItem(keyFor(planId), String(index));
  } catch {
    // Without storage the pawn walks from the start each visit, which is fine.
  }
}

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Where the pawn stands. It remembers the last stop the learner saw it on, and when they've moved on
 * since, it hops there one tile at a time. Index -1 is the Start corner.
 */
export function usePawnWalk(planId, target) {
  const [at, setAt] = useState(() => (reducedMotion() ? target : Math.min(readSeen(planId), target)));
  const [hop, setHop] = useState(0);

  useEffect(() => {
    if (at === target) {
      writeSeen(planId, target);
      return;
    }
    const timer = setTimeout(
      () => {
        const next = at + Math.sign(target - at);
        setAt(next);
        setHop((count) => count + 1);
        play(next === target ? 'land' : 'hop', { rate: 0.95 + Math.random() * 0.1 });
      },
      at === readSeen(planId) ? 700 : STEP_MS,
    );
    return () => clearTimeout(timer);
  }, [at, target, planId]);

  return { at, hop };
}
