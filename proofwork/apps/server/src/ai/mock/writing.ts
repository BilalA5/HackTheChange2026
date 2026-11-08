// Mock: coach, support, application drafting and portfolio bio. Templates filled from real inputs.
import type { ChatMessage, Job, Portfolio, PortfolioProject, User } from "@pw/shared";
import { lowerFirst, sentencesOf, shortPhrase } from "../text.ts";

const firstName = (u: User) => u.name.trim().split(/\s+/)[0] || "there";

export function coachReplyMock(i: { user: User; history: ChatMessage[]; message: string; progressSummary: string }): string {
  const name = firstName(i.user);
  const m = i.message.toLowerCase();
  if (/stuck|lost|overwhelm|confus/.test(m)) {
    return `That's normal, ${name}. Break the next task into the smallest step you can finish in ten minutes, then tell me what you tried.`;
  }
  if (/job|apply|application|hire|interview/.test(m)) {
    return `Your portfolio is the strongest signal to employers, ${name}, so finish one project fully before you apply. Want help turning it into a short story?`;
  }
  if (/next|what should|where now|what now/.test(m)) {
    return `I'd pick the next project on your roadmap and finish its first requirement today, ${name}. Small wins compound.`;
  }
  const opener = i.progressSummary
    ? `Good question, ${name}. From your progress so far (${shortPhrase(i.progressSummary, 14)}), the best next move`
    : `Good question, ${name}. The best next move`;
  return `${opener} is to write down one concrete result you want, then go get it. What would success look like this week?`;
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
