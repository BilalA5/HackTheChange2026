// In-process registry of notification sockets, keyed by user. Also de-duplicates reliable-socket event keys.
import type { NotificationsServerMessage } from "@pw/shared";

export type Sender = (msg: NotificationsServerMessage) => void;

const SEEN_LIMIT = 2000;

export class Hub {
  private readonly senders = new Map<string, Set<Sender>>();
  private readonly seen = new Map<string, Set<string>>();

  /** Registers a sender for a user. Returns the function that unregisters it. */
  add(userId: string, send: Sender): () => void {
    let set = this.senders.get(userId);
    if (!set) {
      set = new Set();
      this.senders.set(userId, set);
    }
    const bucket = set;
    bucket.add(send);
    return () => {
      bucket.delete(send);
      if (bucket.size === 0 && this.senders.get(userId) === bucket) this.senders.delete(userId);
    };
  }

  push(userId: string, msg: NotificationsServerMessage): void {
    for (const send of this.senders.get(userId) ?? []) {
      try {
        send(msg);
      } catch {
        // A broken socket must not break the request that produced the push.
      }
    }
  }

  /** Returns true when the key was already seen for this user. */
  markSeen(userId: string, eventKey: string): boolean {
    let set = this.seen.get(userId);
    if (!set) {
      set = new Set();
      this.seen.set(userId, set);
    }
    if (set.has(eventKey)) return true;
    set.add(eventKey);
    if (set.size > SEEN_LIMIT) {
      const oldest = set.values().next().value;
      if (oldest !== undefined) set.delete(oldest);
    }
    return false;
  }
}
