import { useState } from "react";
import type { KickoffSegment, Npc, Objective } from "@pw/shared";
import { api } from "@/lib/api";
import { VoiceBubble } from "@/components/domain";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Fields";
import { MonoLabel } from "@/components/ui/Labels";
import { ErrorNotice } from "../ErrorNotice";
import { failureFrom, type Failure } from "../lib/failures";
import { usePlayedTracker } from "../lib/played";

export interface AskPanelProps {
  objective: Objective;
  segment: KickoffSegment;
  npc: Npc;
  onObjective(o: Objective): void;
}

/** Questions to the manager about this segment. Each new answer autoplays once. */
export function AskPanel({ objective, segment, npc, onObjective }: AskPanelProps) {
  const questions = objective.kickoffQuestions.filter((q) => q.segmentId === segment.id);
  // Answers that exist on mount were already heard; only new ones autoplay.
  const tracker = usePlayedTracker(questions.map((q) => q.at));
  const [question, setQuestion] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);

  const ask = async () => {
    const text = question.trim();
    if (!text || pending !== null) return;
    setPending(text);
    setFailure(null);
    try {
      const res = await api("POST /objectives/:id/kickoff/ask", {
        params: { id: objective.id },
        body: { segmentId: segment.id, question: text },
      });
      onObjective(res.objective);
      setQuestion("");
    } catch (e) {
      setFailure(failureFrom(e));
    } finally {
      setPending(null);
    }
  };

  return (
    <section aria-label="Ask a question" className="paper flex flex-col gap-4 p-6">
      <MonoLabel tone="accent">Ask {npc.name} a question</MonoLabel>

      {questions.length > 0 && (
        <div className="flex flex-col gap-4">
          {questions.map((q) => (
            <div key={q.at} className="flex flex-col gap-3">
              <VoiceBubble side="learner" name="You" text={q.question} />
              <VoiceBubble
                side="npc"
                name={npc.name}
                avatarSeed={npc.avatarSeed}
                voice={npc.voice}
                text={q.answer}
                autoPlay={tracker.shouldAutoPlay(q.at)}
              />
            </div>
          ))}
        </div>
      )}
      {pending !== null && <VoiceBubble side="learner" name="You" text={pending} />}
      {pending !== null && <p className="text-[13px] text-muted">{npc.name} is thinking…</p>}

      {failure && <ErrorNotice failure={failure} onRetry={ask} />}

      <div className="flex flex-col gap-3">
        <Textarea
          label="Your question"
          value={question}
          placeholder="Ask about scope, data or a decision"
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) e.currentTarget.form?.requestSubmit();
          }}
          rows={2}
          maxRows={6}
          disabled={pending !== null}
        />
        <form
          className="flex justify-end"
          onSubmit={(e) => {
            e.preventDefault();
            void ask();
          }}
        >
          <Button type="submit" variant="primary" disabled={!question.trim()} loading={pending !== null}>
            Ask
          </Button>
        </form>
      </div>
    </section>
  );
}
