import { coaches, managers } from '@/data/cast.js';
import { companies, companiesFor } from '@/data/companies.js';
import { roles } from '@/data/roles.js';
import { warmupFor } from '@/data/scenarios/index.js';
import { startingPointById } from './questions.js';

export const PLAN_VERSION = 1;

const palette = {
  warmup: '#A0785A',
  projects: ['#7CC6F2', '#E86BB4', '#F29A3A', '#E5484D', '#F2C94C'],
  capstone: '#4C6FFF',
};

const hoursFor = { foundation: 2, warmup: 3, build: 5, ship: 2, capstone: 8, interview: 2 };
const xpFor = { foundation: 60, warmup: 150, build: 120, ship: 80, capstone: 200, interview: 120 };

const roundHalf = (value) => Math.max(1, Math.round(value * 2) / 2);
const slug = (text) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const customProjects = [
  'Core Skills Bootcamp',
  'Your First Real Project',
  'Working With Data',
  'Automating the Busywork With AI',
  'Shipping for Real Users',
];

export function resolveRole({ roleId, customRole }) {
  const known = roles.find((role) => role.id === roleId);
  if (known) return known;
  const title = customRole?.trim() || 'Generalist';
  return {
    id: `custom-${slug(title)}`,
    title,
    section: 'technology',
    custom: true,
    poster: '/assets/onboarding/city.jpg',
    projects: customProjects,
    tools: [
      { name: 'Claude', src: '/assets/roles/tools/anthropic.svg' },
      { name: 'Google Sheets', src: '/assets/roles/tools/googlesheets.svg' },
    ],
  };
}

const companyStop = (id) => ({
  companyId: id,
  company: companies[id].name,
  logo: companies[id].logo,
  map: companies[id].map,
});

function persona(cast, role, opening) {
  return { name: cast.name, photo: cast.photo, style: cast.style, role, opening };
}

function foundationStop({ index, tools, company, manager, coach }) {
  const [first, second = first] = tools;
  const steps = [
    {
      id: `foundation-${index + 1}`,
      title: `Day one: set up ${first} and ${second}`,
      shortTitle: `Set up ${first}`,
      task: 'Get your tools ready',
      summary: `Every project in your plan runs on ${first} and ${second}. Get both working, and prove it with one small result.`,
      requirements: [
        {
          title: 'Install and sign in',
          steps: [`Create your ${first} account and sign in`, `Do the same for ${second}`],
        },
        {
          title: 'Run your first task',
          steps: [`Ask ${first} to explain one thing you want to learn this week`, `Save the answer in ${second}`],
        },
        {
          title: 'Show your manager',
          steps: [`Tell ${manager.name} what you set up and one thing that surprised you`],
        },
      ],
    },
    {
      id: `foundation-${index + 1}`,
      title: `Learn the vocabulary of the job`,
      shortTitle: 'Learn the vocabulary',
      task: 'Explain the job in your own words',
      summary: `Before real projects, get fluent in how the team talks. Learn ten terms and use them in a short memo.`,
      requirements: [
        {
          title: 'Collect ten terms',
          steps: ['List ten words you hear in job posts for this role', `Ask ${first} to define each in one sentence`],
        },
        {
          title: 'Write a one-page memo',
          steps: ['Describe what this job does all week using at least five of the terms'],
        },
        {
          title: 'Check it with your coach',
          steps: [`Ask ${coach.name} which term you used least confidently, and fix that line`],
        },
      ],
    },
  ][index];

  return {
    ...steps,
    kind: 'foundation',
    ...companyStop(company),
    skills: ['Tool fluency', 'Learning fast', 'Asking good questions', 'Writing it down'],
    tools: [first, second],
    resources: [`${first} quick start`, `${second} quick start`],
    notes: [
      { heading: 'Problem', items: ['New hires lose their first week to setup and jargon'] },
      { heading: 'Outcome', items: ['Your tools work and you can talk like the team'] },
      { heading: 'Deliverable', items: ['A short note to your manager with what you set up'] },
    ],
  };
}

