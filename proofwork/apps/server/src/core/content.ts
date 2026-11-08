// Read-only index over authored content. The default source is @pw/content, loaded lazily so tests can inject fixtures.
import type { Career, Company, Job, Npc, Scenario, Training } from "@pw/shared";

export interface ContentSource {
  careers: Career[];
  companies: Company[];
  npcs: Npc[];
  scenarios: Scenario[];
  trainings: Training[];
  jobs: Job[];
}

export interface ResolvedScenario {
  scenario: Scenario;
  company: Company;
  npc: Npc;
}

export interface ContentIndex extends ContentSource {
  getCareer(id: string): Career | undefined;
  getCompany(id: string): Company | undefined;
  getNpc(id: string): Npc | undefined;
  getScenario(id: string): Scenario | undefined;
  getTraining(id: string): Training | undefined;
  getJob(id: string): Job | undefined;
  scenariosForCareer(careerId: string): Scenario[];
  previousScenario(scenario: Scenario): Scenario | undefined;
  trainingsForCareer(careerId: string): Training[];
  resolveScenario(id: string): ResolvedScenario | undefined;
}

function indexBy<T extends { id: string }>(items: T[]): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]));
}

export function buildContentIndex(source: ContentSource): ContentIndex {
  const careers = indexBy(source.careers);
  const companies = indexBy(source.companies);
  const npcs = indexBy(source.npcs);
  const scenarios = indexBy(source.scenarios);
  const trainings = indexBy(source.trainings);
  const jobs = indexBy(source.jobs);

  const scenariosForCareer = (careerId: string): Scenario[] =>
    source.scenarios.filter((s) => s.careerId === careerId).sort((a, b) => a.order - b.order);

  return {
    ...source,
    getCareer: (id) => careers.get(id),
    getCompany: (id) => companies.get(id),
    getNpc: (id) => npcs.get(id),
    getScenario: (id) => scenarios.get(id),
    getTraining: (id) => trainings.get(id),
    getJob: (id) => jobs.get(id),
    scenariosForCareer,
    previousScenario: (scenario) => scenariosForCareer(scenario.careerId).find((s) => s.order === scenario.order - 1),
    trainingsForCareer: (careerId) => source.trainings.filter((t) => t.recommendedFor.includes(careerId)),
    resolveScenario: (id) => {
      const scenario = scenarios.get(id);
      if (!scenario) return undefined;
      const company = companies.get(scenario.companyId);
      const npc = npcs.get(scenario.npcId);
      if (!company || !npc) return undefined;
      return { scenario, company, npc };
    },
  };
}

export async function loadDefaultContent(): Promise<ContentSource> {
  const content = await import("@pw/content");
  return {
    careers: content.careers,
    companies: content.companies,
    npcs: content.npcs,
    scenarios: content.scenarios,
    trainings: content.trainings,
    jobs: content.jobs,
  };
}
