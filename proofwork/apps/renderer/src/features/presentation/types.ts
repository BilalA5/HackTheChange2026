/** Shared types for the presentation feature. */

export type FramingReason = "ok" | "too_dark" | "too_bright" | "no_signal";

/** One editable slide in the outline. `id` is a stable React key. */
export interface OutlineSlide {
  id: string;
  heading: string;
  bullets: string[];
}

export type PresentationPhase = "setup" | "recording" | "review";

/** Inputs for the default outline. Only the scenario and stage facts the outline needs. */
export interface DeckSource {
  scenarioTitle: string;
  stageTitle: string;
  problemStatement: string;
  /** Requirements agreed in earlier stages. */
  agreedRequirements: string[];
  /** Scenario deliverable titles. */
  deliverables: string[];
}