function buildStop({ project, tools, company, manager }) {
  const [first, second = first] = tools;
  const name = companies[company].name;
  return {
    kind: 'build',
    ...companyStop(company),
    title: `${project} at ${name}`,
    shortTitle: project,
    task: 'Build the first working version',
    summary: `${name} wants ${project} working this quarter. Agree the scope with ${manager.name}, build a first version with ${first} and ${second}, and prove it works.`,
    skills: [project, 'Scoping work', `Building with ${first}`, 'Testing your work'],
    tools: [first, second],
    resources: [`${name} ${project} brief`, `${first} starter guide`],
    requirements: [
      {
        title: 'Agree the scope',
        steps: [
          `Read the meeting notes and list what ${name} needs from this project`,
          'Write one sentence that says what done looks like',
          `Check that sentence with ${manager.name}`,
        ],
      },
      {
        title: 'Build a first version',
        steps: [
          `Use ${first} to get the smallest version working end to end`,
          `Bring in ${second} where it saves you time`,
          'Keep a short log of each decision and why you made it',
        ],
      },
      {
        title: 'Prove it works',
        steps: [
          'Pick one measure of success before you test',
          'Run it against that measure and note the result',
          'Write down one thing that broke and how you fixed it',
        ],
      },
      {
        title: 'Hand it over',
        steps: [
          'Summarize what you built in three sentences',
          `Tell ${manager.name} what you would do with one more week`,
        ],
      },
    ],
    notes: [
      {
        heading: 'Problem',
        items: [
          `${name} has no working version of ${project} yet`,
          'The team keeps doing this work by hand, slowly and inconsistently',
        ],
      },
      {
        heading: 'Outcome',
        items: ['A first version the team can try this week', 'One clear number that shows it works'],
      },
      {
        heading: 'Deliverable',
        items: ['The working version, or a link to it', 'A three-sentence summary and your decision log'],
      },
      { heading: 'Stack', items: [first, second] },
    ],
  };
}

function shipStop({ project, company, manager }) {
  const name = companies[company].name;
  return {
    kind: 'ship',
    ...companyStop(company),
    title: `Present ${project} to ${name}`,
    shortTitle: `Present ${project}`,
    task: 'Present your work and take questions',
    summary: `Your ${project} work is in. Walk the ${name} team through it, defend your choices and answer their questions.`,
    skills: ['Presenting to a team', 'Handling questions', project, 'Writing it up'],
    tools: ['Google Slides'],
    resources: ['Presentation template'],
    requirements: [
      {
        title: 'Shape the story',
        steps: [
          'Open with the problem in one sentence',
          'Show the result before the method',
          'Keep it to five slides or fewer',
        ],
      },
      {
        title: 'Back it with evidence',
        steps: ['Bring the number from your test', 'Show one thing you tried that did not work'],
      },
      {
        title: 'Take questions',
        steps: [
          `Answer ${manager.name}'s questions in two sentences or less`,
          "Say \"I don't know yet, here's how I'd find out\" when you need to",
        ],
      },
    ],
    notes: [
      { heading: 'Audience', items: [`${manager.name} and two people from the ${name} team`] },
      { heading: 'Outcome', items: ['The team agrees to try your work, or tells you exactly what is missing'] },
      { heading: 'Deliverable', items: ['Five slides or fewer', 'Answers to the three hardest questions'] },
    ],
  };
}

