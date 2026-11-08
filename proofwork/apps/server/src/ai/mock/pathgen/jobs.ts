// Five fictional jobs around a generated path, on a seniority ladder centred on the learner's level.
import type { Job, JobApplyField } from "@pw/shared";
import type { GenCtx } from "./types.ts";
import { money } from "./util.ts";

const SENIORITY_MULT = [0.75, 0.95, 1.15, 1.4, 1.7];
const YEARS = ["Less than 1 year", "1 to 3 years", "4 to 6 years", "7 or more years"];

/** Salary band for a ladder position, in USD (or CAD for Canadian locations). */
export function salaryFor(payK: number, position: number, canadian: boolean): string {
  const fx = canadian ? 1.35 : 1;
  const base = payK * 1000 * SENIORITY_MULT[position] * fx;
  const low = Math.round((base * 0.92) / 1000) * 1000;
  const high = Math.round((base * 1.08) / 1000) * 1000;
  return `${money(low)} to ${money(high)} ${canadian ? "CAD" : "USD"}`;
}

function ladderTitle(position: number, role: string): string {
  return [`Junior ${role}`, role, `Senior ${role}`, `Lead ${role}`, `${role} Manager`][position];
}

export function buildJobs(ctx: GenCtx, careerId: string, companyNames: string[]): Job[] {
  const { rng, prof, idPrefix } = ctx;
  const fam = prof.family;
  const dom = prof.domain;
  const level = prof.level.idx;
  const clamp = (n: number) => Math.min(4, Math.max(0, n));
  const positions = [clamp(level - 1), level, level, clamp(level + 1), clamp(level + 1)];
  const notAuto = rng.int(0, 4);
  const location = prof.location ?? "Remote";
  const metricFor = (i: number) => fam.metrics[i % fam.metrics.length].name;

  return companyNames.slice(0, 5).map((company, j) => {
    const position = positions[j];
    const area = fam.teams[j % fam.teams.length];
    const tools = rng.sample(fam.tools, 2);
    const skill = rng.pick(fam.skills);
    const onSite = prof.locationShort !== undefined;
    const remote = onSite ? rng.chance(0.35) : true;
    const constraint = rng.pick(fam.constraints);
    const stakeholder = rng.pick(fam.stakeholders);
    const requirements = [
      `Hands-on experience with ${tools[0]} and ${tools[1]}`,
      `Working knowledge of ${skill.toLowerCase()}`,
      `Experience reporting on ${metricFor(j)} to a non-specialist audience`,
      `Written updates that state the numbers and the caveats`,
    ];
    if (j % 2 === 0) requirements.push(`Comfort working within this rule: ${constraint}`);
    const applyFields: JobApplyField[] = [
      { key: "full_name", label: "Full name", type: "text", required: true },
      { key: "email", label: "Email", type: "email", required: true },
      { key: "portfolio_url", label: "Portfolio or project link", type: "url", required: false },
      { key: "years_experience", label: "Years of relevant experience", type: "select", options: YEARS, required: true },
      { key: "motivation", label: `Why ${company}?`, type: "textarea", required: true },
    ];
    return {
      id: `${idPrefix}-j${j + 1}`,
      company,
      // Generic roles (teacher, lawyer, chef) have no meaningful team names, so the title stands alone.
      title: fam.id === "generic" ? ladderTitle(position, prof.role) : `${ladderTitle(position, prof.role)}, ${area}`,
      location,
      remote,
      salary: salaryFor(fam.pay, position, prof.canadian),
      careerId,
      minLevel: position,
      description: `${company} ${dom.offer}. In this role you will own ${fam.artifacts.build} work in the ${area} group and report on ${metricFor(j)} with ${stakeholder}. The team works in ${tools[0]} and ${tools[1]}, and ${constraint}.`,
      requirements,
      autoApplicable: j !== notAuto,
      applyFields,
    };
  });
}
