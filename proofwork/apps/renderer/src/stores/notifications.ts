import { create } from "zustand";
import {
  WS_PATHS,
  type NotificationItem,
  type NotificationsServerMessage,
} from "@pw/shared";
import { api, invalidate } from "@/lib/api";
import { pw } from "@/lib/bridge";
import { errorMessage } from "@/lib/errors";
import { getDeviceId } from "@/lib/device";
import { newUuid } from "@/lib/uuid";
import { ReliableSocket } from "@/lib/realtime/ReliableSocket";
import { toast } from "./toasts";
import { useCredits } from "./credits";
import { useProgress } from "./progress";
import { useSession } from "./session";
import { currentServerUrl } from "@/lib/api";

export interface NotificationsState {
  items: NotificationItem[];
  unread: number;
  loaded: boolean;
  error: string | null;
  /** GET /notifications. */
  load(): Promise<void>;
  /** Electron: subscribe to pw.notifications.onPush. Web: open the /ws/notifications socket. Idempotent. */
  start(): void;
  stop(): void;
  /** Applies one server frame: "notification", "credits", "xp", "coach_moment". */
  handle(msg: NotificationsServerMessage): void;
  markRead(id: string): Promise<void>;
  markAll(): Promise<void>;
}

const countUnread = (items: NotificationItem[]) => items.filter((i) => !i.read).length;

let socket: ReliableSocket<NotificationsServerMessage, { action: string }> | null = null;
let unsubPush: (() => void) | null = null;

export const useNotifications = create<NotificationsState>()((set, get) => ({
  items: [],
  unread: 0,
  loaded: false,
  error: null,

  async load() {
    try {
      const items = await api("GET /notifications");
      set({ items, unread: countUnread(items), loaded: true, error: null });
    } catch (e) {
      set({ error: errorMessage(e) });
    }
  },

  start() {
    if (pw.isElectron) {
      if (unsubPush) return;
      // The main process forwards the notifications socket frames unchanged.
      unsubPush = pw.notifications.onPush((m) => get().handle(m as unknown as NotificationsServerMessage));
      return;
    }
    if (socket) return;
    const token = useSession.getState().token;
    if (!token) return;
    const s = new ReliableSocket<NotificationsServerMessage, { action: string }>({
      name: "notifications",
      path: WS_PATHS.notifications,
      baseUrl: () => currentServerUrl(),
      auth: () => ({ token: useSession.getState().token ?? "", session_id: newUuid(), device_id: getDeviceId() }),
    });
    s.on("notification", (m) => get().handle(m));
    s.on("credits", (m) => get().handle(m));
    s.on("xp", (m) => get().handle(m));
    s.on("coach_moment", (m) => get().handle(m));
    s.connect();
    socket = s;
  },

  stop() {
    unsubPush?.();
    unsubPush = null;
    socket?.close();
    socket = null;
  },

  handle(msg) {
    switch (msg.type) {
      case "notification": {
        const item = msg.item;
        set((s) => {
          const items = [item, ...s.items.filter((i) => i.id !== item.id)];
          return { items, unread: countUnread(items) };
        });
        toast({ title: item.title, body: item.body, tone: "neutral" });
        if (typeof document !== "undefined" && document.hidden) {
          pw.notifications.show({ title: item.title, body: item.body, route: item.link });
        }
        return;
      }
      case "credits":
        useCredits.getState().setBalance(msg.balance);
        return;
      case "xp":
        void useProgress.getState().refresh();
        toast({ title: `+${msg.amount} XP`, body: msg.reason, tone: "xp" });
        return;
      case "coach_moment":
        toast({ title: "Coach", body: msg.text, tone: "neutral" });
        return;
      case "connection_registered":
      case "pong":
        return;
    }
  },

  async markRead(id) {
    set((s) => {
      const items = s.items.map((i) => (i.id === id ? { ...i, read: true } : i));
      return { items, unread: countUnread(items) };
    });
    try {
      await api("POST /notifications/:id/read", { params: { id } });
      invalidate("GET /notifications");
    } catch (e) {
      set({ error: errorMessage(e) });
    }
  },

  async markAll() {
    set((s) => {
      const items = s.items.map((i) => ({ ...i, read: true }));
      return { items, unread: 0 };
    });
    try {
      await api("POST /notifications/read-all");
      invalidate("GET /notifications");
    } catch (e) {
      set({ error: errorMessage(e) });
    }
  },
}));
