import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";

export interface LiveVideoProps {
  stream: MediaStream | null;
  label: string;
  className?: string;
}

/** Mirrored, muted local preview of a MediaStream. */
export function LiveVideo({ stream, label, className }: LiveVideoProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.srcObject = stream;
    if (stream) void el.play().catch(() => undefined);
  }, [stream]);

  return (
    <video
      ref={ref}
      autoPlay
      muted
      playsInline
      aria-label={label}
      className={cn("size-full scale-x-[-1] object-cover", className)}
    />
  );
}
