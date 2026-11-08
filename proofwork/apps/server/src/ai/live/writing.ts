// Live: coach, support, application drafting and portfolio bio (fast tier).
import type { ChatMessage, Job, Portfolio, User } from "@pw/shared";
import type { LlmClient } from "../llm.ts";
import { clip, obj, str } from "./common.ts";

const COACH_SYSTEM = `
You are a warm, practical career coach inside Proofwork, a job simulation app.
Reply in 2 to 5 sentences. Be specific to what the learner said and to their progress. Offer one concrete next step.
Never promise job offers, salaries or outcomes. Never give personalised financial advice.
`.trim();

export async function coachReplyLive(
  llm: LlmClient,
  i: { user: User; history: ChatMessage[]; message: string; progressSummary: string },
): Promise<string> {
  const history = i.history
    .slice(-10)
    .map((m) => `${m.role === "npc" ? "Coach" : "Learner"}: ${clip(m.text, 400)}`)
    .join("\n");
  const text = await llm.complete({
    tier: "fast",
    system: COACH_SYSTEM,
    content: `Learner: ${i.user.name}. Target role: ${i.user.vision?.targetRole ?? "not set"}.\nProgress: ${clip(i.progressSummary, 800) || "just starting"}\n\n${history ? `Recent chat:\n${history}\n\n` : ""}Learner says: ${clip(i.message, 800)}`,
    maxTokens: 400,
  });
  return text.trim();
}

const SUPPORT_SYSTEM = `
You are the Proofwork support assistant. Help the learner describe their problem clearly and gather the facts the team needs
(which screen, what they clicked, what they expected). Reply in 2 to 4 sentences, friendly and concrete.
Always end by saying that a human from the team reads every thread within one business day.
Do not promise fixes, refunds or timelines beyond that.
`.trim();

export async function supportReplyLive(llm: LlmClient, i: { user: User; history: ChatMessage[]; message: string }): Promise<string> {
  const history = i.history
    .slice(-10)
    .map((m) => `${m.role === "npc" ? "Support" : "Learner"}: ${clip(m.text, 400)}`)
    .join("\n");
  const text = await llm.complete({
    tier: "fast",
    system: SUPPORT_SYSTEM,
    content: `${history ? `Thread so far:\n${history}\n\n` : ""}Learner message: ${clip(i.message, 1200)}`,
    maxTokens: 400,
  });
  return text.trim();
}

const APPLY_SYSTEM = `
You draft a job application for a learner from their real Proofwork portfolio and profile.
Rules:
- Use only facts present in the profile, the portfolio projects and the job posting. Never invent employers, dates, degrees or numbers.
- Answer every field. For each answer set "guessed": true when you inferred it rather than copying a profile fact.
- For select fields, choose one of the given options verbatim.
- Textarea answers are 2 to 4 sentences that cite specific portfolio projects.
- The cover letter is about 150 words, first person, specific to the job, with no greeting placeholders.
`.trim();

const APPLY_SCHEMA = {
  type: "object",
  properties: {
    answers: {
      type: "array",
      items: {
        type: "object",
        properties: {
          key: { type: "string" },
          value: { type: "string" },
          guessed: { type: "boolean" },
        },
        required: ["key", "value", "guessed"],
        additionalProperties: false,
      },
    },
    coverLetter: { type: "string" },
  },
  required: ["answers", "coverLetter"],
  additionalProperties: false,
};

export async function draftApplicationLive(
  llm: LlmClient,
  i: { job: Job; user: User; portfolio: Portfolio },
  fallback: { answers: Record<string, string>; guessed: string[]; coverLetter: string },
): Promise<{ answers: Record<string, string>; guessed: string[]; coverLetter: string }> {
  const { job, user, portfolio } = i;
  const projects = portfolio.projects
    .map((p) => `- ${p.title} (${p.company}, ${p.overall}): ${p.summary}`)
    .join("\n");
  const fields = job.applyFields
    .map((f) => `- key "${f.key}" (${f.type}${f.required ? ", required" : ""}): ${f.label}${f.options ? ` options: ${f.options.join(" | ")}` : ""}`)
    .join("\n");
  const raw = await llm.json({
    tier: "fast",
    system: APPLY_SYSTEM,
    content: [
      `Job: ${job.title} at ${job.company} (${job.location}${job.remote ? ", remote" : ""}). ${job.description}`,
      `Requirements: ${job.requirements.join("; ")}`,
      `Applicant: ${user.name} <${user.email}>. Target role: ${user.vision?.targetRole ?? "not set"}. Location: ${user.vision?.location ?? "not set"}. Timeline: ${user.vision?.timeline ?? "not set"}.`,
      `Portfolio headline: ${portfolio.headline}\nBio: ${portfolio.bio}\nSkills: ${portfolio.skills.join(", ")}\nProjects:\n${projects || "(none yet)"}`,
      `Fields to answer:\n${fields}`,
      `Portfolio URL: https://proofwork.app/p/${portfolio.shareSlug}`,
    ].join("\n\n"),
    schema: APPLY_SCHEMA,
    maxTokens: 2000,
    validate: (v) => {
      const o = obj(v, "application draft");
      if (!Array.isArray(o.answers)) throw new Error("invalid answers");
      const answers: Record<string, string> = {};
      const guessed = new Set<string>();
      for (const item of o.answers) {
        const a = obj(item, "answer");
        const key = str(a.key, "answer key", 120);
        if (!job.applyFields.some((f) => f.key === key)) continue;
        answers[key] = typeof a.value === "string" ? a.value.slice(0, 3000) : "";
        if (a.guessed === true) guessed.add(key);
      }
      // Anything the model skipped comes from the deterministic draft, marked as guessed.
      for (const f of job.applyFields) {
        if (!answers[f.key]?.trim() && fallback.answers[f.key]) {
          answers[f.key] = fallback.answers[f.key];
          guessed.add(f.key);
        }
      }
      return { answers, guessed: [...guessed], coverLetter: str(o.coverLetter, "coverLetter", 4000) };
    },
  });
  return raw;
}

const BIO_SYSTEM = `
You write a short portfolio headline and bio for a learner, from their completed simulated projects only.
Headline: under 12 words. Bio: 2 to 3 sentences, first or third person, no superlatives, no invented facts.
`.trim();

export async function portfolioBioLive(
  llm: LlmClient,
  i: { user: User; projects: Portfolio["projects"] },
): Promise<{ headline: string; bio: string }> {
  const projects = i.projects.map((p) => `- ${p.title} (${p.company}, ${p.overall}): ${p.summary}`).join("\n");
  return llm.json({
    tier: "fast",
    system: BIO_SYSTEM,
    content: `Name: ${i.user.name}. Target role: ${i.user.vision?.targetRole ?? "not set"}. Industry: ${i.user.vision?.industry ?? "not set"}.\nProjects:\n${projects || "(none yet)"}`,
    schema: {
      type: "object",
      properties: { headline: { type: "string" }, bio: { type: "string" } },
      required: ["headline", "bio"],
      additionalProperties: false,
    },
    maxTokens: 400,
    validate: (v) => {
      const o = obj(v, "bio");
      return { headline: str(o.headline, "headline", 160), bio: str(o.bio, "bio", 800) };
    },
  });
}
