// Scenario cards and unlock rules: order n unlocks once order n-1 is completed.
import type { Objective, Scenario, ScenarioCard, ScenarioDetail, ScenarioStatus } from "@pw/shared";
import { notFound } from "../errors.ts";
import type { Core } from "../types.ts";
import { objectivesByScenario } from "./objective-store.ts";
import { overallLevel } from "./performance.ts";

/** Status of a scenario for this learner, given their objectives keyed by scenario id. */
export function scenarioStatus(core: Core, scenario: Scenario, objectives: Map<string, Objective>): ScenarioStatus {
  const own = objectives.get(scenario.id);
  if (own) return own.status;
  const previous = core.content.previousScenario(scenario);
  if (!previous) return "available";
  return objectives.get(previous.id)?.status === "completed" ? "available" : "locked";
}

export function scenarioCards(core: Core, userId: string, careerId: string): ScenarioCard[] {
  const objectives = objectivesByScenario(core.db, userId);
  return core.content.scenariosForCareer(careerId).map((scenario) => {
    const resolved = core.content.resolveScenario(scenario.id);
    if (!resolved) throw new Error(`Content missing for scenario ${scenario.id}`);
    const objective = objectives.get(scenario.id) ?? null;
    return {
      id: scenario.id,
      careerId: scenario.careerId,
      order: scenario.order,
      title: scenario.title,
      coverWord: scenario.coverWord,
      company: resolved.company,
      npc: resolved.npc,
      difficulty: scenario.difficulty,
      estMinutes: scenario.estMinutes,
      maxXp: scenario.maxXp,
      stageCount: scenario.stages.length,
      map: scenario.map,
      status: scenarioStatus(core, scenario, objectives),
      objectiveId: objective?.id ?? null,
      xpEarned: objective?.xpEarned ?? 0,
      timeSpentSec: objective?.timeSpentSec ?? 0,
      performance: overallLevel(objective?.performance ?? null),
    };
  });
}

export function scenarioDetail(core: Core, id: string): ScenarioDetail {
  const resolved = core.content.resolveScenario(id);
  if (!resolved) throw notFound("Scenario not found.");
  return { ...resolved.scenario, company: resolved.company, npc: resolved.npc };
}
