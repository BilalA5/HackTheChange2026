import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router";
import { Bell, Briefcase, CreditCard, GraduationCap, Megaphone, MessageSquare, Trophy, UserRound, type LucideIcon } from "lucide-react";
import type { NotificationCategory, NotificationItem } from "@pw/shared";
import { Sheet } from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { EmptyState, Skeleton } from "@/components/ui/Feedback";
import { MonoLabel } from "@/components/ui/Labels";
import { useNotifications } from "@/stores/notifications";
import type { PanelProps } from "@/stores/ui";
import { cn } from "@/lib/cn";
import { groupNotifications, relativeTime } from "./lib/notifications";

const ICONS: Record<NotificationCategory, LucideIcon> = {
  progress: Trophy,
  feedback: MessageSquare,
  manager: UserRound,
  coaching: GraduationCap,
  jobs: Briefcase,
  billing: CreditCard,
  product: Megaphone,
};

/** Right-hand sheet listing notifications, grouped Today and Earlier. */
export default function NotificationsPanel({ onClose }: PanelProps) {
  const navigate = useNavigate();
  const items = useNotifications((s) => s.items);
  const unread = useNotifications((s) => s.unread);
  const loaded = useNotifications((s) => s.loaded);
  const error = useNotifications((s) => s.error);

  useEffect(() => {
    void useNotifications.getState().load();
  }, []);

  const groups = useMemo(() => groupNotifications(items), [items]);

  const open = (item: NotificationItem) => {
    if (!item.read) void useNotifications.getState().markRead(item.id);
    if (item.link) {
      navigate(item.link);
      onClose();
    }
  };

  return (
    <Sheet open onClose={onClose} title="Notifications" width={400}>
      <div className="flex h-full flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[13px] text-fg-muted" aria-live="polite">
            {unread > 0 ? `${unread} unread` : "All caught up"}
          </span>
          <Button variant="ghost" size="sm" disabled={unread === 0} onClick={() => void useNotifications.getState().markAll()}>
            Mark all read
          </Button>
        </div>

        {!loaded && !error && (
          <div className="flex flex-col gap-3" aria-label="Loading notifications">
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
            <Skeleton className="h-16" />
          </div>
        )}

        {error && (
          <div role="alert" className="flex flex-col items-start gap-3 text-[14px] text-danger">
            <span>Could not load notifications. {error}</span>
            <Button variant="glass" size="sm" onClick={() => void useNotifications.getState().load()}>
              Try again
            </Button>
          </div>
        )}

        {loaded && items.length === 0 && (
          <EmptyState
            icon={<Bell size={20} strokeWidth={1.75} />}
            title="You are all caught up"
            body="Progress, feedback and billing updates appear here."
          />
        )}

        {items.length > 0 && (
          <div className="min-h-0 flex-1 overflow-y-auto">
            <Group label="Today" items={groups.today} onOpen={open} />
            <Group label="Earlier" items={groups.earlier} onOpen={open} />
          </div>
        )}
      </div>
    </Sheet>
  );
}

function Group({ label, items, onOpen }: { label: string; items: NotificationItem[]; onOpen(item: NotificationItem): void }) {
  if (items.length === 0) return null;
  return (
    <section aria-label={label} className="mb-4">
      <div className="mb-2 px-1">
        <MonoLabel>{label}</MonoLabel>
      </div>
      <ul className="flex flex-col gap-1.5">
        {items.map((item) => {
          const Icon = ICONS[item.category];
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onOpen(item)}
                className={cn(
                  "flex w-full items-start gap-3 rounded-card border border-line px-4 py-3 text-left transition-colors duration-200 hover:bg-white/8",
                  item.read ? "bg-white/3" : "bg-white/7",
                )}
              >
                <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-white/8 text-fg-muted">
                  <Icon size={15} strokeWidth={1.75} aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className={cn("truncate text-[14px] text-fg", !item.read && "font-medium")}>{item.title}</span>
                    <time dateTime={item.createdAt} className="shrink-0 font-mono text-[11px] text-fg-muted">
                      {relativeTime(item.createdAt)}
                    </time>
                  </span>
                  {item.body && <span className="mt-0.5 line-clamp-2 block text-[13px] text-fg-muted">{item.body}</span>}
                </span>
                {!item.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-accent" aria-label="Unread" />}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
