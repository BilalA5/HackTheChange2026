// Aggregates all authored content. Pure data: no I/O, safe to import from server, desktop and renderer.
import type { Career, Company, Job, Npc, Scenario, Training } from "@pw/shared";
import type { CareerPack } from "./types.ts";
import aiEngineer from "./careers/ai-engineer.ts";
import productManager from "./careers/product-manager.ts";
import dataAnalyst from "./careers/data-analyst.ts";
import { trainings } from "./trainings.ts";
import { jobs } from "./jobs.ts";

export type { CareerPack } from "./types.ts";
export { validateCareerPack, validateJobs, validateTrainings } from "./validate.ts";

export const careerPacks: CareerPack[] = [aiEngineer, productManager, dataAnalyst];

export const careers: Career[] = careerPacks.map((p) => p.career);
export const companies: Company[] = careerPacks.flatMap((p) => p.companies);
export const npcs: Npc[] = careerPacks.flatMap((p) => p.npcs);
export const scenarios: Scenario[] = careerPacks.flatMap((p) => p.scenarios);
export { trainings, jobs };

const byId = <T extends { id: string }>(list: T[]) => new Map(list.map((x) => [x.id, x]));
const careerMap = byId(careers);
const companyMap = byId(companies);
const npcMap = byId(npcs);
const scenarioMap = byId(scenarios);
const trainingMap = byId(trainings);
const jobMap = byId(jobs);

export const getCareer = (id: string) => careerMap.get(id);
export const getCompany = (id: string) => companyMap.get(id);
export const getNpc = (id: string) => npcMap.get(id);
export const getScenario = (id: string) => scenarioMap.get(id);
export const getTraining = (id: string) => trainingMap.get(id);
export const getJob = (id: string) => jobMap.get(id);
export const scenariosForCareer = (careerId: string) =>
  scenarios.filter((s) => s.careerId === careerId).sort((a, b) => a.order - b.order);
export const findStage = (scenarioId: string, stageId: string) =>
  getScenario(scenarioId)?.stages.find((s) => s.id === stageId);
export type { Training, Job };
