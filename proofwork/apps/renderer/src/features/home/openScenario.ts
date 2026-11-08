// Start or resume a project from the Home carousel: create the objective if needed, then pick the route.
import type { ScenarioCard } from "@pw/shared";
import { api, invalidate } from "@/lib/api";
import { routeForObjective } from "./model";

/**
 * Returns the route for a project. With no objective yet, POST /objectives creates one (and the
 * scenario list is refetched so the card shows its new state). Throws ApiError on failure.
 */
export async function resolveScenarioRoute(card: Pick<ScenarioCard, "id" | "objectiveId">): Promise<string> {
  if (card.objectiveId) {
    const objective = await api("GET /objectives/:id", { params: { id: card.objectiveId } });
    return routeForObjective(objective);
  }
  const objective = await api("POST /objectives", { body: { scenarioId: card.id } });
  invalidate("GET /scenarios");
  return routeForObjective(objective);
}
