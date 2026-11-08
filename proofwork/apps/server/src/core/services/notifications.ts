// In-app notifications. Every new one is pushed to the user's open notification sockets.
import type { NotificationCategory, NotificationItem } from "@pw/shared";
import { all, run, type Db } from "../db.ts";
import type { Core } from "../types.ts";
import { nowIso, uid } from "../util.ts";

interface NotificationRow {
  id: string;
  category: string;
  title: string;
  body: string;
  link: string | null;
  read: number;
  created_at: string;
}

export interface NotifyInput {
  category: NotificationCategory;
  title: string;
  body: string;
  link?: string;
}

const toItem = (r: NotificationRow): NotificationItem => ({
  id: r.id,
  category: r.category as NotificationCategory,
  title: r.title,
  body: r.body,
  createdAt: r.created_at,
  read: r.read === 1,
  ...(r.link ? { link: r.link } : {}),
});

export function notify(core: Core, userId: string, input: NotifyInput): NotificationItem {
  const id = uid();
  const createdAt = nowIso();
  run(core.db, "INSERT INTO notifications (id, user_id, category, title, body, link, read, created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?)", [
    id,
    userId,
    input.category,
    input.title,
    input.body,
    input.link ?? null,
    createdAt,
  ]);
  const item = toItem({
    id,
    category: input.category,
    title: input.title,
    body: input.body,
    link: input.link ?? null,
    read: 0,
    created_at: createdAt,
  });
  core.hub.push(userId, { type: "notification", item });
  return item;
}

export function listNotifications(db: Db, userId: string): NotificationItem[] {
  return all<NotificationRow>(
    db,
    "SELECT id, category, title, body, link, read, created_at FROM notifications WHERE user_id = ? ORDER BY rowid DESC LIMIT 100",
    [userId],
  ).map(toItem);
}

/** Returns false when the notification does not belong to the user. */
export function markRead(db: Db, userId: string, id: string): boolean {
  return run(db, "UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?", [id, userId]) > 0;
}

export function markAllRead(db: Db, userId: string): void {
  run(db, "UPDATE notifications SET read = 1 WHERE user_id = ?", [userId]);
}
