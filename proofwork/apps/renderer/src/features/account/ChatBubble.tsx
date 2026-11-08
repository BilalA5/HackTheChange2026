import type { ChatMessage } from "@pw/shared";
import { Markdown } from "@/components/ui/Markdown";
import { NpcAvatar } from "@/components/domain";
import { cn } from "@/lib/cn";

export interface ChatTeam {
  name: string;
  seed: string;
}

/**
 * One message in a support or coach thread. Learner messages sit right in accent. Team replies sit left
 * with an avatar, and render Markdown when `markdown` is set (coach replies do, support replies do not).
 */
export function ChatBubble({ message, team, markdown }: { message: ChatMessage; team: ChatTeam; markdown: boolean }) {
  if (message.role === "system") {
    return <p className="text-center font-mono text-[11px] tracking-[0.06em] text-fg-muted uppercase">{message.text}</p>;
  }

  const mine = message.role === "learner";
  return (
    <div className={cn("flex items-end gap-2", mine && "flex-row-reverse")}>
      {!mine && <NpcAvatar name={team.name} seed={team.seed} size="xs" />}
      <div
        className={cn(
          "max-w-[82%] rounded-2xl px-4 py-2.5 text-[14px] leading-relaxed",
          mine ? "rounded-br-md bg-accent text-white" : "rounded-bl-md bg-white/8 text-fg",
        )}
      >
        {mine || !markdown ? <p className="whitespace-pre-wrap">{message.text}</p> : <Markdown source={message.text} tone="night" />}
      </div>
    </div>
  );
}
