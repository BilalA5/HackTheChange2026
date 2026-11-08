import { getScenario } from '@/data/scenarios/index.js';

const managerScript = (stop) => [
  {
    say: 'What does done look like for this?',
    reply: `Done means every requirement on the left is met and you can explain it in three sentences. Start with "${stop.requirements[0].title.toLowerCase()}" and send me what you have.`,
  },
  {
    say: 'Which part should I start with?',
    reply: `Start with the first requirement: ${stop.requirements[0].steps[0].toLowerCase()}. Small and finished beats big and half done.`,
  },
  {
    say: 'Here is my first version. What would you change?',
    reply:
      'Good, thanks for sending it early. Tighten the summary to three sentences and add the one number that proves it works. Then hit Submit for review.',
  },
];

const coachScript = (stop) => [
  {
    say: "I'm stuck on where to start.",
    reply: `Name the requirement you're on and the last thing you tried. If you haven't started, "${stop.requirements[0].steps[0]}" takes ten minutes. Do that first.`,
  },
  {
    say: 'How do I explain my choices?',
    reply:
      'Lead with the decision, then the reason, in one sentence. Managers love a decision they can repeat to their boss.',
  },
  {
    say: 'Can you check my plan before I submit?',
    reply: `Read it against the ${stop.requirements.length} requirements out loud. If any answer is "sort of", fix that one first.`,
  },
];

const managerReplies = (stop) => [
  {
    keywords: ['scope', 'done', 'goal', 'outcome'],
    text: `The outcome is in the notes: ${stop.notes.find((note) => note.heading === 'Outcome')?.items[0] ?? stop.summary}`,
  },
  {
    keywords: ['tool', 'tools', ...stop.tools.map((tool) => tool.toLowerCase())],
    text: `Use ${stop.tools.join(' and ')}. Don't add a new tool unless it saves you an hour.`,
  },
  {
    keywords: ['deadline', 'due', 'time', 'long'],
    text: `Budget about ${stop.hours} hours for this. If it slips, tell me early, not late.`,
  },
  {
    keywords: ['submit', 'ready', 'finished', 'review'],
    text: 'Tell me what you did and why in three sentences, then hit Submit for review.',
  },
];

const coachReplies = [
  {
    keywords: ['stuck', 'lost', 'confused', 'help'],
    text: 'Break it into the smallest step you could finish in ten minutes. What is that step?',
  },
  {
    keywords: ['nervous', 'scared', 'confidence', 'worried'],
    text: "That's normal. Your manager is grading your reasoning, not your confidence. Write the reason down and you'll feel steadier.",
  },
  {
    keywords: ['submit', 'done', 'finished', 'ready'],
    text: 'Before you submit, read each requirement and say out loud where you met it.',
  },
];

const fallbacks = {
  manager: [
    'Good question. What would a good answer look like to you? Start there and I will react to it.',
    'Check the meeting notes on the right first, then tell me what is still unclear.',
  ],
  coach: [
    "Try asking your manager that directly, then come back and tell me what they said. I'll help you read it.",
    'Break it into the smallest next step you could finish in ten minutes.',
  ],
};

/** The workspace scenario for one stop on a learner's plan. Hand-written warm-ups keep their own script. */
export function scenarioFromStop(stop) {
  if (stop.authored) {
    const authored = getScenario(stop.id);
    return authored && { ...authored, stop };
  }

  return {
    ...stop,
    generated: true,
    stop,
    manager: {
      ...stop.manager,
      script: managerScript(stop),
      replies: managerReplies(stop),
      fallbacks: fallbacks.manager,
    },
    coach: {
      ...stop.coach,
      script: coachScript(stop),
      replies: coachReplies,
      fallbacks: fallbacks.coach,
    },
    review: {
      summary: `Solid work on ${stop.shortTitle}. You met the brief and explained your choices. Next time, lead with the one number that proves it works.`,
      scores: { insight: 0.78, quality: 0.74, communication: 0.8, reliability: 0.76 },
      xp: stop.xp,
    },
  };
}
