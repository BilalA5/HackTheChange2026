import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Mic, Square } from "lucide-react";
import { NpcAvatar } from "@/components/domain/NpcAvatar";
import { usePushToTalk } from "@/hooks/usePushToTalk";
import { pw } from "@/lib/bridge";
import { cn } from "@/lib/cn";
import { captureContext, type CoworkMessage } from "@/lib/realtime/cowork";
import { cancel as cancelSpeech, speak } from "@/lib/voice/tts";
import { IslandExpanded } from "./IslandExpanded";
import { useIslandSession, useOptionalCowork } from "./useIslandSession";
import { deriveIslandStatus, ISLAND_COLLAPSED, ISLAND_EXPANDED, shouldExpand, STATUS_DOT, STATUS_LABEL } from "./islandStatus";
import { isStageOverlayPayload, parseCoworkCommand, parseRegionSubmit } from "./overlayMessages";
import { NO_DRAG_CLASS, useOverlayBoot, useOverlayMessage, useOverlayPayload, usePrefersReducedMotion } from "./overlayHooks";

const CLOSE_AFTER_ENDED_MS = 4000;
const FALLBACK_NAME = "Co-worker";

/** Closes the island and the highlight canvas: the end of a co-worker session. */
function closeOverlayWindows(): void {
  void pw.overlay.close("island");
  void pw.overlay.close("cowork");
}

/** The latest co-worker line that has finished streaming. This is what the pip and the stage page show. */
function latestFinalNpc(messages: CoworkMessage[]): string | undefined {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const m = messages[i];
    if (m.role === "npc" && !m.streaming) return m.text;
  }
  return undefined;
}

function latestNpc(messages: CoworkMessage[]): CoworkMessage | undefined {
  return messages.filter((m) => m.role === "npc").at(-1);
}

/**
 * Dynamic island: the co-worker's status pill at top centre. Click-through until the pointer reaches the
 * pill. It grows on hover, or while the co-worker speaks, to show the last line, to-dos and actions.
 */
