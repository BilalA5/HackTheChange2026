import { useCallback, useEffect, useState } from "react";
import { ArrowUpRight, ClipboardCheck, X } from "lucide-react";
import type { StageProgress } from "@pw/shared";
import { NpcAvatar } from "@/components/domain/NpcAvatar";
import { Timer } from "@/components/ui/Timer";
import { toast } from "@/components/ui/Toaster";
import { Button } from "@/components/ui/Button";
import { api, useApi } from "@/lib/api";
import { pw } from "@/lib/bridge";
import { useSession } from "@/stores/session";
import { isRecord, isStageOverlayPayload } from "./overlayMessages";
import { DRAG_REGION, NO_DRAG, NO_DRAG_CLASS, useOverlayBoot, useOverlayMessage, useOverlayPayload } from "./overlayHooks";
import { PipTodos } from "./PipTodos";
import { PipChat } from "./PipChat";

/**
 * Stage companion: a 360x520 glass card that floats over the learner's other tools. Shows the stage
 * timer, the stage to-dos and a co-worker chat. Toggling a to-do saves it and tells the main window.
 */
export default function PipSurface() {
  useOverlayBoot();
  const payload = useOverlayPayload(isStageOverlayPayload);
  const hydrated = useSession((s) => s.hydrated);
  const objectiveId = payload?.objectiveId ?? null;
  const stageId = payload?.stageId ?? null;
  const [busy, setBusy] = useState(false);

  const objective = useApi("GET /objectives/:id", objectiveId !== null && hydrated ? { params: { id: objectiveId } } : null, [objectiveId, hydrated]);
  const { data, mutate, reload } = objective;
  const stage: StageProgress | undefined = stageId !== null ? data?.stages[stageId] : undefined;

  const close = useCallback(() => {
    void pw.overlay.close("pip");
  }, []);

  useEffect(
    () =>
      pw.shortcuts.onShortcut((name, phase) => {
        if (name === "toggle-pip" && phase !== "up") close();
      }),
    [close],
  );

  useOverlayMessage("objective:changed", parseObjectiveId, (changed) => {
    if (changed === objectiveId) reload();
  });

  const toggleTodo = useCallback(
    async (todoId: string, done: boolean) => {
      if (!objectiveId || !stageId || !stage) return;
      const todos = stage.todos.map((t) => (t.id === todoId ? { ...t, done } : t));
      setBusy(true);
      try {
        const next = await api("POST /objectives/:id/stages/:stageId/todos", {
          params: { id: objectiveId, stageId },
          body: { todos },
        });
        mutate(next);
        pw.overlay.broadcast("objective:changed", { objectiveId });
      } catch {
        toast({ title: "Could not save that to-do", tone: "danger" });
      } finally {
        setBusy(false);
      }
    },
    [objectiveId, stageId, stage, mutate],
  );

  if (!payload) {
    return (
      <div className="glass flex h-full w-full items-center justify-center text-[13px] text-fg-muted">Loading your stage…</div>
    );
  }

  const openWorkspace = () => pw.window.focusMain(`/objective/${payload.objectiveId}/stage/${payload.stageId}`);

  return (
    <div className="glass flex h-full w-full flex-col overflow-hidden">
      <header style={DRAG_REGION} className="flex items-center gap-3 border-b border-line px-4 pt-4 pb-3">
        <NpcAvatar name={payload.npcName} seed={payload.npcAvatarSeed} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-[10px] tracking-[0.08em] text-fg-muted uppercase">{payload.scenarioTitle}</p>
          <h1 className="truncate text-[14px] font-semibold text-fg">{payload.stageTitle}</h1>
        </div>
        {data && <Timer key={payload.stageId} initialSeconds={stage?.timeSpentSec ?? 0} className="text-[12px] text-fg" />}
        <button
          type="button"
          aria-label="Close stage companion"
          onClick={close}
          style={NO_DRAG}
          className={`${NO_DRAG_CLASS} flex size-7 shrink-0 items-center justify-center rounded-full text-fg-muted hover:bg-white/10 hover:text-fg`}
        >
          <X size={15} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 p-4">
        <section aria-label="Stage to-dos" className="flex flex-col gap-2">
          <p className="font-mono text-[10px] tracking-[0.08em] text-fg-muted uppercase">To do</p>
          <PipTodos todos={stage?.todos ?? []} busy={busy} onToggle={(id, done) => void toggleTodo(id, done)} />
        </section>
        <PipChat payload={payload} />
      </div>

      <footer className="flex gap-2 border-t border-line px-4 py-3">
        <Button
          variant="glass"
          size="sm"
          className={NO_DRAG_CLASS}
          icon={<ArrowUpRight size={14} strokeWidth={1.75} aria-hidden="true" />}
          onClick={openWorkspace}
        >
          Open workspace
        </Button>
        <Button
          variant="primary"
          size="sm"
          className={`${NO_DRAG_CLASS} flex-1`}
          icon={<ClipboardCheck size={14} strokeWidth={1.75} aria-hidden="true" />}
          onClick={openWorkspace}
        >
          Submit for review
        </Button>
      </footer>
    </div>
  );
}

function parseObjectiveId(v: unknown): string | null {
  return isRecord(v) && typeof v.objectiveId === "string" ? v.objectiveId : null;
}
