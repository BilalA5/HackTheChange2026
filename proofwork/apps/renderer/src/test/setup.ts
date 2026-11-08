import { afterEach } from "vitest";

/*
 * jsdom has no BroadcastChannel. This in-memory version delivers to every other instance with the same
 * name, asynchronously, and never to the sender (the same rule as the real API).
 */
const registry = new Map<string, Set<MemoryBroadcastChannel>>();

class MemoryBroadcastChannel extends EventTarget {
  readonly name: string;
  onmessage: ((ev: MessageEvent) => void) | null = null;

  constructor(name: string) {
    super();
    this.name = name;
    const set = registry.get(name) ?? new Set<MemoryBroadcastChannel>();
    set.add(this);
    registry.set(name, set);
  }

  postMessage(data: unknown): void {
    for (const other of registry.get(this.name) ?? []) {
      if (other === this) continue;
      queueMicrotask(() => other.dispatchEvent(new MessageEvent("message", { data })));
    }
  }

  close(): void {
    registry.get(this.name)?.delete(this);
  }
}

Object.defineProperty(globalThis, "BroadcastChannel", {
  value: MemoryBroadcastChannel,
  configurable: true,
  writable: true,
});

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});
