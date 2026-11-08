import { useCallback, useSyncExternalStore } from 'react';
import { useAuth } from '@/features/auth/auth-context.js';
import { planStore } from '@/services/plans.js';

export function usePlan() {
  const { user } = useAuth();
  const read = useCallback(() => planStore.read(user.id), [user.id]);
  const plan = useSyncExternalStore(planStore.subscribe, read);
  return { plan: plan ?? null, ready: plan !== undefined };
}
