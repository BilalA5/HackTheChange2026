import { useMemo, useCallback } from "react";
import type { Training, TrainingProgress } from "@pw/shared";
import { api, invalidate, useApi } from "@/lib/api";

export interface TrainingLibrary {
  trainings: Training[] | undefined;
  library: ReadonlySet<string>;
  progress: Readonly<Record<string, TrainingProgress>>;
  recommended: readonly string[];
  loading: boolean;
  error: Error | null;
  reload: () => void;
  /** Adds or removes a training from the learner's library. Resolves when the server has answered. */
  setInLibrary: (trainingId: string, inLibrary: boolean) => Promise<void>;
  /** Saves a lesson position. Refreshes the progress map afterwards. */
  saveProgress: (trainingId: string, lessonIndex: number, completed: boolean) => Promise<TrainingProgress>;
}

/** Loads the training catalog and the learner's library, progress and recommendations. */
export function useTrainingLibrary(): TrainingLibrary {
  const catalog = useApi("GET /trainings");
  const me = useApi("GET /me/trainings");

  const library = useMemo(() => new Set(me.data?.library ?? []), [me.data]);
  const progress = useMemo(() => me.data?.progress ?? {}, [me.data]);

  const setInLibrary = useCallback(async (trainingId: string, inLibrary: boolean) => {
    if (inLibrary) {
      await api("DELETE /me/trainings/:id", { params: { id: trainingId } });
    } else {
      await api("POST /me/trainings", { body: { trainingId } });
    }
    invalidate("GET /me/trainings");
  }, []);

  const saveProgress = useCallback(async (trainingId: string, lessonIndex: number, completed: boolean) => {
    const saved = await api("POST /me/trainings/:id/progress", { params: { id: trainingId }, body: { lessonIndex, completed } });
    invalidate("GET /me/trainings");
    return saved;
  }, []);

  return {
    trainings: catalog.data,
    library,
    progress,
    recommended: me.data?.recommended ?? [],
    loading: catalog.loading || me.loading,
    error: catalog.error ?? me.error,
    reload: () => {
      catalog.reload();
      me.reload();
    },
    setInLibrary,
    saveProgress,
  };
}
