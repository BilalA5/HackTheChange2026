import { GlassCard } from "./Surfaces";

/** Stand-in for a feature screen or panel that has not been built yet. Feature agents replace the whole file. */
export function Placeholder({ name }: { name: string }) {
  return (
    <div className="flex h-full min-h-[160px] items-center justify-center p-6">
      <GlassCard className="max-w-[420px] text-center">
        <p className="font-mono text-[11px] tracking-[0.08em] text-fg-muted uppercase">Placeholder</p>
        <h2 className="mt-2 font-serif text-[22px]">{name}</h2>
        <p className="mt-2 text-[13px] text-fg-muted">This screen is wired up and waiting for its feature implementation.</p>
      </GlassCard>
    </div>
  );
}
