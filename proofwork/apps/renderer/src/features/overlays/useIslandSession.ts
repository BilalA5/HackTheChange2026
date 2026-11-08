import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { StageOverlayPayload } from "@/lib/overlayChannels";
import { createCoworkClient, initialCoworkState, type CoworkClient, type CoworkState } from "@/lib/realtime/cowork";
import { useSession } from "@/stores/session";

/*
 * The island owns the co-worker session. The client is created on demand (ensure) so the first utterance,
 * "I'm lost" or a "start" command can all open it. Closing it tears the socket down.
 */

export interface IslandSession {
  client: CoworkClient | null;
  /** Starts the session if it is not running. Null only when no stage payload has arrived yet. */
  ensure(): CoworkClient | null;
  close(): void;
}

export function useIslandSession(payload: StageOverlayPayload | null): IslandSession {
  const [client, setClient] = useState<CoworkClient | null>(null);
  const clientRef = useRef<CoworkClient | null>(null);
  const payloadRef = useRef(payload);
  payloadRef.current = payload;
  const hydrated = useSession((s) => s.hydrated);

  const ensure = useCallback((): CoworkClient | null => {
    if (clientRef.current) return clientRef.current;
    const p = payloadRef.current;
    if (!p) return null;
    const c = createCoworkClient({ objectiveId: p.objectiveId, stageId: p.stageId, mode: p.mode, learnerName: p.learnerName });
    c.connect();
    clientRef.current = c;
    setClient(c);
    return c;
  }, []);

  const close = useCallback(() => {
    clientRef.current?.close();
    clientRef.current = null;
    setClient(null);
  }, []);

  // Wait for the session token: the co-worker socket authenticates with it.
  const ready = payload !== null && hydrated;
  useEffect(() => {
    if (ready) ensure();
  }, [ready, ensure]);

  useEffect(
    () => () => {
      clientRef.current?.close();
      clientRef.current = null;
    },
    [],
  );

  return { client, ensure, close };
}

const EMPTY_STATE: CoworkState = initialCoworkState("plan");

/** useCowork that also accepts "no client yet", which the island has until the first start. */
export function useOptionalCowork(client: CoworkClient | null): CoworkState {
  const subscribe = useCallback((cb: () => void) => (client ? client.subscribe(cb) : () => undefined), [client]);
  const getSnapshot = useCallback(() => (client ? client.getState() : EMPTY_STATE), [client]);
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
