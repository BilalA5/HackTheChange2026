import { readJSON, removeKey, writeJSON } from './storage.js';

export const XP_PER_LEVEL = 150;
const EMPTY = Object.freeze({ xp: 0, completed: {} });

const cache = new Map();
const listeners = new Set();
const keyFor = (userId) => `progress.${userId}`;

function save(userId, progress) {
  cache.set(userId, progress);
  writeJSON(keyFor(userId), progress);
  listeners.forEach((listener) => listener());
}

export function levelFor(xp) {
  return 1 + Math.floor(xp / XP_PER_LEVEL);
}

export function getProgress(userId) {
  if (!cache.has(userId)) cache.set(userId, readJSON(keyFor(userId), EMPTY));
  return cache.get(userId);
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export async function completeScenario(userId, scenarioId, review) {
  const progress = getProgress(userId);
  const firstTime = !progress.completed[scenarioId];
  save(userId, {
    xp: progress.xp + (firstTime ? review.xp : 0),
    completed: {
      ...progress.completed,
      [scenarioId]: { scores: review.scores, summary: review.summary, completedAt: new Date().toISOString() },
    },
  });
}

export async function resetProgress(userId) {
  removeKey(keyFor(userId));
  cache.delete(userId);
  listeners.forEach((listener) => listener());
}
