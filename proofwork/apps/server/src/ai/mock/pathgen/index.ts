// Practice-mode path generator: a deterministic, template-based career path for any role a learner types.
// Same input (idPrefix + request) always gives the same path. No model calls, no clocks, no Math.random.
import type { Career, CareerPack } from "@pw/shared";
import { validateCareerPack, validateJobs } from "@pw/content";
import type { GeneratePathInput, GeneratedPath } from "../../../contracts.ts";
import { buildCompanies, buildNpcs, pickCompanyNames } from "./cast.ts";
import { buildJobs } from "./jobs.ts";
import { buildProfile } from "./profile.ts";
import { recommendTrainings } from "./recommend.ts";
import { buildScenarios } from "./scenarios.ts";
import { createRng, stableStringify } from "./rng.ts";
import type { GenCtx, Profile } from "./types.ts";
import { listOf, lowerFirst, trimWords } from "./util.ts";

export { recommendTrainings } from "./recommend.ts";

/** Career-level copy: title, tagline, description, skills and colour. */
function buildCareer(ctx: GenCtx): Career {
  const { rng, prof, idPrefix } = ctx;
  const skills = rng.sample(prof.family.skills, rng.int(6, 8));
  const tools = rng.sample(prof.family.tools, 3);
  const goal = prof.why
    ? `Your reason for this path: ${prof.why}.`
    : prof.request.timeline
      ? `Your goal is to be ready for a ${prof.roleLower} role within ${trimWords(prof.request.timeline, 6)}.`
      : `Your goal is to be ready for a ${prof.roleLower} role.`;
  return {
    id: idPrefix,
    title: prof.role,
    tagline: `Practice ${prof.roleLower} work at three ${lowerFirst(prof.industry)} companies, from first brief to manager review.`,
    description: `Working as a ${prof.roleLower} in ${lowerFirst(prof.industry)} means ${prof.family.label} with real numbers, real constraints and a manager who asks for the reasoning. Your three projects follow a diagnosis, a build and a rollout, using ${listOf(tools)} the way teams use them. ${goal}`,
    skills,
    color: prof.family.color,
    generated: true,
  };
}

/** Builds a complete, validated career path for one learner's request. Throws if the result would be invalid. */
export function generatePathPractice(input: GeneratePathInput): GeneratedPath {
  const { request, idPrefix, trainings } = input;
  const rng = createRng(`${idPrefix}|${stableStringify(request)}`);
  const prof: Profile = buildProfile(request);
  const ctx: GenCtx = { rng, idPrefix, prof };

  const career = buildCareer(ctx);
  const names = pickCompanyNames(rng, prof.domain, 8);
  const companies = buildCompanies(ctx, names.slice(0, 3));
  const npcs = buildNpcs(ctx, companies, new Set<string>());
  const scenarios = buildScenarios(ctx, companies, npcs);
  const pack: CareerPack = { career, companies, npcs, scenarios };
  const jobs = buildJobs(ctx, career.id, names.slice(3));

  const problems = [...validateCareerPack(pack), ...validateJobs(jobs, [career.id])];
  if (problems.length > 0) {
    throw new Error(`pathgen produced an invalid path for "${prof.role}": ${problems.join("; ")}`);
  }

  return {
    pack,
    jobs,
    recommendedTrainingIds: recommendTrainings(request, trainings, career.skills),
    engine: "practice",
  };
}
