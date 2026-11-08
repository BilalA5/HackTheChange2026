// The people and organisations around a generated path: scenario companies, their managers, and job companies.
import type { Company, Npc } from "@pw/shared";
import { COMPANY_FIRST_PARTS } from "./industries.ts";
import { BUILDINGS, CARES, COMPANY_COLORS, FIRST_NAMES, LAST_NAMES, PUSHBACK, TRAITS } from "./names.ts";
import type { CompanyType, Domain, GenCtx, Profile } from "./types.ts";
import { commas, slugify } from "./util.ts";
import type { Rng } from "./rng.ts";

const CULTURE: Record<CompanyType, string[]> = {
  startup: [
    "We are small, so you will see every decision, and nobody is going to hand you a spec.",
    "There is no committee here to hide behind, so if the number is wrong, we will both feel it.",
    "Speed matters, but a fast wrong answer costs us more than a slower right one.",
  ],
  scaleup: [
    "We have grown fast, so our processes are still catching up, and you will need to write things down.",
    "We are big enough to have real customers and small enough that one change ripples everywhere.",
    "Our teams have doubled this year, so old habits are being rewritten, and your work will help decide how.",
  ],
  enterprise: [
    "We are a large organization, so approvals take time, and every number needs a named owner.",
    "Nothing at this size is a one-person decision, so build your case for the people who have to sign it.",
    "With this many people involved, a vague handoff is expensive, so be explicit about who owns what.",
  ],
  nonprofit: [
    "We run on grants and volunteer time, so every hour and every dollar has to show a result.",
    "Our mission is the reason we exist, so we judge work by who it helps and whether we can measure that.",
    "We have a limited budget, so the cheapest test that answers the question is usually the right one.",
  ],
};

/** One culture sentence, chosen by the rng. Changes with company type. */
export function cultureLine(prof: Profile, rng: Rng): string {
  return rng.pick(CULTURE[prof.companyType]);
}

/** "our Calgary office" when a location is known, otherwise a remote line. */
export function locationLine(prof: Profile): string {
  if (prof.locationShort) return `Part of the team sits in our ${prof.locationShort} office, so ask them for context if you need it.`;
  return "The whole team is remote across time zones, so write things down where others can read them.";
}

/** Opening noun phrase for a company tagline. Sized by company type. */
function sizeOf(prof: Profile, rng: Rng): string {
  switch (prof.companyType) {
    case "startup":
      return `Startup with ${rng.int(20, 80)} people`;
    case "scaleup":
      return `Scale-up with ${rng.int(200, 900)} people`;
    case "enterprise":
      return `Enterprise with ${commas(rng.int(5000, 25000))} people`;
    case "nonprofit":
      return "Mission-driven non-profit";
  }
}

/** Three distinct fictional company names for a domain. Never real brands. */
export function pickCompanyNames(rng: Rng, domain: Domain, count: number): string[] {
  const firsts = rng.shuffle(COMPANY_FIRST_PARTS);
  const suffixes = rng.shuffle(domain.suffixes);
  const names: string[] = [];
  for (let i = 0; names.length < count; i++) {
    const name = `${firsts[i % firsts.length]} ${suffixes[i % suffixes.length]}`;
    if (!names.includes(name)) names.push(name);
  }
  return names;
}

function glyphOf(name: string): string {
  const words = name.split(" ").filter(Boolean);
  const g = words.length > 1 ? `${words[0][0]}${words[1][0]}` : name.slice(0, 2);
  return g.toUpperCase();
}

export function pickPersonName(rng: Rng, used: Set<string>): string {
  for (let i = 0; i < 500; i++) {
    const name = `${rng.pick(FIRST_NAMES)} ${rng.pick(LAST_NAMES)}`;
    if (!used.has(name)) {
      used.add(name);
      return name;
    }
  }
  throw new Error("pathgen: name pool exhausted");
}

/** Builds one company per name, with distinct colours and buildings. */
export function buildCompanies(ctx: GenCtx, names: string[]): Company[] {
  const { rng, prof } = ctx;
  const colors = rng.sample(COMPANY_COLORS, names.length);
  const buildings = rng.sample(BUILDINGS, names.length);
  return names.map((name, i) => {
    const remote = !prof.location || /^remote$/i.test(prof.location);
    const place = remote ? ", fully remote" : `, based in ${prof.location}`;
    const size = sizeOf(prof, rng);
    const product = rng.pick(prof.domain.products);
    return {
      id: `${ctx.idPrefix}-c${i + 1}`,
      name,
      industry: prof.industry,
      tagline: `${size} ${prof.domain.offer}, built around the ${product}${place}.`,
      color: colors[i],
      glyph: glyphOf(name),
      building: buildings[i],
    };
  });
}

/** One manager per company. Titles come from the family ladder, one level above the learner. */
export function buildNpcs(ctx: GenCtx, companies: Company[], used: Set<string>): Npc[] {
  const { rng, prof } = ctx;
  const ladder = prof.family.managerTitles;
  const level = prof.level.idx;
  return companies.map((company, i) => {
    const name = pickPersonName(rng, used);
    const first = name.split(" ")[0];
    const titleIdx = i === 1 ? Math.min(level + 1, ladder.length - 1) : level;
    const team = prof.family.teams[i % prof.family.teams.length];
    const [t1, t2] = rng.sample(TRAITS, 2);
    return {
      id: `${ctx.idPrefix}-n${i + 1}`,
      name,
      role: `${ladder[titleIdx]}, ${team}`,
      companyId: company.id,
      personality: `${first} is ${t1}, and ${t2}. ${first} cares most about ${rng.pick(CARES)}, and pushes back when ${rng.pick(PUSHBACK)}.`,
      voice: { rate: rng.float(0.92, 1.08), pitch: rng.float(0.85, 1.15) },
      avatarSeed: slugify(name),
    };
  });
}
