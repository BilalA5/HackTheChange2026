import { useCallback, useEffect, useState } from "react";
import { AnimatePresence } from "motion/react";
import { pw } from "@/lib/bridge";
import { EMPTY_HUD, HUD_TTL_MS, hudAdvance, hudEnqueue, makeNotice, type HudState } from "./hudQueue";
import { hudNoticeFromPush, parseHudShow, type HudInput } from "./overlayMessages";
import { useOverlayMessage, usePrefersReducedMotion } from "./overlayHooks";
import { HudToast } from "./HudToast";

/**
 * Transient notices. Fully click-through and transparent when idle. Sources: "hud:show" broadcasts and
 * notifications pushed by the main process (xp, notification).
 */
export default function HudSurface() {
  const [state, setState] = useState<HudState>(EMPTY_HUD);
  const reduced = usePrefersReducedMotion();

  const push = useCallback((input: HudInput) => {
    setState((s) => hudEnqueue(s, makeNotice(input)));
  }, []);

  useEffect(() => {
    pw.overlay.setIgnoreMouse(true);
  }, []);

  useOverlayMessage("hud:show", parseHudShow, push);

  useEffect(
    () =>
      pw.notifications.onPush((msg) => {
        const input = hudNoticeFromPush(msg);
        if (input) push(input);
      }),
    [push],
  );

  const currentId = state.current?.id ?? null;
  useEffect(() => {
    if (currentId === null) return;
    const timer = setTimeout(() => setState((s) => hudAdvance(s)), HUD_TTL_MS);
    return () => clearTimeout(timer);
  }, [currentId]);

  return (
    <div className="pointer-events-none flex h-full w-full justify-center pt-0">
      <AnimatePresence mode="popLayout">
        {state.current && <HudToast key={state.current.id} notice={state.current} reduced={reduced} />}
      </AnimatePresence>
    </div>
  );
}
