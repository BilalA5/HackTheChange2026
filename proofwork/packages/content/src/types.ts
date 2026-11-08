import type { Career, Company, Npc, Scenario } from "@pw/shared";

/** One career's authored content. Each file in ./careers default-exports one of these. */
export interface CareerPack {
  career: Career;
  companies: Company[];
  npcs: Npc[];
  /** Exactly 3 scenarios, order 1..3, increasing difficulty. */
  scenarios: Scenario[];
}