export default function IslandSurface() {
  useOverlayBoot();
  const payload = useOverlayPayload(isStageOverlayPayload);
  const session = useIslandSession(payload);
  const { client, ensure } = session;
  const cw = useOptionalCowork(client);
  const reduced = usePrefersReducedMotion();

  const [hovered, setHovered] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const expanded = shouldExpand(hovered, speaking);

  const ptt = usePushToTalk({
    onFinal: (text) => {
      const c = ensure();
      if (c) void captureContext().then((ctx) => c.sendText(text, ctx));
    },
  });
  const pttToggleRef = useRef(ptt.toggle);
  pttToggleRef.current = ptt.toggle;

  // Start click-through. The pill's pointer handlers switch the mouse back on.
  useEffect(() => {
    pw.overlay.setIgnoreMouse(true);
  }, []);

  useEffect(() => {
    const size = expanded ? ISLAND_EXPANDED : ISLAND_COLLAPSED;
    pw.overlay.resizeSelf(size.width, size.height);
  }, [expanded]);

  useEffect(
    () =>
      pw.shortcuts.onShortcut((name, phase) => {
        if (name === "push-to-talk" && phase !== "up") pttToggleRef.current();
      }),
    [],
  );

  // Speak every final co-worker line. The server waits for the playback acknowledgement.
  useEffect(() => {
    if (!client) return;
    const offText = client.on("text_response", (m) => {
      speak(m.text, {
        onStart: () => setSpeaking(true),
        onEnd: () => {
          setSpeaking(false);
          client.audioPlaybackDone();
        },
      });
    });
    const offHighlight = client.on("highlight", (m) => {
      pw.overlay.broadcast("cowork:highlight", { rect: m.rect, label: m.label });
    });
    return () => {
      offText();
      offHighlight();
    };
  }, [client]);

  // The learner starting to talk quiets the co-worker.
  useEffect(() => {
    if (ptt.state === "listening") cancelSpeech();
  }, [ptt.state]);

  const status = deriveIslandStatus({
    started: client !== null,
    connected: cw.connection === "open",
    listening: ptt.state === "listening",
    thinking: cw.thinking || ptt.state === "processing",
    speaking,
    ended: cw.ended !== null,
  });
  const lastFinal = latestFinalNpc(cw.messages);
  const last = latestNpc(cw.messages);

  // The pip and the stage page mirror this status, so it goes out on every change.
  useEffect(() => {
    pw.overlay.broadcast("cowork:state", { status, lastText: lastFinal, todos: cw.todos });
  }, [status, lastFinal, cw.todos]);

  // A session the server ended (budget spent, credits out) closes the overlays after a short "Ended" flash.
  const ended = cw.ended !== null;
  useEffect(() => {
    if (!ended) return;
    const t = setTimeout(closeOverlayWindows, CLOSE_AFTER_ENDED_MS);
    return () => clearTimeout(t);
  }, [ended]);

  useOverlayMessage("cowork:command", parseCoworkCommand, (cmd) => {
    if (cmd.cmd === "start") {
      ensure();
      return;
    }
    if (cmd.cmd === "stop") {
      client?.end();
      closeOverlayWindows();
      return;
    }
    const c = ensure();
    if (!c) return;
    const regions = cmd.regions;
    void captureContext().then((ctx) => c.imLost(cmd.question ?? "I'm stuck here.", regions ? { ...ctx, regions } : ctx));
  });

  useOverlayMessage("region:submit", parseRegionSubmit, (sub) => {
    const c = ensure();
    if (!c) return;
    const question = sub.question.trim() || "I'm stuck on the highlighted areas.";
    void captureContext().then((ctx) => c.imLost(question, { ...ctx, regions: sub.regions }));
  });

  const onEnter = () => {
    setHovered(true);
    pw.overlay.setIgnoreMouse(false);
  };
  const onLeave = () => {
    setHovered(false);
    pw.overlay.setIgnoreMouse(true);
  };

  const endSession = () => {
    client?.end();
    closeOverlayWindows();
  };
  const showMe = () => {
    ensure()?.requestHighlight(`Show me what to do next for: ${payload?.stageTitle ?? "this stage"}`);
  };
  const lost = () => {
    void pw.overlay.open("region");
  };

  const name = payload?.npcName ?? FALLBACK_NAME;
  const seed = payload?.npcAvatarSeed ?? FALLBACK_NAME;
  const listening = ptt.state === "listening";
  const transition = reduced ? { duration: 0 } : { type: "spring" as const, stiffness: 380, damping: 32 };

  return (
    <div className="flex h-full w-full items-start justify-center pt-2">
      <motion.div
        layout
        transition={transition}
        onPointerEnter={onEnter}
        onPointerLeave={onLeave}
        role="region"
        aria-label="AI co-worker"
        className={cn("glass overflow-hidden", expanded ? "w-[440px]" : "w-[300px] !rounded-[26px]")}
      >
        <div className="flex h-[52px] items-center gap-3 px-3">
          <NpcAvatar name={name} seed={seed} size="xs" speaking={speaking} />
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span aria-hidden="true" className={cn("size-2 shrink-0 rounded-full", STATUS_DOT[status])} />
            <span className="truncate font-mono text-[11px] tracking-[0.08em] text-fg uppercase" aria-live="polite">
              {STATUS_LABEL[status]}
            </span>
          </div>
          <button
            type="button"
            onClick={ptt.toggle}
            disabled={!ptt.available}
            aria-pressed={listening}
            aria-label={listening ? "Stop listening" : "Start talking"}
            className={cn(
              NO_DRAG_CLASS,
              "flex size-8 shrink-0 items-center justify-center rounded-full text-white transition-colors disabled:opacity-40",
              listening ? "bg-danger" : "bg-accent hover:bg-accent-hover",
            )}
          >
            {listening ? <Square size={13} fill="currentColor" aria-hidden="true" /> : <Mic size={15} strokeWidth={1.75} aria-hidden="true" />}
          </button>
        </div>

        <AnimatePresence initial={false}>
          {expanded && (
            <IslandExpanded
              key="expanded"
              npcText={last?.text ?? null}
              streaming={last?.streaming ?? false}
              todos={cw.todos}
              onToggleTodo={(id, done) => ensure()?.completeTodo(id, done)}
              onLost={lost}
              onShowMe={showMe}
              onEnd={endSession}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
