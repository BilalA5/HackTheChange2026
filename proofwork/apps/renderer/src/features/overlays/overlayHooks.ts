import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { OverlayMessage } from "@pw/shared";
import { pw } from "@/lib/bridge";
import { useSession } from "@/stores/session";

/*
 * Shared plumbing for every overlay window: payload, cross-window messages, session boot and the
 * window-chrome styles (drag region and no-drag buttons).
 */

/** Electron drag region. Buttons inside a drag region must carry NO_DRAG as well. */
export const DRAG_REGION = { WebkitAppRegion: "drag" } as unknown as CSSProperties;
export const NO_DRAG = { WebkitAppRegion: "no-drag" } as unknown as CSSProperties;
/** Class form of NO_DRAG, for buttons and inputs inside a drag region. */
export const NO_DRAG_CLASS = "no-drag";

/**
 * The surface's payload: read once with getPayload() on mount, then kept in step with onPayload().
 * Returns null until a payload that passes `guard` arrives.
 */
export function useOverlayPayload<T>(guard: (v: unknown) => v is T): T | null {
  const [payload, setPayload] = useState<T | null>(null);
  useEffect(() => {
    let alive = true;
    const accept = (raw: unknown) => {
      if (alive && guard(raw)) setPayload(raw);
    };
    const off = pw.overlay.onPayload(accept);
    pw.overlay.getPayload().then(accept, () => undefined);
    return () => {
      alive = false;
      off();
    };
  }, [guard]);
  return payload;
}

/**
 * Overlay windows never run App.tsx, so they hydrate the session themselves. Calls made from an overlay
 * (the objective fetch, the co-worker socket) need the bearer token.
 */
export function useOverlayBoot(): void {
  useEffect(() => {
    const { hydrated, hydrate } = useSession.getState();
    if (!hydrated) void hydrate();
  }, []);
}

/**
 * Subscribes to one cross-window channel. `parse` returns null for anything it does not accept.
 * The latest handler is always used, so callers need not memoise it.
 */
export function useOverlayMessage<T>(channel: string, parse: (data: unknown) => T | null, handler: (value: T) => void): void {
  const handlerRef = useRef(handler);
  const parseRef = useRef(parse);
  useEffect(() => {
    handlerRef.current = handler;
    parseRef.current = parse;
  });
  useEffect(
    () =>
      pw.overlay.onMessage((msg: OverlayMessage) => {
        if (msg.channel !== channel) return;
        const value = parseRef.current(msg.data);
        if (value !== null) handlerRef.current(value);
      }),
    [channel],
  );
}

/** True when the user asked for less motion. Re-evaluates when the setting changes. */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => readReducedMotion());
  useEffect(() => {
    if (typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

function readReducedMotion(): boolean {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
