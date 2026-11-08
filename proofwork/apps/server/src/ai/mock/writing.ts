// Mock: coach, support, application drafting and portfolio bio. Templates filled from real inputs.
import type { ChatMessage, Job, Portfolio, PortfolioProject, User } from "@pw/shared";
import type { CoachContext } from "../../contracts.ts";
import { lowerFirst, sentencesOf, shortPhrase } from "../text.ts";

const firstName = (u: User) => u.name.trim().split(/\s+/)[0] || "there";

type CoachInput = { user: User; history: ChatMessage[]; message: string; progressSummary: string; context?: CoachContext };

/** Coach intents, checked in order. Each has several replies so the coach does not repeat itself. */
const COACH_INTENTS: { test: RegExp; replies: ((c: CoachFacts) => string)[] }[] = [
  {
    test: /\b(stuck|lost|overwhelm|confus|don'?t get|no idea|hard)\b/,
    replies: [
      (c) => `That's normal at this point, ${c.name}. Shrink the next task to something you can finish in ten minutes${c.step ? `: start with ${c.step}` : ""}. Then tell me what you tried and where it broke.`,
      (c) => `When it feels like too much, write down the one question you can't answer yet${c.manager ? ` and ask ${c.manager} in the kickoff Q&A` : ""}. Naming the gap usually makes it half the size.`,
      (c) => `Try explaining the problem out loud in two sentences, ${c.name}. The part you can't explain is the part to look up first, and the Learn mode lessons in each stage are built for exactly that.`,
    ],
  },
  {
    test: /\b(interview|interviews|interviewing)\b/,
    replies: [
      (c) => `Interviewers for ${c.roleA} roles ask you to walk through real work. ${c.project ? `"${c.project}" is your best story: the problem, what you did, and the result.` : "Finish one project and it becomes your best story."} Practise telling it in under two minutes.`,
      (c) => `Prepare three stories in the shape situation, action, result, ${c.name}: one where you found a problem, one where you built something, one where you changed someone's mind. Your Proofwork projects can supply all three.`,
      (c) => `Before an interview, reread the job posting and match each requirement to something you have done. Where you have a gap, say how you would close it. That honesty lands better than a bluff.`,
    ],
  },
  {
    test: /\b(job|jobs|apply|application|hire|hiring|resume|cv|portfolio|linkedin)\b/,
    replies: [
      (c) => c.completed > 0
        ? `You have ${c.completed} finished project${c.completed === 1 ? "" : "s"}, so the job portal is open. Pick one posting, and let the application drafter pull from your portfolio, then edit it in your own voice.`
        : `The job portal opens after your first finished project, ${c.name}. ${c.project ? `Finishing "${c.project}" is the fastest way in.` : "Finish one project first."} A shipped project is worth more to employers than a list of courses.`,
      (c) => `Your portfolio should show decisions, not just tasks. For each project, keep one line on the problem, one on what you chose and why, and one on the result.`,
      (c) => `Apply to fewer roles with more care, ${c.name}. Three tailored applications a week beat thirty generic ones, and each one should name a project that matches the posting.`,
    ],
  },
  {
    test: /\b(progress|review|how am i|doing|level|xp|streak)\b/,
    replies: [
      (c) => `You're at level ${c.level} with ${c.xp} XP${c.streak > 0 ? ` and a ${c.streak}-day streak` : ""}, ${c.name}. ${c.completed} of ${c.total || 3} projects are done. ${c.step ? `Next up: ${c.step}.` : "Pick your next project on the map."}`,
      (c) => `${c.completed > 0 ? `Good work finishing ${c.completed} project${c.completed === 1 ? "" : "s"}.` : "You're at the start, which is the hardest part."} The rubric scores that move fastest are Communication and Independence: explain your choices, and ask the tutor less as you go.`,
      (c) => `Steady beats intense here. ${c.streak > 1 ? `Your ${c.streak}-day streak is the right habit.` : "A short session every day builds more than one long weekend."} ${c.step ? `Today, aim to ${c.step}.` : ""}`.trim(),
    ],
  },
  {
    test: /\b(next|focus|week|today|plan|priorit|what should|where (do|should) i start|start)\b/,
    replies: [
      (c) => c.step ? `This week, focus on one thing, ${c.name}: ${c.step}. Block an hour for it, and come back and tell me what you found.` : `Pick the first project on your map and read its brief today. Small wins compound.`,
      (c) => `Set one concrete goal for the week${c.project ? ` on "${c.project}"` : ""}, write it where you'll see it, and stop when it's done. Then tell me what you shipped.`,
      (c) => `${c.project ? `"${c.project}" is your current project.` : "Start with your first project."} Do the plan step with ${c.manager ?? "your manager"} first: agreeing what done looks like saves you hours later.`,
    ],
  },
  {
    test: /\b(skill|skills|learn|study|course|training|practice)\b/,
    replies: [
      (c) => `The fastest way to build ${c.roleA} skills is to use them on a real problem. Your stages each include a short lesson and a quiz; do those right before the work they belong to, not all at once.`,
      (c) => `Check the Training tab for short lessons picked for your path, ${c.name}. Do one, then apply it the same day in your project, or it won't stick.`,
      (c) => `Learn just enough to take the next step, then do the step. Reading ahead feels productive, but the project is where the skill actually forms.`,
    ],
  },
  {
    test: /\b(tired|burn|motivat|give up|quit|bored|anxious|nervous|scared)\b/,
    replies: [
      (c) => `That's worth taking seriously, ${c.name}. Lower the bar for today: twenty minutes on ${c.step ?? "your next task"}, then stop. Momentum matters more than hours.`,
      (c) => `Remember why you started${c.role ? `: becoming a ${c.role}` : ""}. Write that down, then do the smallest next step. Feelings follow action more often than the other way round.`,
      (c) => `Take a real break if you need one; your streak is not worth burning out over. When you come back, start with something you can finish in one sitting.`,
    ],
  },
  {
    test: /\b(thank|thanks|cheers|appreciate)\b/,
    replies: [
      (c) => `Anytime, ${c.name}. Come back after ${c.step ?? "your next session"} and tell me how it went.`,
      () => `Glad it helped. One step at a time, and check in when you hit a decision you're unsure about.`,
    ],
  },
  {
    test: /^\s*(hi|hey|hello|yo|hiya|good (morning|afternoon|evening))\b/,
    replies: [
      (c) => `Hi ${c.name}! ${c.project ? `You're working on "${c.project}"${c.company ? ` at ${c.company}` : ""}.` : "You're just getting started."} Want to plan your week, prepare for interviews, or talk through something you're stuck on?`,
      (c) => `Hey ${c.name}, good to see you. ${c.step ? `Your next step is to ${c.step}.` : "Pick a project on the map to begin."} What would help most right now?`,
      (c) => `Hello again, ${c.name}. Level ${c.level}, ${c.xp} XP so far. Ask me about your next step, your portfolio or interviews.`,
    ],
  },
];

const COACH_DEFAULT: ((c: CoachFacts) => string)[] = [
  (c) => `Good question, ${c.name}. ${c.step ? `For now, the most useful move is to ${c.step}.` : "Start with the first project on your map."} What would success look like for you this week?`,
  (c) => `Let's make that concrete: what result do you want, by when, and how will you know you got it? ${c.project ? `Tie it to "${c.project}" if you can.` : ""}`.trim(),
  (c) => `I'd answer that by looking at what ${c.roleA} actually does day to day: real problems, clear write-ups, and decisions you can defend. Your projects practise all three.`,
];

interface CoachFacts {
  name: string;
  role: string | null;
  /** "a data analyst" style phrase. */
  roleA: string;
  project: string | null;
  company: string | null;
  manager: string | null;
  step: string | null;
  level: number;
  xp: number;
  streak: number;
  completed: number;
  total: number;
}

function factsOf(i: CoachInput): CoachFacts {
  const c = i.context;
  const role = (c?.careerTitle ?? i.user.vision?.targetRole ?? "").trim() || null;
  const lower = role ? role.toLowerCase() : "professional";
  return {
    name: firstName(i.user),
    role,
    roleA: `${/^[aeiou]/.test(lower) ? "an" : "a"} ${lower}`,
    project: c?.project?.title ?? null,
    company: c?.project?.company ?? null,
    manager: c?.project?.manager ?? null,
    step: c?.nextStep ?? null,
    level: c?.level ?? 0,
    xp: c?.xp ?? 0,
    streak: c?.streak ?? 0,
    completed: c?.completedProjects ?? 0,
    total: c?.totalProjects ?? 0,
  };
}

export function coachReplyMock(i: CoachInput): string {
  const facts = factsOf(i);
  const m = i.message.toLowerCase();
  const intent = COACH_INTENTS.find((x) => x.test.test(m));
  const replies = intent?.replies ?? COACH_DEFAULT;
  const said = new Set(i.history.filter((h) => h.role === "npc").map((h) => h.text.trim()));
  // Rotate through the replies by how often the coach has answered, and skip anything already said.
  const turn = i.history.filter((h) => h.role === "npc").length;
  for (let k = 0; k < replies.length; k++) {
    const text = replies[(turn + k) % replies.length](facts).replace(/\s+/g, " ").trim();
    if (!said.has(text)) return text;
  }
  return replies[turn % replies.length](facts).replace(/\s+/g, " ").trim();
}

export function supportReplyMock(i: { user: User; history: ChatMessage[]; message: string }): string {
  const name = firstName(i.user);
  const m = i.message.toLowerCase();
  const hint = /crash|error|bug|broken|stuck|blank/.test(m)
    ? " Could you tell me which screen this happened on and what you clicked just before?"
    : " Could you share a little more detail so the team can help?";
  return `Thanks for flagging this, ${name}.${hint} A human from the team reads every thread within one business day.`;
}

const levelFor = (projectCount: number): "junior" | "mid" | "senior" =>
  projectCount >= 5 ? "senior" : projectCount >= 2 ? "mid" : "junior";

const LEVEL_OPTION: Record<"junior" | "mid" | "senior", RegExp> = {
  junior: /junior|entry|associate|graduate/i,
  mid: /mid|intermediate|experienced/i,
  senior: /senior|lead|principal/i,
};

function projectSentence(p: PortfolioProject): string {
  return `${p.title} for ${p.company}, where ${lowerFirst(sentencesOf(p.summary)[0] ?? p.summary).replace(/[.]+$/, "")}`;
}

export function draftApplicationMock(i: { job: Job; user: User; portfolio: Portfolio }): {
  answers: Record<string, string>;
  guessed: string[];
  coverLetter: string;
} {
  const { job, user, portfolio } = i;
  const projects = portfolio.projects;
  const level = levelFor(projects.length);
  const portfolioUrl = `https://proofwork.app/p/${portfolio.shareSlug}`;
  const top = projects.slice(0, 2);
  const projectParagraph = top.length
    ? `The project I'm proudest of is ${projectSentence(top[0])}.${top[1] ? ` I also completed ${top[1].title} for ${top[1].company}.` : ""}`
    : "I'm early in my portfolio, and I'm building it deliberately, one scoped project at a time.";
  const whyParagraph = `${projectParagraph} I work from a clear plan, check my results against the requirements, and write down what I learned. That is the habit I would bring to the ${job.title} role.`;

  const answers: Record<string, string> = {};
  const guessed: string[] = [];

  for (const f of job.applyFields) {
    const key = f.key.toLowerCase();
    const label = f.label.toLowerCase();
    let value = "";
    let inferred = false;

    if (/full_?name|^name$/.test(key)) {
      value = user.name;
    } else if (/email/.test(key) || f.type === "email") {
      value = user.email;
    } else if (/portfolio/.test(key)) {
      value = portfolioUrl;
    } else if (f.type === "url") {
      value = portfolioUrl;
      inferred = true;
    } else if (f.type === "select" && f.options?.length) {
      const want = LEVEL_OPTION[level];
      value = f.options.find((o) => want.test(o)) ?? f.options[0];
      inferred = true;
    } else if (f.type === "textarea") {
      value = /why|motivat|interest/.test(key + label) ? whyParagraph : `${projectParagraph} ${portfolio.bio}`.trim();
      inferred = true;
    } else if (/location|city/.test(key + label)) {
      value = user.vision?.location || "Remote";
      inferred = true;
    } else if (/start|availab|timeline/.test(key + label)) {
      value = user.vision?.timeline || "Within 1 month";
      inferred = true;
    } else if (/salary|pay|compens/.test(key + label)) {
      value = "Open to discussion";
      inferred = true;
    } else if (/year|experience/.test(key + label)) {
      value = projects.length >= 3 ? "1-2 years of applied project work" : "Less than 1 year of applied project work";
      inferred = true;
    } else {
      value = portfolio.headline || `${job.title} candidate`;
      inferred = true;
    }

    if (!value && f.required) {
      value = portfolio.headline || `${job.title} candidate`;
      inferred = true;
    }
    answers[f.key] = value;
    if (inferred && value) guessed.push(f.key);
  }

  const projectCount = projects.length;
  const coverLetter = [
    `Dear ${job.company} hiring team,`,
    `I'm applying for the ${job.title} role. Over the past weeks I've worked through ${projectCount ? `${projectCount} simulated project${projectCount === 1 ? "" : "s"}` : "my first simulated projects"} on Proofwork, each run like a real job: a kickoff with a manager, a plan agreed up front, and an evaluation against clear standards.`,
    top[0]
      ? `The most relevant is ${top[0].title} for ${top[0].company}, where ${lowerFirst(sentencesOf(top[0].summary)[0] ?? top[0].summary).replace(/[.]+$/, "")}.`
      : "I'm building my portfolio deliberately, starting with scoped projects that have clear outcomes.",
    job.requirements[0]
      ? `Your requirement to ${lowerFirst(job.requirements[0]).replace(/[.]+$/, "")} matches the way I like to work: plan, build, check the result, then write down what I learned.`
      : "I like to plan, build, check the result, and write down what I learned.",
    `You can see my work at ${portfolioUrl}. I'd welcome the chance to talk it through.`,
    `Thank you for considering my application.`,
    `${user.name}`,
  ].join("\n\n");

  return { answers, guessed, coverLetter };
}

export function portfolioBioMock(i: { user: User; projects: Portfolio["projects"] }): { headline: string; bio: string } {
  const { user, projects } = i;
  const role = user.vision?.targetRole && user.vision.targetRole !== "Not sure yet" ? user.vision.targetRole : "AI practitioner";
  const count = projects.length;
  const headline = count
    ? `${role} with ${count} shipped project${count === 1 ? "" : "s"}`
    : `Aspiring ${role} building a first portfolio`;
  const titles = projects.slice(0, 3).map((p) => `${p.title} (${p.company})`);
  const sentence1 = count
    ? `${user.name} has completed ${count} hands-on project${count === 1 ? "" : "s"} on Proofwork: ${titles.join("; ")}.`
    : `${user.name} is building a first portfolio of scoped, evidence-based projects.`;
  const levelWord: Record<string, string> = { exceeding: "exceeded expectations", meeting: "met expectations", below: "is still growing" };
  const sentence2 = projects[0]
    ? `Each project was planned with a manager, delivered against agreed requirements and presented for review; overall, ${user.name.split(" ")[0]} ${levelWord[projects[0].overall] ?? "met expectations"}.`
    : "Work is planned up front, checked against clear requirements, and documented as it goes.";
  const where = [user.vision?.companyType, user.vision?.location].filter(Boolean).join(", ");
  const industry = where ? ` Looking for ${role} roles (${where}).` : "";
  return { headline, bio: `${sentence1} ${sentence2}${industry}` };
}
