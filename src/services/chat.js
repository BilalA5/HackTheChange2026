import { api, call } from './backend.js';

const normalize = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9%$ ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const typingDelay = (text) => 600 + Math.min(1800, text.length * 12);

function mentions(said, words, keyword) {
  return keyword.includes(' ') ? said.includes(keyword) : words.has(keyword);
}

function scriptedReply(persona, text, history) {
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

const briefOf = (scenario) => ({
  company: scenario.company,
  title: scenario.title,
  task: scenario.task,
  summary: scenario.summary,
  requirements: scenario.requirements.map(({ title, steps }) => ({ title, steps })),
  notes: scenario.notes.map(({ heading, items }) => ({ heading, items })),
});

const transcriptOf = (history) => history.filter((message) => message.text).map(({ from, text }) => ({ from, text }));

/**
 * The persona's reply to `text`. Scripted lines always get their written reply; anything else goes to
 * the model when a backend is available, and to keyword matching when it is not.
 */
export async function requestReply({ scenario, persona: personaKey, text, history }) {
  const persona = scenario[personaKey];
  const scripted = persona.script.some((line) => normalize(line.say) === normalize(text));

  if (!scripted) {
    try {
      const reply = await call(
        'action',
        api.ai.reply,
        {
          brief: briefOf(scenario),
          persona: { kind: personaKey, name: persona.name, style: persona.style ?? '' },
          history: transcriptOf(history),
          text,
        },
        () => null,
      );
      if (reply) return reply;
    } catch (error) {
      console.error(error);
    }
  }

  const reply = scriptedReply(persona, text, history);
  await wait(typingDelay(reply));
  return reply;
}

/** The manager's review of the learner's work, graded from the conversation when a model is available. */
export async function requestReview({ scenario, history }) {
  if (scenario.generated || scenario.modelReview) {
    try {
      const review = await call(
        'action',
        api.ai.review,
        { brief: briefOf(scenario), history: transcriptOf(history) },
        () => null,
      );
      if (review) return { ...review, xp: scenario.review.xp };
    } catch (error) {
      console.error(error);
    }
  }
  await wait(1600);
  return scenario.review;
}
