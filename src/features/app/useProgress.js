import { useCallback, useSyncExternalStore } from 'react';
import { useAuth } from '@/features/auth/auth-context.js';
import { EMPTY_PROGRESS, levelFor, progressStore } from '@/services/progress.js';

export function useProgress() {
  const { user } = useAuth();
  const read = useCallback(() => progressStore.read(user.id), [user.id]);
  const progress = useSyncExternalStore(progressStore.subscribe, read);
  const current = progress ?? EMPTY_PROGRESS;
  return { ...current, level: levelFor(current.xp), ready: progress !== undefined };
}
