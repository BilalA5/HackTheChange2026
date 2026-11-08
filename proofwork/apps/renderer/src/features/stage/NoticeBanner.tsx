import { CreditCard, X } from "lucide-react";
import type { StageNotice } from "./helpers";
import { Button } from "@/components/ui/Button";
import { useUi } from "@/stores/ui";
import { IconButton } from "@/components/ui/Button";

export interface NoticeBannerProps {
  notice: StageNotice;
  onDismiss(): void;
}

/** Inline notice under the top bar. Credit problems offer a button that opens the credits panel. */
export function NoticeBanner({ notice, onDismiss }: NoticeBannerProps) {
  const openPanel = useUi((s) => s.openPanel);
  const tone = notice.kind === "credits" ? "border-warning/40 bg-warning/10" : "border-danger/40 bg-danger/10";
  return (
    <div role="alert" className={`flex shrink-0 items-center gap-3 border-b px-4 py-2.5 text-[13px] text-fg ${tone}`}>
      <span className="min-w-0 flex-1">{notice.message}</span>
      {notice.kind === "credits" && (
        <Button size="sm" variant="glass" icon={<CreditCard size={14} strokeWidth={1.75} aria-hidden="true" />} onClick={() => openPanel("credits")}>
          Top up credits
        </Button>
      )}
      <IconButton label="Dismiss message" size="sm" icon={<X size={14} strokeWidth={1.75} />} onClick={onDismiss} />
    </div>
  );
}
