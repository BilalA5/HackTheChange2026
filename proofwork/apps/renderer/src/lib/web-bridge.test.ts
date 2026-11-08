import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { OverlayMessage, PwBridge, StoredSession } from "@pw/shared";
import { createWebBridge, readSurface } from "./web-bridge";

function setSearch(search: string) {
  window.history.replaceState({}, "", `/${search}`);
}

const session: StoredSession = {
  token: "tok",
  user: {
    id: "u1",
    email: "a@b.co",
    name: "Ada",
    createdAt: "2026-01-01T00:00:00.000Z",
    careerId: null,
    plan: "free",
    onboardingComplete: false,
    vision: null,
    settings: {} as never,
  },
};

describe("web bridge", () => {
  let main: PwBridge;
  let pip: PwBridge;

  beforeEach(() => {
    setSearch("?surface=main");
    main = createWebBridge();
    setSearch("?surface=pip");
    pip = createWebBridge();
    setSearch("?surface=main");
  });
  afterEach(() => {
    setSearch("");
  });

  it("reads the surface from ?surface= and defaults to main", () => {
    expect(readSurface("?surface=pip")).toBe("pip");
    expect(readSurface("?surface=bogus")).toBe("main");
    expect(readSurface("")).toBe("main");
    expect(pip.surface).toBe("pip");
    expect(main.surface).toBe("main");
    expect(main.isElectron).toBe(false);
  });

  it("reports the web platform and rejects screen capture with a clear error", async () => {
    await expect(main.app.getInfo()).resolves.toMatchObject({ platform: "web" });
    await expect(main.capture.screenshot()).rejects.toThrow(/desktop app/);
    await expect(main.stt.status()).resolves.toMatchObject({ available: false, reason: "web" });
  });

  it("passes an overlay payload from the host to the iframe through sessionStorage", async () => {
    await main.overlay.open("pip", { hello: "world" });
    expect(sessionStorage.getItem("pw.overlay.payload:pip")).toBe(JSON.stringify({ hello: "world" }));
    await expect(main.overlay.isOpen("pip")).resolves.toBe(true);

    await expect(pip.overlay.getPayload()).resolves.toEqual({ hello: "world" });
  });

  it("delivers broadcast messages to other windows only, through BroadcastChannel", async () => {
    const received: OverlayMessage[] = [];
    pip.overlay.onMessage((m) => received.push(m));
    const own: OverlayMessage[] = [];
    main.overlay.onMessage((m) => own.push(m));

    main.overlay.broadcast("coach:tip", { text: "Breathe" });
    await new Promise((r) => setTimeout(r, 0));

    expect(received).toEqual([{ from: "main", channel: "coach:tip", data: { text: "Breathe" } }]);
    expect(own).toEqual([]);
  });

  it("stores and reads the session and notifies subscribers", async () => {
    const seen: (StoredSession | null)[] = [];
    const off = main.auth.onSessionChanged((s) => seen.push(s));
    await main.auth.setSession(session);
    await expect(main.auth.getSession()).resolves.toEqual(session);
    await main.auth.clearSession();
    await expect(main.auth.getSession()).resolves.toBeNull();
    off();
    expect(seen).toEqual([session, null]);
  });

  it("fires bug-report on Ctrl+Shift+B and on Cmd+Shift+B", () => {
    const cb = vi.fn();
    const off = main.shortcuts.onShortcut(cb);
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "B", ctrlKey: true, shiftKey: true }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "b", metaKey: true, shiftKey: true }));
    window.dispatchEvent(new KeyboardEvent("keydown", { key: "b", shiftKey: true }));
    off();
    expect(cb).toHaveBeenCalledTimes(2);
    expect(cb).toHaveBeenCalledWith("bug-report", "press");
  });

  it("keeps recording chunks in memory and returns a blob URL on finish", async () => {
    const createObjectURL = vi.fn(() => "blob:test-1");
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() }));
    try {
      const { id } = await main.recording.begin("take-1.webm");
      await main.recording.write(id, new Uint8Array([1, 2, 3]).buffer);
      await main.recording.write(id, new Uint8Array([4]).buffer);
      const out = await main.recording.finish(id);
      expect(out).toEqual({ url: "blob:test-1", path: "take-1.webm", bytes: 4 });
      expect(createObjectURL).toHaveBeenCalledTimes(1);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("stores cache entries per namespace and lists pending ones", async () => {
    await main.cache.set("notes", "a", { v: 1 }, { pendingSync: true });
    await main.cache.set("notes", "b", { v: 2 });
    await expect(main.cache.get("notes", "a")).resolves.toEqual({ v: 1 });
    await expect(main.cache.pending()).resolves.toEqual([{ namespace: "notes", key: "a", value: { v: 1 } }]);
    await main.cache.markSynced("notes", "a");
    await expect(main.cache.pending()).resolves.toEqual([]);
  });
});
