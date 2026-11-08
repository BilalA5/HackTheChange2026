// Live engine: same method signatures as the mock. Every call that fails or is refused logs a short
// warning and falls back to the deterministic mock, so the app never breaks.
import type { AiEngine } from "../../contracts.ts";
import { describeError, type Llm, type Models } from "../llm.ts";
import { createMockEngine } from "../mock/index.ts";
import { checkNoteLive, answerKickoffLive, judgePouLive } from "./kickoff.ts";
import { planTurnLive, learnChatLive } from "./plan.ts";
import { gradePresentationLive, gradeSubmissionLive } from "./grade.ts";
import { coachReplyLive, supportReplyLive, draftApplicationLive, portfolioBioLive } from "./writing.ts";
import { coworkTurnLive } from "./cowork.ts";

async function attempt<T>(name: string, live: () => Promise<T>, fallback: () => T | Promise<T>): Promise<T> {
  try {
    return await live();
  } catch (err) {
    console.warn(`[ai] live ${name} failed, using mock: ${describeError(err)}`);
    return await fallback();
  }
}

export function createLiveEngine(models: Models, llm: Llm): AiEngine {
  const mock = createMockEngine(models);

  return {
    mode: "live",
    models,

    checkNote: (i) => attempt("checkNote", () => checkNoteLive(llm, i), () => mock.checkNote(i)),

    answerKickoffQuestion: (i) => attempt("answerKickoffQuestion", () => answerKickoffLive(llm, i), () => mock.answerKickoffQuestion(i)),

    judgePou: (i) => attempt("judgePou", () => judgePouLive(llm, i), () => mock.judgePou(i)),

    planTurn: (i) => attempt("planTurn", () => planTurnLive(llm, i), () => mock.planTurn(i)),

    learnChat: (i) => attempt("learnChat", () => learnChatLive(llm, i), () => mock.learnChat(i)),

    gradeSubmission: (i) => attempt("gradeSubmission", () => gradeSubmissionLive(llm, i), () => mock.gradeSubmission(i)),

    gradePresentation: (i) => attempt("gradePresentation", () => gradePresentationLive(llm, i), () => mock.gradePresentation(i)),

    // Onboarding is a deterministic state machine in both modes; see mock/ftux.ts.
    ftuxTurn: (i) => mock.ftuxTurn(i),
    ftuxStart: (i) => mock.ftuxStart(i),

    coachReply: (i) => attempt("coachReply", () => coachReplyLive(llm, i), () => mock.coachReply(i)),

    supportReply: (i) => attempt("supportReply", () => supportReplyLive(llm, i), () => mock.supportReply(i)),

    draftApplication: (i) =>
      attempt(
        "draftApplication",
        async () => draftApplicationLive(llm, i, await mock.draftApplication(i)),
        () => mock.draftApplication(i),
      ),

    portfolioBio: (i) => attempt("portfolioBio", () => portfolioBioLive(llm, i), () => mock.portfolioBio(i)),

    coworkTurn: async (i) => {
      // Once text has streamed, a mock retry would duplicate it in the UI; return what arrived instead.
      let emitted = "";
      try {
        return await coworkTurnLive(
          llm,
          {
            scenario: i.scenario,
            stage: i.stage,
            npc: i.npc,
            learnerName: i.learnerName,
            agreedRequirements: i.agreedRequirements,
            todos: i.todos,
            history: i.history,
            input: i.input,
            screenshot: i.screenshot,
            focusedApp: i.focusedApp,
            windowTitle: i.windowTitle,
            tier: i.tier,
          },
          (d) => {
            emitted += d;
            i.onDelta(d);
          },
        );
      } catch (err) {
        console.warn(`[ai] live coworkTurn failed: ${describeError(err)}`);
        if (emitted === "") return mock.coworkTurn(i);
        return { text: emitted.trim() };
      }
    },
  };
}