function capstoneStops({ role, tools, company, startingPoint, manager }) {
  const name = companies[company].name;
  const [first, second = first] = tools;
  const capstone = {
    kind: 'capstone',
    ...companyStop(company),
    title: `Capstone: your ${role.title} portfolio piece`,
    shortTitle: 'Capstone project',
    task: 'Build one project you would show in an interview',
    summary: `Pull everything together. Pick a real problem at ${name}, solve it end to end with ${tools.join(', ')}, and write it up as a case study.`,
    skills: ['End-to-end delivery', 'Product judgment', 'Writing a case study', 'Presenting to a team'],
    tools: [first, second],
    resources: ['Case study template'],
    requirements: [
      {
        title: 'Pick the problem',
        steps: [`Choose a problem ${name} would pay to solve`, `Agree it with ${manager.name} before you start`],
      },
      {
        title: 'Solve it end to end',
        steps: ['Use every tool from your plan at least once', 'Keep a log of the three biggest decisions'],
      },
      {
        title: 'Write the case study',
        steps: ['Problem, approach, result, what you would do next', 'One chart or screenshot that tells the story'],
      },
    ],
    notes: [
      { heading: 'Problem', items: ['Hiring managers want proof, not certificates'] },
      { heading: 'Outcome', items: ['A case study you can link from your resume'] },
      { heading: 'Deliverable', items: ['The project, the case study and a two-minute walkthrough'] },
    ],
  };

  const promotion = startingPoint === 'working';
  const interview = {
    kind: 'interview',
    ...companyStop(company),
    title: promotion ? 'Make your promotion case' : `${role.title} interview loop at ${name}`,
    shortTitle: promotion ? 'Promotion case' : 'Interview loop',
    task: promotion ? 'Make the case for the next level' : 'Pass a mock interview loop',
    summary: promotion
      ? `Turn your plan's work into a promotion case: what you shipped, what it moved, and what you'd own next.`
      : `A full mock loop for a ${role.title} role: a walkthrough of your capstone, a skills round and a behavioural round.`,
    skills: ['Telling your story', 'Thinking out loud', 'Handling pressure', 'Closing strong'],
    tools: [first],
    resources: ['Interview prep sheet'],
    requirements: promotion
      ? [
          { title: 'List what you shipped', steps: ['Every project from your plan with one number each'] },
          { title: 'Show the next level', steps: ['Name one thing you would own that nobody owns today'] },
          { title: 'Ask for it', steps: [`Make the case to ${manager.name} in five minutes`] },
        ]
      : [
          { title: 'Walk through your capstone', steps: ['Two minutes, problem first, result second'] },
          { title: 'Skills round', steps: ['Think out loud and say your assumptions before you answer'] },
          { title: 'Behavioural round', steps: ['Answer with a situation, what you did and what happened'] },
        ],
    notes: [
      {
        heading: 'Format',
        items: promotion ? ['One conversation, five minutes'] : ['Three rounds, about forty minutes'],
      },
      { heading: 'What they look for', items: ['Clear thinking', 'Evidence from real work', 'Honesty about gaps'] },
    ],
  };

  return [capstone, interview];
}

function withPeople(stop, manager, coach) {
  const company = stop.company;
  return {
    ...stop,
    manager: persona(manager, 'Manager', [
      `Welcome to ${company}. I'm ${manager.name}, and I'll be your manager on this one.`,
      `Your task: ${stop.task.toLowerCase()}. The requirements are on the left and the notes are on the right. Ask me anything.`,
    ]),
    coach: persona(coach, 'Coach', [
      `I'm ${coach.name}, your coach for the whole plan. I'm here when you get stuck.`,
      'Tell me which requirement you are on and we will take it one step at a time.',
    ]),
  };
}

/**
 * Turns the onboarding answers into a learner's plan: a warm-up, one colour group per project the role
 * needs, and a capstone, laid out as stops on the board with a week for each at the learner's pace.
 */
