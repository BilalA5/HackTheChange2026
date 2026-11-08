// Shared prompt pieces and output validators for the live engine.
import type { Company, Npc, Scenario } from "@pw/shared";

/** Company label. The engine contract does not always pass the company, so fall back to the scenario's id. */
export function companyName(scenario: Scenario, company?: Company): string {
  if (company) return company.name;
  return scenario.companyId
    .split(/[-_]/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

/** NPC persona and scenario context. Fictional companies only. */
export function personaBlock(npc: Npc, scenario: Scenario, company?: Company): string {
  return [
    `You are ${npc.name}, ${npc.role} at ${companyName(scenario, company)}${company ? ` (${company.industry}; ${company.tagline})` : ""}.`,
    `Personality: ${npc.personality}`,
    `You are the AI manager in Proofwork, a job simulation. The learner is a new hire on a project.`,
    `Project: "${scenario.title}". Learner role: ${scenario.userRole}. Problem: ${scenario.problemStatement}`,
    `Tools in use: ${scenario.tools.join(", ")}. Skills being practised: ${scenario.skills.join(", ")}.`,
    `Stay in character. Be specific and concrete, never generic. Never mention being an AI or a model.`,
  ].join("\n");
}

export function clip(text: string, max: number): string {
  return text.length <= max ? text : `${text.slice(0, max)} [truncated]`;
}

export function str(v: unknown, name: string, max = 4000): string {
  if (typeof v !== "string" || v.trim() === "") throw new Error(`invalid ${name}`);
  return v.slice(0, max);
}

export function strArr(v: unknown, name: string, max = 10): string[] {
  if (!Array.isArray(v) || v.some((x) => typeof x !== "string")) throw new Error(`invalid ${name}`);
  return (v as string[]).slice(0, max);
}

export function obj(v: unknown, name: string): Record<string, unknown> {
  if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error(`invalid ${name}`);
  return v as Record<string, unknown>;
}

export function oneOf<T extends string>(v: unknown, options: readonly T[], name: string): T {
  if (typeof v !== "string" || !(options as readonly string[]).includes(v)) throw new Error(`invalid ${name}`);
  return v as T;
}

/** Keep only values that appear in the allowed list (guards against invented points). */
export function subsetOf(values: string[], allowed: string[]): string[] {
  const set = new Set(allowed);
  return values.filter((v) => set.has(v));
}

export const STRING_ARRAY = { type: "array", items: { type: "string" } } as const;
