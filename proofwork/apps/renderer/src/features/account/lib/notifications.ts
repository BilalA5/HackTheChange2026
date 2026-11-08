import type { NotificationItem } from "@pw/shared";

export interface NotificationGroups {
  today: NotificationItem[];
  earlier: NotificationItem[];
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function timeOf(iso: string): number {
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

/** True when both dates fall on the same calendar day in the local time zone. */
export function isSameLocalDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** Newest first. "Today" is the local calendar day of `now`; everything else is "Earlier". */
export function groupNotifications(items: readonly NotificationItem[], now: Date = new Date()): NotificationGroups {
  const sorted = [...items].sort((a, b) => timeOf(b.createdAt) - timeOf(a.createdAt));
  const groups: NotificationGroups = { today: [], earlier: [] };
  for (const item of sorted) {
    const when = new Date(timeOf(item.createdAt));
    (isSameLocalDay(when, now) ? groups.today : groups.earlier).push(item);
  }
  return groups;
}

/** Short relative label: "just now", "12m ago", "3h ago", "2d ago", then a date. */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const diff = now.getTime() - timeOf(iso);
  if (diff < MINUTE) return "just now";
  if (diff < HOUR) return `${Math.floor(diff / MINUTE)}m ago`;
  if (diff < DAY) return `${Math.floor(diff / HOUR)}h ago`;
  if (diff < 7 * DAY) return `${Math.floor(diff / DAY)}d ago`;
  return new Date(timeOf(iso)).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
