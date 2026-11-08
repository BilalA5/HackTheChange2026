'use node';

import Anthropic from '@anthropic-ai/sdk';
import { v } from 'convex/values';
import { internal } from './_generated/api';
import { action } from './_generated/server';

const MODEL = 'claude-opus-5-5';
const FALLBACK = { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' };

const client = () => (process.env.ANTHROPIC_API_KEY ? new Anthropic() : null);

const textOf = (message) =>
  message.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text)
    .join('')
    .trim();

const strings = { type: 'array', items: { type: 'string' } };
const object = (properties) => ({
  type: 'object',
  additionalProperties: false,
  required: Object.keys(properties),
  properties,
});

const tailoredPlanSchema = object({
  phases: { type: 'array', items: object({ id: { type: 'string' }, title: { type: 'string' } }) },
  stops: {
    type: 'array',
    items: object({
      id: { type: 'string' },
      title: { type: 'string' },
      shortTitle: { type: 'string' },
      task: { type: 'string' },
      summary: { type: 'string' },
      skills: strings,
      requirements: { type: 'array', items: object({ title: { type: 'string' }, steps: strings }) },
      notes: { type: 'array', items: object({ heading: { type: 'string' }, items: strings }) },
      managerOpening: { type: 'string' },
    }),
  },
});

const reviewSchema = object({
  summary: { type: 'string' },
  scores: object({
    insight: { type: 'number' },
    quality: { type: 'number' },
    communication: { type: 'number' },
    reliability: { type: 'number' },
  }),
});

const startingPoints = {
  new: 'new to the field (student or first job hunt)',
  switching: 'switching careers from another field',
  some: 'has built a few things through coursework or side projects',
  working: 'already works in the field and wants harder projects',
};

const PLAN_SYSTEM = `You write the project briefs for Flint, where people learn a job by doing realistic projects for real companies, guided by an AI manager and coach.

You get a learner's profile and their plan: an ordered list of stops, each a project at a named company. Rewrite every stop so it is specific to that company, that role and that learner's level. Keep each stop's id and its kind:
- foundation: setting up tools and learning the basics of the job
- build: building a first working version of the phase's project
- ship: presenting that work to the team and answering questions
- capstone: one end-to-end portfolio piece
- interview: a mock interview loop, or a promotion case for someone already in the field

For each stop:
- title: under 60 characters, names the company. shortTitle: under 32 characters.
- task: one imperative sentence under 60 characters.
- summary: two sentences with a concrete business problem and, where natural, one realistic number.
- skills: exactly 4, each under 28 characters.
- requirements: 3 or 4, each with a short title and 2 or 3 concrete steps that use the stop's tools by name.
- notes: the kickoff meeting notes, headings "Problem", "Outcome", "Deliverable" and, for build stops, "Stack"; 2 to 4 short items each.
- managerOpening: the manager's first message, under 40 words, in their voice, setting up the task.

Match difficulty to the learner: explain more for beginners, raise the bar for people already in the field. Plain, direct language. No buzzwords, no exclamation marks, no markdown.
Also return a title for every phase id you are given, under 34 characters; keep a phase's title unless it is generic.`;

export const tailorPlan = action({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const anthropic = client();
    const plan = await ctx.runQuery(internal.plans.read, { userId });
    if (!anthropic || !plan) return null;

    const editable = plan.stops.filter((stop) => !stop.authored);
    const profile = {
      role: plan.roleTitle,
      startingPoint: startingPoints[plan.startingPoint] ?? plan.startingPoint,
      hoursPerWeek: plan.hoursPerWeek,
      tools: plan.tools.map((tool) => tool.name),
    };
    const outline = {
      phases: plan.phases.map(({ id, title }) => ({ id, title })),
      stops: editable.map(({ id, kind, phaseId, company, title, tools, manager }) => ({
        id,
        kind,
        phase: plan.phases.find((phase) => phase.id === phaseId)?.title,
        company,
        title,
        tools,
        manager: manager.name,
      })),
    };

    const stream = anthropic.beta.messages.stream({
      model: MODEL,
      max_tokens: 64000,
      ...FALLBACK,
      output_config: { effort: 'medium', format: { type: 'json_schema', schema: tailoredPlanSchema } },
      system: PLAN_SYSTEM,
      messages: [
        {
          role: 'user',
          content: `Learner:\n${JSON.stringify(profile, null, 2)}\n\nPlan:\n${JSON.stringify(outline, null, 2)}`,
        },
      ],
    });
    const message = await stream.finalMessage();
    if (message.stop_reason !== 'end_turn') return null;

    const tailored = JSON.parse(textOf(message));
    const byId = new Map(tailored.stops.map((stop) => [stop.id, stop]));
    const phaseTitles = new Map(tailored.phases.map((phase) => [phase.id, phase.title]));

    const next = {
      ...plan,
      tailoring: 'done',
      phases: plan.phases.map((phase) => ({ ...phase, title: phaseTitles.get(phase.id) || phase.title })),
      stops: plan.stops.map((stop) => {
        const update = byId.get(stop.id);
        if (stop.authored || !update) return stop;
        const { managerOpening, skills, ...brief } = update;
        return {
          ...stop,
          ...brief,
          skills: skills.slice(0, 4),
          manager: { ...stop.manager, opening: [managerOpening] },
        };
      }),
    };

    const saved = await ctx.runMutation(internal.plans.replaceIfCurrent, {
      userId,
      createdAt: plan.createdAt,
      plan: next,
    });
    return saved ? next : null;
  },
});

