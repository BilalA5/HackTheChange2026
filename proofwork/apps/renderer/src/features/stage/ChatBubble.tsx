import { cn } from "@/lib/cn";
import { NpcAvatar } from "@/components/domain/NpcAvatar";

export interface ChatBubbleProps {
  side: "npc" | "learner";
  /** NPC name and avatar seed, used for npc bubbles. */
  name?: string;
  avatarSeed?: string;
  text: string;
  /** Learner bubble still waiting for the server. */
  pending?: boolean;
  /** Night or paper bubble colours. */
  tone?: "night" | "paper";
}

/** One chat message. The npc side shows the avatar; the learner side is right-aligned. */
export function ChatBubble({ side, name, avatarSeed, text, pending = false, tone = "night" }: ChatBubbleProps) {
  const npc = side === "npc";
  const bubble =
    side === "learner"
      ? tone === "paper"
        ? "bg-ink text-white"
        : "bg-accent text-white"
      : tone === "paper"
        ? "bg-white text-ink"
        : "bg-white/8 text-fg";
  return (
    <div className={cn("flex items-end gap-2.5", npc ? "justify-start" : "justify-end")}>
      {npc && name && avatarSeed && <NpcAvatar name={name} seed={avatarSeed} size="xs" />}
      <div className={cn("max-w-[78%] rounded-[18px] px-4 py-2.5 text-[14px] leading-relaxed whitespace-pre-wrap", bubble, pending && "opacity-60")}>
        {text}
      </div>
    </div>
  );
}

/** Three dots while the other side is typing. */
export function TypingIndicator({ name, avatarSeed, tone = "night" }: { name: string; avatarSeed: string; tone?: "night" | "paper" }) {
  return (
    <div className="flex items-end gap-2.5" role="status" aria-label={`${name} is typing`}>
      <NpcAvatar name={name} seed={avatarSeed} size="xs" />
      <div className={cn("flex items-center gap-1 rounded-[18px] px-4 py-3", tone === "paper" ? "bg-white" : "bg-white/8")}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            aria-hidden="true"
            className={cn("size-1.5 animate-pulse rounded-full", tone === "paper" ? "bg-muted" : "bg-fg-muted")}
            style={{ animationDelay: `${i * 150}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
