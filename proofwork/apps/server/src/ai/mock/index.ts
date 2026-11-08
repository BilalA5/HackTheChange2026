// Deterministic offline engine. Used for practice mode and as the fallback for every live call.
import type { AiEngine } from "../../contracts.ts";
import type { Models } from "../llm.ts";
import { answerKickoffMock, checkNoteMock, judgePouMock } from "./kickoff.ts";
import { learnChatMock, planTurnMock } from "./plan.ts";
import { gradePresentationMock, gradeSubmissionMock } from "./grade.ts";
import { ftuxStartMock, ftuxTurnMock } from "./ftux.ts";
import { coachReplyMock, draftApplicationMock, portfolioBioMock, supportReplyMock } from "./writing.ts";
import { coworkTurnMock } from "./cowork.ts";

export function createMockEngine(models: Models): AiEngine {
  return {
    mode: "mock",
    models,

    async checkNote(i) {
      return checkNoteMock(i.segment, i.text);
    },

    async answerKickoffQuestion(i) {
      return answerKickoffMock(i);
    },

    async judgePou(i) {
      return judgePouMock({ question: i.question, transcript: i.transcript, isFollowUp: i.isFollowUp });
    },

    async planTurn(i) {
      const r = planTurnMock({ stage: i.stage, scenario: i.scenario, history: i.history, message: i.message });
      return r;
    },

    async learnChat(i) {
      return learnChatMock({ stage: i.stage, message: i.message });
    },

    async gradeSubmission(i) {
      return gradeSubmissionMock(i);
    },

    async gradePresentation(i) {
      return gradePresentationMock(i);
    },

    async ftuxTurn(i) {
      return ftuxTurnMock(i);
    },

    ftuxStart(i) {
      return ftuxStartMock({ sessionId: i.sessionId });
    },

    async coachReply(i) {
      return coachReplyMock(i);
    },

    async supportReply(i) {
      return supportReplyMock(i);
    },

    async draftApplication(i) {
      return draftApplicationMock(i);
    },

    async portfolioBio(i) {
      return portfolioBioMock(i);
    },

    async coworkTurn(i) {
      return coworkTurnMock(i);
    },
  };
}
