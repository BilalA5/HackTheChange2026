import { cn } from "@/lib/cn";

export type AvatarSize = "xs" | "sm" | "md" | "lg";

const SIZE: Record<AvatarSize, { box: string; text: string }> = {
  xs: { box: "size-6", text: "text-[10px]" },
  sm: { box: "size-9", text: "text-[13px]" },
  md: { box: "size-12", text: "text-[16px]" },
  lg: { box: "size-20", text: "text-[26px]" },
};

/** Stable hash of a seed string, used to derive the gradient hues. */
export function seedHash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? (parts[parts.length - 1][0] ?? "") : "";
  return (first + last).toUpperCase();
}

export interface NpcAvatarProps {
  name: string;
  /** Npc.avatarSeed. Same seed, same gradient. */
  seed: string;
  size?: AvatarSize;
  /** Shows a pulsing ring while the character speaks. */
  speaking?: boolean;
  className?: string;
}

/** Gradient disc with initials. No photos. */
export function NpcAvatar({ name, seed, size = "md", speaking = false, className }: NpcAvatarProps) {
  const h = seedHash(seed);
  const hue = h % 360;
  const hue2 = (hue + 48) % 360;
  return (
    <span className={cn("relative inline-flex shrink-0", SIZE[size].box, className)}>
      <span
        role="img"
        aria-label={name}
        className={cn(
          "flex size-full items-center justify-center rounded-full font-mono font-semibold text-white/95 select-none",
          SIZE[size].text,
          speaking && "pw-pulse-ring",
        )}
        style={{ background: `linear-gradient(135deg, hsl(${hue} 62% 58%), hsl(${hue2} 58% 34%))` }}
      >
        {initialsOf(name)}
      </span>
    </span>
  );
}
