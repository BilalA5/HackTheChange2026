import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { MonoLabel } from "@/components/ui/Labels";
import { ErrorNotice } from "../ErrorNotice";
import type { Failure } from "../lib/failures";

export interface KickoffCompletionProps {
  npcName: string;
  busy: boolean;
  failure: Failure | null;
  onContinue(): void;
}

/** Shown once every checkpoint note is accepted. Leads to the Proof of Understanding. */
export function KickoffCompletion({ npcName, busy, failure, onContinue }: KickoffCompletionProps) {
  return (
    <section className="paper mx-auto flex w-full max-w-[600px] flex-col items-center gap-5 p-10 text-center">
      <MonoLabel tone="success">All notes accepted</MonoLabel>
      <h2 className="font-serif text-[28px] leading-tight font-medium text-ink">You&apos;re ready to show you understood the brief</h2>
      <p className="text-[14px] leading-relaxed text-muted">
        Next, {npcName} will ask you a few spoken questions. Passing them unlocks the XP you have been holding.
      </p>
      {failure && <ErrorNotice failure={failure} onRetry={onContinue} className="w-full text-left" />}
      <Button variant="primary" size="lg" loading={busy} onClick={onContinue} iconRight={<ArrowRight size={18} strokeWidth={1.75} />}>
        Continue to proof of understanding
      </Button>
    </section>
  );
}
