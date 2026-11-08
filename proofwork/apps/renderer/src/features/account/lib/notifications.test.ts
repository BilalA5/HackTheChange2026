import { describe, expect, it } from "vitest";
import type { NotificationItem } from "@pw/shared";
import { groupNotifications, isSameLocalDay, relativeTime } from "./notifications";

const now = new Date(2026, 10, 7, 15, 0, 0); // local 7 Nov 2026, 15:00

function item(id: string, createdAt: Date): NotificationItem {
  return { id, category: "progress", title: id, body: "", createdAt: createdAt.toISOString(), read: false };
}

describe("groupNotifications", () => {
  it("splits today from earlier and sorts each newest first", () => {
    const items = [
      item("old", new Date(2026, 10, 5, 9)),
      item("early-today", new Date(2026, 10, 7, 8)),
      item("late-today", new Date(2026, 10, 7, 14)),
      item("yesterday", new Date(2026, 10, 6, 23)),
    ];
    const groups = groupNotifications(items, now);
    expect(groups.today.map((i) => i.id)).toEqual(["late-today", "early-today"]);
    expect(groups.earlier.map((i) => i.id)).toEqual(["yesterday", "old"]);
  });

  it("returns empty groups for no items", () => {
    expect(groupNotifications([], now)).toEqual({ today: [], earlier: [] });
  });

  it("treats a timestamp just after local midnight as today", () => {
    const groups = groupNotifications([item("midnight", new Date(2026, 10, 7, 0, 5))], now);
    expect(groups.today.map((i) => i.id)).toEqual(["midnight"]);
  });
});

describe("isSameLocalDay", () => {
  it("compares calendar days, not elapsed hours", () => {
    expect(isSameLocalDay(new Date(2026, 10, 7, 0, 1), new Date(2026, 10, 7, 23, 59))).toBe(true);
    expect(isSameLocalDay(new Date(2026, 10, 6, 23, 59), new Date(2026, 10, 7, 0, 1))).toBe(false);
  });
});

describe("relativeTime", () => {
  const at = (msAgo: number) => new Date(now.getTime() - msAgo).toISOString();

  it("reads recent times in minutes and hours", () => {
    expect(relativeTime(at(10_000), now)).toBe("just now");
    expect(relativeTime(at(12 * 60_000), now)).toBe("12m ago");
    expect(relativeTime(at(3 * 3_600_000), now)).toBe("3h ago");
    expect(relativeTime(at(2 * 86_400_000), now)).toBe("2d ago");
  });

  it("falls back to a date after a week", () => {
    expect(relativeTime(at(10 * 86_400_000), now)).not.toMatch(/ago$/);
  });
});
