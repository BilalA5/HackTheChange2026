// Adapter from the core services to the ServerContext the AI co-worker socket expects.
import type { ServerContext } from "../contracts.ts";
import { debit } from "./services/credits.ts";
import { notify } from "./services/notifications.ts";
import { awardXp } from "./services/progress.ts";
import { findObjective, findObjectiveByScenario, saveObjective } from "./services/objective-store.ts";
import { findUser } from "./services/users.ts";
import { userIdFromToken } from "./services/auth.ts";
import type { Core } from "./types.ts";

export function createServerContext(core: Core): ServerContext {
  return {
    ai: core.ai,
    verifyToken: async (token) => {
      const userId = await userIdFromToken(core, token);
      return userId ? { userId } : null;
    },
    getUser: (userId) => findUser(core.db, userId),
    getObjective: (userId, objectiveId) => findObjective(core.db, userId, objectiveId),
    saveObjective: (userId, objective) => saveObjective(core.db, userId, objective),
    debit: (userId, action, reason) => debit(core, userId, action, reason),
    awardXp: (userId, amount, reason, scenarioId, held) => {
      awardXp(core, userId, amount, reason, scenarioId, held ?? false);
      // Keep the objective's running totals in step with XP awarded outside the REST routes (e.g. the co-worker).
      const objective = scenarioId ? findObjectiveByScenario(core.db, userId, scenarioId) : null;
      if (objective) {
        if (held) objective.xpHeld += amount;
        else objective.xpEarned += amount;
        saveObjective(core.db, userId, objective);
      }
    },
    notify: (userId, item) => {
      notify(core, userId, item);
    },
    log: (msg, extra) => core.log(msg, extra),
  };
}
