import { api, call } from './backend.js';
import { readJSON, removeKey, writeJSON } from './storage.js';
import { createUserStore } from './userStore.js';

export const XP_PER_LEVEL = 150;
export const EMPTY_PROGRESS = Object.freeze({ xp: 0, completed: {} });

const keyFor = (userId) => `progress.${userId}`;

export const progressStore = createUserStore({
  empty: EMPTY_PROGRESS,
  load: (userId) => call('query', api.progress.get, { userId }, () => readJSON(keyFor(userId))),
});

export function levelFor(xp) {
  return 1 + Math.floor(xp / XP_PER_LEVEL);
}

/** Records a reviewed stop. XP is only earned the first time; a resubmission updates the review. */
export async function completeStop(userId, stop, review) {
  const progress = progressStore.peek(userId) ?? EMPTY_PROGRESS;
  const firstTime = !progress.completed[stop.id];
  const entry = {
    title: stop.title,
    company: stop.company,
    logo: stop.logo,
    tools: stop.tools,
    color: stop.color ?? null,
    summary: review.summary,
    scores: review.scores,
    xp: review.xp,
    completedAt: new Date().toISOString(),
  };
  const next = {
    xp: progress.xp + (firstTime ? review.xp : 0),
    completed: { ...progress.completed, [stop.id]: entry },
  };
  progressStore.set(userId, next);
  await call('mutation', api.progress.complete, { userId, stopId: stop.id, entry }, () =>
    writeJSON(keyFor(userId), next),
  );
}

export async function resetProgress(userId) {
  progressStore.set(userId, EMPTY_PROGRESS);
  await call('mutation', api.progress.reset, { userId }, () => removeKey(keyFor(userId)));
}