const brief = v.object({
  company: v.string(),
  title: v.string(),
  task: v.string(),
  summary: v.string(),
  requirements: v.array(v.object({ title: v.string(), steps: v.array(v.string()) })),
  notes: v.array(v.object({ heading: v.string(), items: v.array(v.string()) })),
});

const transcript = v.array(v.object({ from: v.string(), text: v.string() }));

const describeBrief = (b) =>
  [
    `Company: ${b.company}`,
    `Project: ${b.title}`,
    `Task: ${b.task}`,
    `Summary: ${b.summary}`,
    'Requirements:',
    ...b.requirements.map((r) => `- ${r.title}: ${r.steps.join('; ')}`),
    'Meeting notes:',
    ...b.notes.map((n) => `- ${n.heading}: ${n.items.join('; ')}`),
  ].join('\n');

const personaVoice = {
  manager: (name, company) =>
    `You are ${name}, the learner's manager at ${company}. You set the bar, answer questions about scope and priorities, and push for clear reasoning. You are direct and warm, and you never do the work for them.`,
  coach: (name) =>
    `You are ${name}, the learner's coach. You help them get unstuck with one small next step, explain concepts simply, and build their confidence. You never hand over the finished answer.`,
};

function toMessages(history, text) {
  const firstLearner = history.findIndex((message) => message.from === 'me');
  const turns = firstLearner < 0 ? [] : history.slice(firstLearner);
  return [
    ...turns.map(({ from, text: body }) => ({ role: from === 'me' ? 'user' : 'assistant', content: body })),
    { role: 'user', content: text },
  ];
}

export const reply = action({
  args: {
    brief,
    persona: v.object({ kind: v.string(), name: v.string(), style: v.string() }),
    history: transcript,
    text: v.string(),
  },
  handler: async (_ctx, { brief: b, persona, history, text }) => {
    const anthropic = client();
    if (!anthropic) return null;

    const voice = (personaVoice[persona.kind] ?? personaVoice.coach)(persona.name, b.company);
    const opening = history
      .slice(0, Math.max(0, history.findIndex((m) => m.from === 'me')))
      .map((m) => m.text);

    const message = await anthropic.beta.messages.create({
      model: MODEL,
      max_tokens: 2000,
      ...FALLBACK,
      output_config: { effort: 'low' },
      system: [
        voice,
        persona.style && `Your style: ${persona.style}.`,
        'This is a realistic work simulation on Flint. Stay in character and keep to this project.',
        'Reply in at most three short sentences of plain text. No markdown, no lists, no emoji.',
        opening.length ? `You opened the conversation with:\n${opening.join('\n')}` : '',
        `The project:\n${describeBrief(b)}`,
      ]
        .filter(Boolean)
        .join('\n\n'),
      messages: toMessages(history, text),
    });
    if (message.stop_reason === 'refusal') return null;
    return textOf(message) || null;
  },
});

const clamp = (score) => Math.min(1, Math.max(0, Math.round(score * 100) / 100));

export const review = action({
  args: { brief, history: transcript },
  handler: async (_ctx, { brief: b, history }) => {
    const anthropic = client();
    if (!anthropic) return null;

    const conversation = history.map((m) => `${m.from === 'me' ? 'Learner' : 'Team'}: ${m.text}`).join('\n');
    const message = await anthropic.beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      ...FALLBACK,
      output_config: { effort: 'low', format: { type: 'json_schema', schema: reviewSchema } },
      system: `You are the manager reviewing a learner's submission on Flint, a job simulation. Grade only what the learner showed in the conversation against the requirements. Scores are between 0 and 1: insight (understanding of the problem), quality (how well the requirements were met), communication (clarity), reliability (follow-through and honesty about gaps). Be fair to effort but do not inflate: a learner who said little scores low. The summary is two or three plain sentences in your voice: what was good, then the one thing to do better next time.`,
      messages: [
        {
          role: 'user',
          content: `The project:\n${describeBrief(b)}\n\nThe conversation:\n${conversation || '(the learner did not write anything)'}`,
        },
      ],
    });
    if (message.stop_reason !== 'end_turn') return null;

    const { summary, scores } = JSON.parse(textOf(message));
    return {
      summary,
      scores: Object.fromEntries(Object.entries(scores).map(([skill, score]) => [skill, clamp(score)])),
    };
  },
});
