import { useCallback, useSyncExternalStore } from 'react';
import { useAuth } from '@/features/auth/auth-context.js';
import { getProgress, levelFor, subscribe } from '@/services/progress.js';

export function useProgress() {
  const { user } = useAuth();
  const read = useCallback(() => getProgress(user.id), [user.id]);
  const progress = useSyncExternalStore(subscribe, read);
  return { ...progress, level: levelFor(progress.xp) };
}
