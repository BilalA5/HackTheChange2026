// End-to-end walk through the whole learning loop against a running server, using the real content.
// Usage: PW_SERVER_URL=http://127.0.0.1:8787 npx tsx scripts/e2e-api.ts
import { getScenario } from "@pw/content";
import type { Objective, FtuxView, ScenarioCard } from "@pw/shared";

const BASE = (process.env.PW_SERVER_URL ?? "http://127.0.0.1:8787") + "/api";
let token = "";
const log = (...a: unknown[]) => console.log("•", ...a);

async function call<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(BASE + path, {
    method,
    headers: { ...(body === undefined ? {} : { "content-type": "application/json" }), ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${JSON.stringify(data)}`);
  return data as T;
}

const health = await call<{ aiMode: string }>("GET", "/health");
log("health", health.aiMode);
const login = await call<{ token: string; user: { id: string } }>("POST", "/auth/login", { email: `e2e+${Date.now()}@example.com`, name: "Avery Test" });
token = login.token;

// Onboarding
let view = await call<FtuxView>("POST", "/onboarding/session-start");
const turn = (t: unknown) => call<FtuxView>("POST", "/onboarding/session-turn", { sessionId: view.sessionId, turn: t });
view = await turn({ kind: "CONTINUE" });
for (const answer of ["AI Engineer", "Startup", "Remote", "3 months"]) view = await turn({ kind: "MESSAGE", text: answer });
log("ftux step after chat:", view.step, "board:", JSON.stringify(view.board));
view = await turn({ kind: "SELECT_CAREER", careerId: "ai-engineer" });
view = await turn({ kind: "CONTINUE" });
view = await turn({ kind: "WHY", text: "I want to ship real AI products." });
view = await turn({ kind: "CLAIM" });
log("ftux final step:", view.step);

const cards = await call<ScenarioCard[]>("GET", "/scenarios");
log("cards:", cards.map((c) => `${c.order}:${c.status}`).join(" "));
const scenario = getScenario(cards[0].id)!;
let obj = await call<Objective>("POST", "/objectives", { scenarioId: scenario.id });

// Kickoff: write notes from the rubric points
for (const seg of scenario.kickoff.segments) {
  obj = await call<Objective>("POST", `/objectives/${obj.id}/kickoff/watched`, { segmentId: seg.id });
  const weak = await call<{ verdict: { accepted: boolean } }>("POST", `/objectives/${obj.id}/kickoff/notes-check`, { segmentId: seg.id, text: "Some notes." });
  const text = seg.rubricPoints.map((p) => `- ${p}.`).join("\n");
  const good = await call<{ verdict: { accepted: boolean; xp: number; missing: string[] } }>("POST", `/objectives/${obj.id}/kickoff/notes-check`, { segmentId: seg.id, text });
  log(`note ${seg.noteSection}: weak=${weak.verdict.accepted} good=${good.verdict.accepted} xp=${good.verdict.xp} missing=${good.verdict.missing.length}`);
}
const ask = await call<{ answer: string }>("POST", `/objectives/${obj.id}/kickoff/ask`, { segmentId: scenario.kickoff.segments[0].id, question: "What is the biggest risk?" });
log("ask:", ask.answer.slice(0, 90));
obj = await call<Objective>("POST", `/objectives/${obj.id}/kickoff/complete`);
log("phase", obj.phase, "held", obj.xpHeld);

// Proof of understanding
await call("POST", `/objectives/${obj.id}/pou/start`);
for (let i = 0; i < 8; i++) {
  const q = scenario.pou[obj.pou.questionIndex];
  if (!q) break;
  const r = await call<{ status: string; objective: Objective; reaction: { text: string } }>("POST", `/objectives/${obj.id}/pou/answer`, {
    transcript: `So my understanding is this. ${q.rubricPoints.join(". ")}. That is how I would approach it and why it matters for the team.`,
  });
  obj = r.objective;
  log(`pou answer → ${r.status}: ${r.reaction.text.slice(0, 80)}`);
  if (r.status === "passed") break;
}
log("phase", obj.phase, "xpEarned", obj.xpEarned, "held", obj.xpHeld);

// Stages
for (const stage of scenario.stages) {
  if (stage.kind === "presentation") {
    const r = await call<{ evaluation: { overall: string; passed: boolean; xp: number }; objective: Objective }>("POST", `/objectives/${obj.id}/stages/${stage.id}/presentation`, {
      transcript: `Today I present ${scenario.title}. ${scenario.deliverables.map((d) => d.title + ": " + d.description).join(" ")} ${stage.requirements.join(". ")}.`,
      durationSec: 300,
      framingScore: 0.8,
      slidesCovered: 5,
    });
    obj = r.objective;
    log(`presentation → ${r.evaluation.overall} passed=${r.evaluation.passed} xp=${r.evaluation.xp}`);
    continue;
  }
  obj = await call<Objective>("POST", `/objectives/${obj.id}/stages/${stage.id}/start`);
  await call("POST", `/objectives/${obj.id}/stages/${stage.id}/plan`, { message: "Hi! What does done look like for this stage?" });
  const plan = await call<{ objective: Objective }>("POST", `/objectives/${obj.id}/stages/${stage.id}/plan`, { message: "Sounds good, let's do it." });
  const sp = plan.objective.stages[stage.id];
  await call("POST", `/objectives/${obj.id}/stages/${stage.id}/learn/chat`, { message: stage.learn[0].title + "?" });
  const sub = await call<{ evaluation: { overall: string; passed: boolean; xp: number; rubric: Record<string, { level: string }> }; objective: Objective }>(
    "POST",
    `/objectives/${obj.id}/stages/${stage.id}/submit`,
    { submissions: [{ kind: stage.submission.kinds.includes("text") ? "text" : stage.submission.kinds[0], value: stage.submission.kinds.includes("text") ? `Here is what I did. ${stage.requirements.join(". ")}. I tested each part and wrote up the tradeoffs.` : "https://github.com/example/repo" }] },
  );
  obj = sub.objective;
  log(`stage ${stage.order} plan=${sp.planComplete} reqs=${sp.agreedRequirements.length} todos=${sp.todos.length} → ${sub.evaluation.overall} passed=${sub.evaluation.passed} xp=${sub.evaluation.xp} [${Object.values(sub.evaluation.rubric).map((x) => x.level[0]).join("")}]`);
}
log("objective", obj.status, obj.phase, "xpEarned", obj.xpEarned);

const progress = await call<{ xp: number; level: number; heldXp: number; completedScenarios: number }>("GET", "/progress");
log("progress", JSON.stringify(progress).slice(0, 160));
const credits = await call<{ balance: number; usageByCategory: unknown }>("GET", "/credits");
log("credits", credits.balance, JSON.stringify(credits.usageByCategory));
const cards2 = await call<ScenarioCard[]>("GET", "/scenarios");
log("cards after:", cards2.map((c) => `${c.order}:${c.status}`).join(" "));
const jobs = await call<{ unlocked: boolean; jobs: { id: string; autoApplicable: boolean }[] }>("GET", "/jobs");
log("jobs unlocked", jobs.unlocked, jobs.jobs.length);
const job = jobs.jobs.find((j) => j.autoApplicable)!;
const app = await call<{ answers: Record<string, string>; guessed: string[] }>("POST", `/jobs/${job.id}/applications`);
log("application keys", Object.keys(app.answers).join(","), "guessed", app.guessed.join(","));
const portfolio = await call<{ unlocked: boolean; headline: string; projects: unknown[] }>("GET", "/portfolio");
log("portfolio", portfolio.unlocked, portfolio.headline, portfolio.projects.length);
const coach = await call<{ reply: { text: string } }>("POST", "/coach/chat", { message: "What should I focus on?" });
log("coach:", coach.reply.text.slice(0, 90));
const notes = await call<{ title: string }[]>("GET", "/notifications");
log("notifications:", notes.map((n) => n.title).join(" | "));
console.log("E2E OK");
