// Learn-mode library. Each topic is a short practical lesson with {token} slots filled from the scenario's facts.
// Tokens must match the keys built in scenarios.ts (fill() throws on unknown tokens).
import type { FamilyId } from "./types.ts";
import type { Rng } from "./rng.ts";

export type LearnPhase = "diagnose" | "build" | "launch" | "present";

export interface LearnTopic {
  key: string;
  title: string;
  phase: LearnPhase;
  /** Families this topic suits, or "any". */
  families: FamilyId[] | "any";
  body: string;
  question: string;
  correct: string;
  /** Three plausible but wrong options. */
  wrong: [string, string, string];
  explanation: string;
}

export const LEARN_TOPICS: LearnTopic[] = [
  // ───────────────────────────── Diagnose ─────────────────────────────
  {
    key: "metric-definition",
    title: "Defining a metric you can reproduce",
    phase: "diagnose",
    families: "any",
    body: `A metric is only useful if a second analyst can rebuild it from raw data and get the same answer. Before anyone argues about why {metric} moved, write down four things: the numerator, the denominator, the time window and the population.

For {company}, a current figure of {current} against a goal of {goal} means nothing until you say which {customers} are counted and when. Write the definition as one sentence, then check it against the {system}. Reproduce the current figure first. If you get a different number, the gap is a definition problem, not a finding.

Watch for three common traps. Some teams count an event twice when a retry happens. Some include test accounts. Some change the window halfway through a quarter without telling anyone. Each of these can move the figure by several points, which is about the size of the effect you are trying to explain.

Keep the definition in your {analysisArtifact} so the next person does not have to guess. If {stakeholder} asks how a number was built, you should answer in under thirty seconds.`,
    question: "Before explaining why a metric moved, what must you be able to do first?",
    correct: "Reproduce the current figure from raw data using a written definition",
    wrong: [
      "Pick the fix that will move the number fastest",
      "Compare it only with last year's average",
      "Ask the most senior person which number is right",
    ],
    explanation: "A figure you cannot rebuild from raw data may just reflect a definition problem, so reproduction comes before any cause.",
  },
  {
    key: "five-whys",
    title: "Root-cause with the 5 whys",
    phase: "diagnose",
    families: "any",
    body: `The 5 whys is a simple way to move from a symptom to a cause. You ask why the problem happened, take the answer, and ask why that happened, until you reach something the team can change. Here the symptom is that {metric} sits at {current} instead of {goal}.

Start with the most visible answer, which is often the least useful. People will say {cause1} changed. Ask why that change affected {customers}, then ask why the {system} did not flag it sooner. Keep going until you reach a process, a rule or a threshold.

Each why needs evidence. Attach a number, a log line or a date to every step. If you cannot find evidence for a step, mark it as a hypothesis and say which data would confirm it.

Stop when the answer is something you could change next month. A cause like "people are less engaged" is too broad to act on. A cause like "the reminder fires on day three instead of day one" is specific enough to test.

Write the chain as a short numbered list in your memo, so {stakeholder} can follow it without you in the room.`,
    question: "What makes a root cause useful at the end of a 5 whys chain?",
    correct: "It is specific enough to change, and each step has evidence behind it",
    wrong: [
      "It names the most senior person involved",
      "It is the first answer people gave in the meeting",
      "It describes how people feel about the problem",
    ],
    explanation: "A useful root cause is a process, rule or threshold you can test and change. Without evidence at each step the chain is only a story.",
  },
  {
    key: "driver-tree",
    title: "Building a driver tree",
    phase: "diagnose",
    families: ["data", "finance", "marketing", "sales_cs", "operations", "people", "product"],
    body: `A driver tree breaks one headline number into the parts that produce it. {metric} is the top box. Below it, place the two or three inputs that multiply or add up to make it, such as volume and rate, or count and average value. Keep splitting each box until the leaves are things your team can measure in the {system}.

Build the tree before you open any dashboard. Dashboards show what someone chose to plot, and a tree shows what must be true. If the top box moved from {goal} to {current}, the tree tells you which leaf to check first. A leaf that has not moved is not a suspect.

Give every box an owner and a source table. Mark each leaf as measured, estimated or unknown. Unknown leaves often explain why a team disagrees, because each person fills them with a different guess.

Test the tree against the {volume} {items} you already have. If the boxes do not add up to the total within a small tolerance, you are missing a driver or counting one twice.

Put the tree in your {memo} as a picture with a one-line label under each box, so {stakeholder} can point at the piece they disagree with.`,
    question: "Why build a driver tree before opening a dashboard?",
    correct: "It shows which inputs must have changed, so you check the right leaf first",
    wrong: [
      "Dashboards are always wrong",
      "Trees remove the need for source data",
      "It makes the chart look more polished for executives",
    ],
    explanation: "A tree states what must be true for the headline to move. Dashboards show only what someone chose to plot.",
  },
  {
    key: "segment-before-conclude",
    title: "Segmenting before you conclude",
    phase: "diagnose",
    families: "any",
    body: `An average can hide the group that changed. If {metric} {fell} from {goal} to {current} overall, the {drop} may be concentrated in one group while the rest hold steady. Split the number by {segment1}, {segment2} and any other field that is stable in the {system}, such as region, channel or cohort.

Do the split before you write any explanation. Then ask whether the groups that moved share something new, such as a release, a vendor, a policy or a staffing change. That shared feature is your lead.

Be careful with small groups. A segment with forty records can swing by ten points on one bad day. Show the count next to every percentage, and do not rank segments by a rate unless each one has enough volume to trust.

Also check the mix. If the share of {customers} in the weakest segment grew, the overall number can fall even when every segment is stable. This is the most common way teams blame the wrong thing.

Present the split as a small table with counts, rates and the change since the baseline. Leave out any segment you could not measure, and say so in a footnote.`,
    question: "A headline metric fell. What is the first thing a careful analyst does?",
    correct: "Split it by stable segments and check whether the drop is concentrated",
    wrong: [
      "Pick the segment that matches the story already being told",
      "Remove the smallest segments from the data",
      "Compare only the overall number with last year",
    ],
    explanation: "A concentrated drop points to a cause in one group, while an even drop points to something company-wide. You cannot tell which without the split.",
  },
  {
    key: "confounders",
    title: "Checking for confounders",
    phase: "diagnose",
    families: ["data", "ai_ml", "marketing", "healthcare", "people", "generic", "product"],
    body: `A confounder is a third factor that changes both the thing you measured and the outcome you care about. In this project, the biggest suspect is that heavy {customers} do more of everything. If you compare the people who used a feature with those who did not, the feature will look good for a reason unrelated to the feature.

Before you call anything a lever, ask what else differs between the two groups. Compare like with like. Match on early activity, tenure or the size of the first purchase, depending on what the {system} holds. If the effect shrinks a lot after matching, it was mostly the mix.

A simple check is a placebo. Pick an action that should not affect {metric} and compare it the same way. If the placebo looks just as strong, your method is measuring engagement, not cause.

Document the matching rule in your {analysisArtifact}. {stakeholder} will ask how you chose the comparison group, and "it seemed reasonable" is not an answer they will accept.

Association is a clue. It becomes a lever only after a test with random assignment, and the test should measure {metric} against the {goal} goal.`,
    question: "What is the purpose of a placebo check?",
    correct: "To test whether the method finds an effect where none should exist",
    wrong: [
      "To make the chart more persuasive",
      "To replace the need for a control group",
      "To estimate the final sample size",
    ],
    explanation: "If a comparison shows a strong effect for an action that should do nothing, the method is picking up something other than the cause.",
  },
  {
    key: "bottleneck-timeline",
    title: "Finding the bottleneck with a timeline",
    phase: "diagnose",
    families: ["operations", "healthcare", "software", "energy_eng", "generic"],
    body: `A timeline shows where time goes. For {metric}, take a sample of recent cases from the {system} and record when each step started and finished. Include the step names, the queue time before each step and each handoff between teams. Use at least a few weeks of data so one bad week does not set the pattern.

Plot the steps as bars. Wide bars that sit inside a queue are the bottleneck candidates. The bottleneck is not always the longest step. A short step that waits for a busy person can cause more delay than a long step that runs straight through.

Compare the timeline for {segment1} and {segment2}. If one group waits longer in the same queue, the cause is probably staffing or a rule, not the work itself.

Look for the cases that break the pattern. A few extreme cases often reveal a missing handoff or a forgotten step. Read five of them by hand before you trust the chart.

Write the bottleneck as one sentence with a number in it, for example "cases wait an average of 40 minutes before review", and put the chart in your {memo} for the {team} team.`,
    question: "A step is long, but a short step waits in a queue before it. Which one is usually the bottleneck?",
    correct: "The step where work waits for capacity, since queue time adds delay",
    wrong: [
      "Always the longest step on the chart",
      "Whichever step has the most people assigned",
      "The first step, because it starts the process",
    ],
    explanation: "Delay comes from waiting for capacity as much as from doing the work. A queue in front of a step is often the real constraint.",
  },
  {
    key: "interviews-surface-causes",
    title: "Interviews that surface causes",
    phase: "diagnose",
    families: ["design", "product", "healthcare", "people", "generic", "sales_cs"],
    body: `Numbers tell you what moved. Interviews tell you why people did what they did. For {metric}, speak with six to eight people who are closest to the work, such as frontline staff, {customer} accounts and the team that owns the {system}. Keep each conversation to thirty minutes and ask the same five questions every time.

Ask about the last time the process went wrong, not about what they would like to change. Ask them to walk you through it step by step. People describe real steps when asked for a story, and they describe wishes when asked for opinions.

Record quotes exactly and tag each one with the theory it supports or contradicts. The theory about {cause1} should show up in the stories if it is real. If nobody mentions it, that is evidence against it.

Do not treat six interviews as proof. Use them to choose what to measure in the {system}, then check the pattern with data.

Bring the two strongest quotes into your {memo}, and label them as interviews so nobody mistakes them for statistics. {stakeholder} will trust the finding more when they can hear the people behind it.`,
    question: "What is the main job of interviews in a diagnosis like this?",
    correct: "To suggest specific causes that you then test with data",
    wrong: [
      "To prove the cause using a sample of six people",
      "To replace the metric with opinions",
      "To collect praise for the team's work",
    ],
    explanation: "Interviews generate hypotheses that are specific enough to measure. They are not evidence on their own.",
  },
  {
    key: "impact-before-fix",
    title: "Estimating impact before you fix",
    phase: "diagnose",
    families: ["finance", "operations", "product", "sales_cs", "energy_eng", "generic"],
    body: `Before a team spends money on a fix, estimate what it could return. Start from the gap. {metric} is {current} and the goal is {goal}, so the gap is the amount a fix must recover. Express the gap in the unit the business uses, such as hours, orders or dollars.

Multiply by volume. The {system} shows about {volume} {items} in a normal period, so a change that moves one part in a hundred affects a real number of cases. Write the formula out: volume times rate change times value per case. Each term should have a source.

Give a range, not a point. Use a low, middle and high assumption for the rate change and say what would have to be true for the high case. A range tells {stakeholder} how much to trust the estimate.

Compare the estimate with the cost of the fix, including the time of the people who would build it. A fix that recovers a small gap cheaply can be better than a large fix that takes a quarter.

Finish with a sentence that a busy reader can act on, for example "a fix worth 3 to 5 percent is worth doing before the next review." Put it in your {memo} with the caveats listed under it.`,
    question: "Why should you estimate a fix's impact before building it?",
    correct: "To compare the expected return with the cost and decide whether it is worth doing",
    wrong: [
      "Because impact estimates are required for every ticket",
      "To pick the team that will get the credit",
      "Because the estimate replaces the need for data",
    ],
    explanation: "An estimate with a range and sources lets a team decide whether a fix is worth its cost, before any work begins.",
  },
  // ───────────────────────────── Build ─────────────────────────────
  {
    key: "acceptance-criteria",
    title: "Writing acceptance criteria",
    phase: "build",
    families: ["software", "ai_ml", "product", "design", "operations", "data", "generic"],
    body: `Acceptance criteria turn a vague request into a test that anyone on the team can pass or fail. For this {buildArtifact}, write each criterion as a condition with a number. For example, {metric} must reach {goal} in the {system} for at least two weeks, and no {customer} should see an error that blocks the main path.

Write three kinds of criteria. Functional ones say what the work does. Quality ones set limits, such as response time or accuracy. Operational ones say how it is monitored and who is alerted when it fails. Most weak specs contain only the first kind.

Keep each criterion testable by someone who was not in the room when it was written. If the wording needs a meeting to explain, rewrite it until a stranger could check it.

Treat the constraint as a criterion too. The rule that {constraint} should appear as a line item with its own check, not as a footnote at the bottom of the page.

Put the list at the top of your {memo} before any design. When {stakeholder} asks whether the work is done, point at the list. Every item should be ticked with evidence, not with a feeling. Limit the list to what the first release needs. Eight or ten criteria is plenty.`,
    question: "Which criterion is written in the most testable form?",
    correct: "The metric reaches the goal in the system for two weeks",
    wrong: [
      "The work feels fast and simple to use",
      "The team is happy with the design",
      "The work is delivered on time",
    ],
    explanation: "A testable criterion names a measure, a threshold and a window. Feelings and approvals cannot be checked by a stranger.",
  },
  {
    key: "usability-test",
    title: "Designing a usability test",
    phase: "build",
    families: ["design", "product", "software", "healthcare", "generic"],
    body: `A usability test checks whether a real person can finish a task with your {buildArtifact}. Pick the task that matters most for {metric}, such as completing a request or finding a status, and write it as a scenario: "You need to do this. What would you do?" Do not describe the steps.

Recruit at least five {customers}, and make sure they match the people who will use the {buildArtifact} every day. Five people will show most of the common failures. Ten is better if you want to compare two versions.

Run the session on a prototype or a staging build. Note where each person hesitates, where they pick the wrong path and what they say out loud. Time each task. The goal is to find the first point where a {customer} gets stuck.

Score each task as completed, completed with help, or failed. Report it as a count and a percentage, for example "four out of five completed the task on their own," so the result cannot be inflated.

Change the design for the top two failures before the full build. Retest only those tasks. This keeps each change cheap and tells you whether the fix worked. Put the results and the changes in your {memo}.`,
    question: "Which is the right way to write a task for a usability participant?",
    correct: "Describe the goal as a scenario and do not explain the steps",
    wrong: [
      "Show them the exact button to press first",
      "Tell them the answer before they start",
      "Ask whether they like the design",
    ],
    explanation: "A scenario tells the participant the goal and lets you see what they do. Explaining the steps hides the very problems you are testing for.",
  },
  {
    key: "one-page-brief",
    title: "Writing a one-page brief",
    phase: "build",
    families: "any",
    body: `A one-page brief is the document a busy executive will actually read. It has six parts in this order: the problem in two sentences, the goal with its number, the options you considered, your recommendation, the risks, and the decision you need.

Start with the problem and put the number in the first paragraph. {metric} is at {current} and the goal is {goal}. If the reader only reads that paragraph, they should still know what is at stake and why it matters now.

List two or three options and say why you rejected the others. A brief with one option looks like a sales pitch. A brief with three options looks like thinking.

State the recommendation in one sentence. Then name the risk that worries you most and what you would do if it happened. Put the decision you need and the date you need it by in bold at the bottom.

Keep the whole thing to one page. If you need detail, put it in an appendix and make sure the first page stands alone. {stakeholder} will not open the appendix unless the first page earns it. Send the {buildArtifact} summary to the review group within {deadline}.`,
    question: "What should a one-page brief put first?",
    correct: "The problem with the key number, so the reader knows what is at stake",
    wrong: [
      "A full history of the project",
      "The list of every tool you used",
      "A thank-you note to the team",
    ],
    explanation: "A brief is read top down, often only to the first paragraph. The problem and its number have to come first.",
  },
  {
    key: "smallest-testable",
    title: "Prototyping the smallest testable version",
    phase: "build",
    families: ["product", "design", "software", "marketing", "sales_cs", "generic"],
    body: `The smallest testable version is the least work that can tell you whether the {buildArtifact} will move {metric}. It is not a half-finished product. It is a test with a clear success line.

Start by naming the one assumption that would kill the idea. For example, a {customer} will finish the new path without calling for help. Build only what is needed to test that assumption, even if it means a spreadsheet, a manual step or a mocked screen.

Decide the success line before you show anything. Here the line is {goal} on {metric}, measured on real {customers} over a fixed window. If you do not write the line first, you will find a way to call almost any result a win.

Use what the team already runs, such as {tool1} and {tool2}, before you build anything new. Every new system adds a risk that {constraint} gets broken.

Schedule the review now. A prototype that is not tested within a week is a demo, and demos are not evidence. Bring the result to {stakeholder} with the success line printed above it.`,
    question: "What makes a prototype the smallest testable version?",
    correct: "It is the least work that can test the key assumption against a written success line",
    wrong: [
      "It is a finished product that is ready to ship",
      "It includes every feature in the original spec",
      "It is built in a new tool so it looks modern",
    ],
    explanation: "The smallest testable version is defined by the assumption it tests and the success line set in advance, not by polish.",
  },
  {
    key: "evaluation-metric",
    title: "Choosing an evaluation metric for a model",
    phase: "build",
    families: ["ai_ml", "data"],
    body: `A model needs a number that matches the cost of its mistakes. For {metric}, start by asking what a wrong answer costs. If a missed case is expensive and a false alarm is cheap, favor recall. If false alarms waste the {team} team's time, favor precision.

Build a labeled evaluation set that the model never trains on. Use at least a few hundred examples from the {system}, sampled across the {customers} groups you care about. Hold it fixed, so every version is compared on the same cases.

Always compare against a simple baseline, such as a rule or the current process. If your model only beats a coin flip by a little, the business case is weak even when the number looks impressive. The target here is {goal}, and today's figure is {current}.

Report the metric with a range, not a single number. A result on a few dozen cases can swing a lot, so show the count and the spread next to it.

Track the metric in {tool1} and {tool2} so the next version can be compared fairly. Write down which errors matter most, and show {stakeholder} a few examples of each before the launch decision.`,
    question: "Why build a fixed labeled evaluation set that the model never trains on?",
    correct: "So every model version is compared on the same unseen cases",
    wrong: [
      "So the model learns faster from the labels",
      "So the team can skip the baseline comparison",
      "So the data never needs cleaning",
    ],
    explanation: "A held-out set that stays fixed makes versions comparable. A model scored on its own training data looks better than it is.",
  },
  {
    key: "protocol-people-follow",
    title: "Writing a protocol people will follow",
    phase: "build",
    families: ["healthcare", "operations", "energy_eng", "finance", "generic"],
    body: `A protocol only works if the people using it can follow it under pressure. Write each step as an action with a trigger. For example: when the wait passes 30 minutes, the charge lead calls the duty manager. Vague instructions such as "escalate when needed" fail on the first busy shift.

Keep the protocol to one page with numbered steps, the owner of each step and a time limit. For a metric like {metric}, put the threshold in the first line, so staff can see the target at a glance.

Test the protocol with the people who will use it. Walk through three real cases on a quiet day and note every place someone asks a question. Each question points to a missing word in the document.

Name the checks. Who confirms each step happened, and where is it recorded in the {system}? If nobody can point to the record, the step will drift within a month.

Plan the review. Protocols need a first review date, usually two to four weeks after go-live. {stakeholder} signs the version that goes live, and the signed copy goes into the {buildArtifact} file for the {team} team.`,
    question: "Which feature of a protocol is most likely to make it work on a busy shift?",
    correct: "Each step has a clear trigger, an owner and a time limit",
    wrong: [
      "A long list of background reasons",
      "A reminder to be more careful",
      "Escalating every case to the manager",
    ],
    explanation: "Triggers, owners and time limits turn a document into action. Background and reminders do not change what people do at 3 a.m.",
  },
  {
    key: "data-contract",
    title: "Setting a data quality contract",
    phase: "build",
    families: ["data", "finance", "ai_ml", "software"],
    body: `A data contract is a short written agreement between the team that produces a table and the team that uses it. It says what the table contains, how fresh it must be and what happens when it breaks.

For the {system}, write four clauses. First, the key: every row has one unique identifier, and duplicates are rejected. Second, freshness: the {items} table must update within a set number of hours. Third, completeness: the share of missing values in key columns must stay under a limit. Fourth, ownership: a named person receives the alert.

Turn each clause into an automated check that runs in the pipeline or in {tool1}. A check that runs only when someone remembers is not a check.

Connect the contract to {metric}. If the number on the dashboard depends on this table, the contract protects the number. A broken feed should stop the dashboard from refreshing with bad numbers, not quietly publish them.

Agree the contract with the {team} team before the build. A contract nobody signed will be argued about the first time it fails, and {stakeholder} will ask who approved it.`,
    question: "What should a data contract define for a shared table?",
    correct: "The key, freshness, completeness and a named owner who receives alerts",
    wrong: [
      "The colour scheme of the dashboard",
      "The number of meetings each week",
      "The seniority of the analysts who built it",
    ],
    explanation: "A contract makes the table's promises explicit and testable, and it names who acts when a promise breaks.",
  },
  {
    key: "runbook",
    title: "Writing a runbook",
    phase: "build",
    families: ["software", "operations", "energy_eng", "ai_ml", "generic"],
    body: `A runbook is the page an on-call person opens when something breaks at night. It should let a capable person who has never seen the {system} recover service in a few minutes. Structure it in five parts: the symptom, the checks, the fix, the escalation and the rollback.

Start with the symptom as the first thing a person would notice, such as "the {metric} alert fires" or "the {customers} report a failure." Write each check as a command, a dashboard link or a question with a yes or no answer.

For the fix, list the steps in order and say what success looks like after each one. Include the guardrail limit, {guardrail}, so the person knows when the situation is worse than the runbook covers.

Escalation names a person or team, with the time to wait before calling them. Name {stakeholder} as the decision owner for anything that affects customers.

Rollback comes last and must be tested. Practice it in staging with the {team} team before the first release, and record how long it took. A rollback nobody has rehearsed is a hope, not a plan.`,
    question: "What must a runbook's rollback section have before a release?",
    correct: "A rehearsed procedure with a recorded time",
    wrong: [
      "A link to the company holiday calendar",
      "A promise to fix the issue later",
      "A list of everyone who ever touched the system",
    ],
    explanation: "A rollback is only a plan once someone has run it and timed it. Untested steps usually fail when they are needed most.",
  },
  // ───────────────────────────── Launch ─────────────────────────────
  {
    key: "staged-rollout",
    title: "Staged rollouts and feature flags",
    phase: "launch",
    families: ["software", "ai_ml", "product", "design"],
    body: `A staged rollout releases the {buildArtifact} to a small share of {customers} first, then widens it in waves. A feature flag is the switch that makes this possible. Turn the flag on for one percent, watch, then move to ten, fifty and everyone. Each wave is a decision point, not a formality.

Before wave one, write the criteria for moving to the next wave. For {metric}, the target is {goal}. If the number goes the wrong way or the guardrail {guardrail} breaches its limit, the next wave waits.

Keep the flag simple. It should be on or off per group, and turning it off should restore the old path within minutes without a deploy. Test that path in staging, because it is the one you will need on a bad day.

Watch the cohorts that matter most. Averages hide the {customer} groups that are hurt first. Look at the worst segment as closely as the overall number, and check it every day during each wave.

Tell {team} and {stakeholder} what each wave means in advance. Surprises at the rollout stage are what make people refuse the next change, so the plan should be visible to everyone who will be affected.`,
    question: "What should decide whether a rollout moves to the next wave?",
    correct: "Pre-agreed criteria on the target metric and the guardrail, checked before each wave",
    wrong: [
      "How quickly the team wants to finish the project",
      "Whether the most senior person seems happy",
      "A fixed calendar date regardless of results",
    ],
    explanation: "Waves move on evidence against criteria written in advance. Dates and enthusiasm do not measure safety.",
  },
  {
    key: "pilot-sizing",
    title: "Sizing a pilot so the result means something",
    phase: "launch",
    families: "any",
    body: `A pilot is a limited launch designed to answer a question. Before you start, write the question. In this case: does the {buildArtifact} {lift} {metric} from {current} toward {goal} for {customers} without breaking anything else?

The pilot must be big enough to show that answer. A pilot on a handful of cases can look good by chance. As a rule of thumb, aim for enough cases that a change of the size you expect would be visible above the normal daily swing. Write down the expected size of the change and the number of cases you need to see it.

Choose the pilot group so it looks like the full group. A pilot on the most motivated site or the most engaged team will overstate the result. Include at least one ordinary site and one difficult one.

Set the window. For {volume} {items} a month at full scale, two or three weeks is usually enough to see a pattern and to catch weekly cycles. Do not end the pilot early because the first week looks good.

Report the pilot as a number with its range and the group it came from. In the {team} update, say what the pilot does not tell you, so {stakeholder} does not assume the full rollout will match it.`,
    question: "Why might a pilot on the most engaged site overstate the result?",
    correct: "Those users are already more motivated, so the pilot is not representative",
    wrong: [
      "Engaged users never use new features",
      "Pilots must always run on the smallest site",
      "Engagement data is always deleted after a pilot",
    ],
    explanation: "A pilot needs a group that resembles the full population. Motivated groups inflate results and then disappoint at scale.",
  },
  {
    key: "ab-test-sizing",
    title: "A/B test sizing",
    phase: "launch",
    families: ["marketing", "product", "sales_cs", "data", "software", "design"],
    body: `An A/B test compares two versions on randomly assigned groups. Before you start, decide how big a change you need to detect. If the current {metric} is {current} and the goal is {goal}, the difference you care about is the gap between them.

The smaller the change you want to detect, the more {customers} you need. Use a sample size calculator with three inputs: the current rate, the smallest change that matters, and the confidence level you will accept. Write all three down before the test starts.

Decide the run length in advance. Over {period}, weekday and weekend patterns can differ, so run the test for complete weeks. Stopping early because the chart looks good is the most common way teams fool themselves.

Assign randomly, and check that the two groups look alike on basics such as region and first visit. If they do not, the assignment is broken and the result is not usable.

Report the difference with its range and the number of {customers} in each arm. Tell {stakeholder} what would have to be true for the change to pay back the cost of the new version.`,
    question: "Why should you decide the sample size and run length before the test starts?",
    correct: "Stopping early when the result looks good inflates false wins",
    wrong: [
      "Sample sizes are set by the finance team",
      "It makes the test faster to build",
      "It removes the need for random assignment",
    ],
    explanation: "Peeking and stopping on a good-looking result raises the chance of a false win. Deciding the size and window first protects the conclusion.",
  },
  {
    key: "risk-register",
    title: "Risk registers that people actually read",
    phase: "launch",
    families: "any",
    body: `A risk register lists what could go wrong, how likely it is, how bad it would be and what you will do about it. Most registers are ignored because they are long, vague and never updated. Keep yours short and specific.

Start with the constraint that {constraint} and ask what would break it. Write each risk as a sentence with a cause and an effect, such as "a surge in {items} overloads the {system} at peak and delays the {team} queue." Vague risks like "something might go wrong" cannot be managed.

For each risk, name one early-warning signal you can see before the damage is done. A signal might be a daily count, a complaint pattern or a delay in a sign-off. If you cannot name a signal, you cannot watch the risk.

Give every risk an owner and a response. The response should say what happens in plain words, such as "pause wave two and call {stakeholder}."

Review the register every week during the rollout. Remove risks that have passed, add new ones and show the list in the weekly update. A short register that changes is worth more than a long one that nobody opens. Limit it to five items.`,
    question: "What makes a risk on a register actionable?",
    correct: "A specific cause and effect, an early-warning signal and a named owner",
    wrong: [
      "A long list of every possible problem",
      "A high-level statement that something might go wrong",
      "A score that is never reviewed after the first meeting",
    ],
    explanation: "A risk you can act on has a specific cause, a signal you can see early and an owner who responds to it.",
  },
  {
    key: "stakeholder-updates",
    title: "Stakeholder updates during a rollout",
    phase: "launch",
    families: "any",
    body: `During a rollout, the people who depend on the change need short, regular updates. Send them on the same day each week, so nobody has to ask. The audience is {stakeholder}, who wants to know three things: is it working, is anything wrong, and what do you need from me.

Open with a single line on status: on track, at risk, or paused. Then give the one number that matters, {metric} against the {goal} target, with the change since last week. Readers scan, so put the number before the explanation.

Name what changed this week and why. If a wave was delayed, say the reason in one sentence and the new date. If something broke, say what you did about it and whether any {customers} were affected.

End with the ask. Be specific: a decision, an approval or a person to call. A weekly update without an ask trains readers to skip it.

Keep a log of every update, so the next person can see how the rollout unfolded. The {team} team will need that record when they review the {buildArtifact} later.`,
    question: "What should a weekly rollout update open with?",
    correct: "A one-line status followed by the single number that matters",
    wrong: [
      "A full history of the project since its start",
      "A list of every person who helped",
      "A request for more budget with no supporting numbers",
    ],
    explanation: "Stakeholders scan for status and the key number first. Context and history can follow for anyone who wants it.",
  },
  {
    key: "guardrails-stop-rules",
    title: "Guardrail metrics and stop rules",
    phase: "launch",
    families: "any",
    body: `A guardrail is a metric you protect while you chase the goal. The goal here is {metric} at {goal}. The guardrail is {guardrail}, which must stay within its limit of {guardGoal} during the rollout. Improving one number while breaking the other is not a win.

A stop rule is the written condition that pauses the rollout. It needs a number, a window and an owner. For example: if {guardrail} exceeds its limit for two consecutive days, the {buildArtifact} is paused for the affected {customer} group until the owner reviews it.

Write the stop rule before the first wave starts. People are reluctant to halt a launch they have invested in, so a rule agreed in advance removes the argument from the moment it matters.

Make the rule cheap to act on. The person who can pause should be able to do it in one step, with a rollback that the {team} team has rehearsed. A stop rule that requires three approvals will be used too late.

Test the rule against last month's data. Would it have fired at the right time? If it would have fired on a normal bump, widen the window. Then confirm with {stakeholder} that the rule is what they expect.`,
    question: "What makes a stop rule usable during a live rollout?",
    correct: "A numeric limit, a time window and an owner who can pause in one step",
    wrong: [
      "A vague promise to watch the numbers closely",
      "A rule that needs three approvals before anyone can act",
      "A rule written after the first problem appears",
    ],
    explanation: "A stop rule must be measurable, timely and actionable. Anything that needs debate in the moment will be used too late.",
  },
  // ───────────────────────────── Present ─────────────────────────────
  {
    key: "five-minute-story",
    title: "Telling a five-minute story with numbers",
    phase: "present",
    families: "any",
    body: `A five-minute presentation has room for one story. Structure it as the question, the answer, the evidence and the next step. Spend about a minute on the question, which is why {metric} matters. It is at {current} against a goal of {goal}, and {stakeholder} already knows the problem. Do not spend longer than that on background.

Give the answer in the second minute. Name the top cause, {cause1}, or the approach you recommend, and say how confident you are. Confidence is a sentence, not a feeling: say what the data shows and what it cannot show.

Use the evidence for the middle minutes. Show one chart per point, with the count behind every rate. Read the number out loud once, so the listener can hold it.

Finish with the next step: what you would do within {deadline}, who owns it and what result would change the plan. A presentation that ends with a clear next step gets a decision. One that ends with a summary gets applause and nothing else.

Rehearse it once with a timer. If you run long, cut the background, not the evidence.`,
    question: "What should take up the most time in a five-minute presentation?",
    correct: "The answer and the evidence behind it, ending with a clear next step",
    wrong: [
      "The history of the project and the people involved",
      "Every chart you built during the work",
      "A slow walk through the tools you used",
    ],
    explanation: "Decision makers need the answer, the evidence and a next step. Background should be brief and extra charts are noise.",
  },
  {
    key: "caveats-first",
    title: "Putting caveats up front",
    phase: "present",
    families: "any",
    body: `A caveat is a limit on what your result can tell the reader. In this project, the most important one is that {caveat}. If you bury that in an appendix, the reader will find it later and trust you less.

Say the caveat in the first two minutes, before the headline. The reader should hear the number and its limit in the same breath. For example: {metric} moved, and the change is clear for {segment1} but weaker for {segment2}, because the sample there is small.

Explain how each caveat changes the decision. Some limits do not matter for the choice in front of {stakeholder}, and you should say so. Others could reverse it, and those are the ones to name clearly.

Show what you did about each caveat. You may have excluded a group, widened a window or run a second check. Each step makes the result more believable than a clean chart without explanation.

Close by saying what would resolve the caveat and when you can know. That turns a limitation into a plan. A reader who sees the limits and the path to resolving them usually trusts the recommendation more, not less. Keep the caveat slide to three bullets.`,
    question: "Where should a major caveat appear in a presentation?",
    correct: "Early, stated in the same breath as the headline number",
    wrong: [
      "In the appendix, where the detail belongs",
      "Only if someone in the room asks about it",
      "Removed, so the result looks more confident",
    ],
    explanation: "Stating a limit next to the headline keeps the reader from being surprised later, and it makes the recommendation more credible.",
  },
];

const PHASE_FOR_ARCHETYPE: Record<"diagnose" | "build" | "launch", LearnPhase[]> = {
  diagnose: ["diagnose", "diagnose", "build"],
  build: ["build", "build", "launch"],
  launch: ["launch", "launch", "launch"],
};

export { PHASE_FOR_ARCHETYPE };

/**
 * Picks an unused topic for a phase. Topics written for the learner's family are preferred,
 * with generic topics as the fallback. Never repeats a topic within one scenario.
 */
export function pickLearnTopic(rng: Rng, phase: LearnPhase, family: FamilyId, used: Set<string>): LearnTopic {
  const open = LEARN_TOPICS.filter((t) => t.phase === phase && !used.has(t.key));
  const specific = open.filter((t) => t.families !== "any" && t.families.includes(family));
  const generic = open.filter((t) => t.families === "any");
  let pool: LearnTopic[];
  if (specific.length > 0 && (generic.length === 0 || rng.chance(0.7))) pool = specific;
  else if (generic.length > 0) pool = generic;
  else pool = LEARN_TOPICS.filter((t) => !used.has(t.key));
  if (pool.length === 0) throw new Error("pathgen: learn library exhausted");
  const topic = rng.pick(pool);
  used.add(topic.key);
  return topic;
}
