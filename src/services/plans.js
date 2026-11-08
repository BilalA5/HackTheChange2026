import { api, call, hasBackend } from './backend.js';
import { readJSON, writeJSON } from './storage.js';
import { createUserStore } from './userStore.js';

const keyFor = (userId) => `plan.${userId}`;

export const planStore = createUserStore({
  empty: null,
  load: (userId) => call('query', api.plans.get, { userId }, () => readJSON(keyFor(userId))),
});

export async function savePlan(userId, plan) {
  planStore.set(userId, plan);
  await call('mutation', api.plans.save, { userId, plan }, () => writeJSON(keyFor(userId), plan));
}

/**
 * Asks the model to rewrite each stop's brief for this learner. The plan is usable before this
 * finishes; the tailored version replaces it when it lands. Without a backend nothing changes.
 */
export async function tailorPlan(userId) {
  if (!hasBackend()) return null;
  const current = planStore.peek(userId);
  if (!current) return null;
  planStore.set(userId, { ...current, tailoring: 'pending' });
  try {
    const tailored = await call('action', api.ai.tailorPlan, { userId }, () => null);
    planStore.set(userId, tailored ?? { ...current, tailoring: 'none' });
    return tailored;
  } catch (error) {
    console.error(error);
    planStore.set(userId, { ...current, tailoring: 'failed' });
    return null;
  }
}
