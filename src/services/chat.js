import { getScenario } from '@/data/scenarios/index.js';

const normalize = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9%$ ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function typingDelay(text) {
  return 600 + Math.min(1800, text.length * 12);
}

function mentions(said, words, keyword) {
  return keyword.includes(' ') ? said.includes(keyword) : words.has(keyword);
}

function pickReply(persona, text, history) {
  const said = normalize(text);
  const words = new Set(said.split(' '));

  const scripted = persona.script.find((line) => normalize(line.say) === said);
  if (scripted) return scripted.reply;

  let best = null;
  let bestScore = 0;
  for (const reply of persona.replies) {
    const score = reply.keywords.reduce(
      (total, keyword) => (mentions(said, words, keyword) ? total + keyword.length : total),
      0,
    );
    if (score > bestScore) {
      best = reply;
      bestScore = score;
    }
  }
  if (best) return best.text;

  const repliesSoFar = history.filter((message) => message.from === 'them').length;
  return persona.fallbacks[repliesSoFar % persona.fallbacks.length];
}

/**
 * Local stand-in for POST /api/chat. Returns the persona's reply to `text`, given the conversation so far.
 * A backend (scripted or model-driven) can replace this without changing callers.
 */
export async function requestReply({ scenarioId, persona, text, history }) {
  const scenario = getScenario(scenarioId);
  if (!scenario) throw new Error(`Unknown scenario: ${scenarioId}`);
  const reply = pickReply(scenario[persona], text, history);
  await wait(typingDelay(reply));
  return reply;
}

export async function requestReview({ scenarioId }) {
  const scenario = getScenario(scenarioId);
  if (!scenario) throw new Error(`Unknown scenario: ${scenarioId}`);
  await wait(1600);
  return scenario.review;
}
