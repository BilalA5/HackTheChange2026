import { useEffect, useMemo, useState } from "react";

export interface PlayedTracker {
  /**
   * True for ids that have not autoplayed yet. Read it while rendering a bubble, so it mounts with
   * autoPlay set exactly once. The bubble's own mount effect does the speaking.
   */
  shouldAutoPlay(id: string): boolean;
}

/**
 * Tracks which spoken turns have already autoplayed. Ids present on mount count as already played,
 * so revisits stay silent. Ids that appear later autoplay once, when their bubble first mounts.
 */
export function usePlayedTracker(ids: readonly string[]): PlayedTracker {
  const [played] = useState(() => new Set(ids));
  const key = ids.join("\u0000");

  useEffect(() => {
    for (const id of ids) played.add(id);
    // ids are captured by `key`, which changes exactly when their content changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [played, key]);

  return useMemo(() => ({ shouldAutoPlay: (id: string) => !played.has(id) }), [played]);
}
