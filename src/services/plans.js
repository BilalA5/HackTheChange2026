import { api, call, hasBackend } from './backend.js';
import { readJSON, writeJSON } from './storage.js';
import { createUserStore } from './userStore.js';

const keyFor = (userId) => `plan.${userId}`;

const retired = { name: 'Rowan', photo: '/assets/onboarding/guide-face.jpg' };
const standIn = { name: 'Jordan', photo: '/assets/onboarding/cast-jordan.jpg' };

/** Plans saved before a cast member left still name them; hand their stops to a current manager. */
function withCurrentCast(plan) {
  if (!plan) return plan;
  const json = JSON.stringify(plan);
  if (!json.includes(retired.photo)) return plan;
  return JSON.parse(json.replaceAll(retired.photo, standIn.photo).replaceAll(retired.name, standIn.name));
}

export const planStore = createUserStore({
  empty: null,
  load: async (userId) =>
    withCurrentCast(await call('query', api.plans.get, { userId }, () => readJSON(keyFor(userId)))),
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
