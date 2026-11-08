import { useNavigate } from "react-router";
import { ArrowLeft, Bell, Coins, LifeBuoy } from "lucide-react";
import { cn } from "@/lib/cn";
import { useSession } from "@/stores/session";
import { useTitlebar } from "@/stores/titlebar";
import { useNotifications } from "@/stores/notifications";
import { useUi } from "@/stores/ui";
import { IconButton } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Labels";

/** 44px titlebar drawn by the renderer when there is no native shell (plain browser). */
export function WebTitlebar() {
  const user = useSession((s) => s.user);
  const { title, credits, canGoBack } = useTitlebar();
  const unread = useNotifications((s) => s.unread);
  const openPanel = useUi((s) => s.openPanel);
  const navigate = useNavigate();
  if (!user) return null;

  const creditsLabel = credits === undefined ? "Credits" : credits === null ? "Unlimited" : `${credits.toLocaleString()} credits`;

  return (
    <header className="flex h-11 shrink-0 items-center gap-2 border-b border-line bg-night-2 px-3 text-fg">
      <div className="flex w-20 items-center">
        {canGoBack && <IconButton label="Back" size="sm" icon={<ArrowLeft size={16} strokeWidth={1.75} />} onClick={() => navigate(-1)} />}
      </div>
      <h1 className="min-w-0 flex-1 truncate text-center font-mono text-[12px] tracking-[0.08em] text-fg-muted uppercase">{title}</h1>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => openPanel("credits")}
          aria-label={`${creditsLabel}. Show credits`}
          className={cn("glass inline-flex h-7 items-center gap-1.5 rounded-full px-3 font-mono text-[12px] text-fg")}
        >
          <Coins size={13} strokeWidth={1.75} className="text-xp" aria-hidden="true" />
          {creditsLabel}
        </button>
        <IconButton label="Support" size="sm" icon={<LifeBuoy size={16} strokeWidth={1.75} />} onClick={() => openPanel("support")} />
        <span className="relative">
          <IconButton label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"} size="sm" icon={<Bell size={16} strokeWidth={1.75} />} onClick={() => openPanel("notifications")} />
          {unread > 0 && (
            <span className="pointer-events-none absolute -top-1 -right-1">
              <Badge tone="accent">{unread > 9 ? "9+" : unread}</Badge>
            </span>
          )}
        </span>
      </div>
    </header>
  );
}