export function buildPlan({ roleId, customRole, startingPoint = 'some', hoursPerWeek = 6 }) {
  const role = resolveRole({ roleId, customRole });
  const pace = startingPointById[startingPoint]?.pace ?? 1;
  const toolNames = role.tools.map((tool) => tool.name);
  const warmup = warmupFor(role.section);
  const companyQueue = companiesFor(role.section).filter((id) => companies[id].name !== warmup.company);
  const coach = coaches[role.title.length % coaches.length];
  const managerFor = (index) => managers[index % managers.length];

  const phases = [];
  const addPhase = (id, title, color, stops) => phases.push({ id, title, color, stops });

  const foundationCount = { new: 2, switching: 1 }[startingPoint] ?? 0;
  const warmupCompany = Object.keys(companies).find((id) => companies[id].name === warmup.company) ?? companyQueue[0];
  const warmupManager = managerFor(0);
  addPhase('warmup', 'Warm-up', palette.warmup, [
    ...Array.from({ length: foundationCount }, (_, index) =>
      withPeople(
        foundationStop({ index, tools: toolNames, company: warmupCompany, manager: warmupManager, coach }),
        warmupManager,
        coach,
      ),
    ),
    {
      id: warmup.id,
      kind: 'warmup',
      authored: true,
      ...companyStop(warmupCompany),
      logo: warmup.logo,
      title: warmup.title,
      shortTitle: warmup.shortTitle,
      task: warmup.task,
      summary: warmup.summary,
      skills: warmup.skills,
      tools: warmup.tools,
      manager: { name: warmup.manager.name, photo: warmup.manager.photo, role: 'Manager' },
      coach: { name: warmup.coach.name, photo: warmup.coach.photo, role: 'Coach' },
    },
  ]);

  role.projects.slice(0, 5).forEach((project, index) => {
    const company = companyQueue[index];
    const manager = managerFor(index + 1);
    const id = `project-${index + 1}`;
    addPhase(id, project, palette.projects[index], [
      withPeople({ id: `${id}-build`, ...buildStop({ project, tools: toolNames, company, manager }) }, manager, coach),
      withPeople({ id: `${id}-ship`, ...shipStop({ project, company, manager }) }, manager, coach),
    ]);
  });

  const capstoneManager = managerFor(phases.length);
  const [capstone, interview] = capstoneStops({
    role,
    tools: toolNames,
    company: companyQueue[5],
    startingPoint,
    manager: capstoneManager,
  });
  addPhase('capstone', 'Job ready', palette.capstone, [
    withPeople({ id: 'capstone', ...capstone }, capstoneManager, coach),
    withPeople({ id: 'interview', ...interview }, capstoneManager, coach),
  ]);

  const stopId = (stop) => (stop.authored ? stop.id : `${role.id}.${stop.id}`);
  let hoursSoFar = 0;
  const stops = phases.flatMap((phase) =>
    phase.stops.map((stop) => {
      const hours = roundHalf(hoursFor[stop.kind] * pace);
      const week = Math.floor(hoursSoFar / hoursPerWeek) + 1;
      hoursSoFar += hours;
      return { ...stop, id: stopId(stop), phaseId: phase.id, color: phase.color, hours, week, xp: xpFor[stop.kind] };
    }),
  );

  return {
    version: PLAN_VERSION,
    roleId: role.id,
    roleTitle: role.title,
    customRole: role.custom ? role.title : null,
    section: role.section,
    poster: role.poster,
    startingPoint,
    hoursPerWeek,
    totalHours: hoursSoFar,
    totalWeeks: Math.max(1, Math.ceil(hoursSoFar / hoursPerWeek)),
    coach: { name: coach.name, photo: coach.photo },
    tools: role.tools.map(({ name, src }) => ({ name, src })),
    phases: phases.map(({ id, title, color, stops: phaseStops }) => ({
      id,
      title,
      color,
      stopIds: phaseStops.map(stopId),
    })),
    stops,
    tailoring: 'none',
    createdAt: new Date().toISOString(),
  };
}

export const withArticle = (title) => `${/^[aeiou]/i.test(title) ? 'an' : 'a'} ${title}`;

export const sameAnswers = (plan, answers) =>
  Boolean(plan) &&
  plan.version === PLAN_VERSION &&
  plan.roleId === resolveRole(answers).id &&
  plan.startingPoint === answers.startingPoint &&
  plan.hoursPerWeek === answers.hoursPerWeek;
