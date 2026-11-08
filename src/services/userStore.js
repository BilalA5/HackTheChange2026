/**
 * A per-user cache that React can read with useSyncExternalStore. `read` returns undefined until the
 * first load finishes, then whatever was loaded (or `empty`).
 */
export function createUserStore({ load, empty }) {
  const cache = new Map();
  const loading = new Set();
  const listeners = new Set();
  const emit = () => listeners.forEach((listener) => listener());

  const fetch = (userId) => {
    loading.add(userId);
    load(userId)
      .then(
        (value) => cache.set(userId, value ?? empty),
        (error) => {
          console.error(error);
          cache.set(userId, empty);
        },
      )
      .finally(() => {
        loading.delete(userId);
        emit();
      });
  };

  return {
    read(userId) {
      if (!cache.has(userId) && !loading.has(userId)) fetch(userId);
      return cache.get(userId);
    },
    peek: (userId) => cache.get(userId),
    set(userId, value) {
      cache.set(userId, value);
      emit();
    },
    refresh: fetch,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
