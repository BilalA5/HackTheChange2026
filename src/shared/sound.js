import { useSyncExternalStore } from 'react';

const sounds = {
  tick: 0.35,
  hop: 0.45,
  land: 0.8,
  slide: 0.5,
  whoosh: 0.45,
  send: 0.35,
  receive: 0.4,
  submit: 0.55,
  complete: 0.7,
  sparkle: 0.45,
  reveal: 0.75,
};

const MUTED_KEY = 'flint.muted';
const listeners = new Set();
const buffers = new Map();
let context = null;
let muted = readMuted();

function readMuted() {
  try {
    return localStorage.getItem(MUTED_KEY) === '1';
  } catch {
    return false;
  }
}

async function load(name) {
  const response = await fetch(`/assets/sfx/${name}.mp3`);
  buffers.set(name, await context.decodeAudioData(await response.arrayBuffer()));
}

function unlock() {
  if (context) return context.resume();
  const AudioContext = window.AudioContext ?? window.webkitAudioContext;
  if (!AudioContext) return;
  context = new AudioContext();
  Object.keys(sounds).forEach((name) => load(name).catch(() => {}));
}

if (typeof window !== 'undefined') {
  for (const type of ['pointerdown', 'keydown']) window.addEventListener(type, unlock, { capture: true });
}

/** Plays a sound from the kit. Before the first click or key press browsers block audio, so it stays silent. */
export function play(name, { delay = 0, volume = 1, rate = 1 } = {}) {
  const buffer = buffers.get(name);
  if (muted || !buffer || context?.state !== 'running') return;
  const source = context.createBufferSource();
  const gain = context.createGain();
  source.buffer = buffer;
  source.playbackRate.value = rate;
  gain.gain.value = sounds[name] * volume;
  source.connect(gain).connect(context.destination);
  source.start(context.currentTime + delay);
}

export function setMuted(value) {
  muted = value;
  try {
    localStorage.setItem(MUTED_KEY, value ? '1' : '0');
  } catch {
    // Storage can be blocked; the choice still holds for this visit.
  }
  listeners.forEach((listener) => listener());
}

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const useMuted = () => useSyncExternalStore(subscribe, () => muted);
