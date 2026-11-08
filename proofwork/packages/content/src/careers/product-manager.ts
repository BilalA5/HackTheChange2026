import type { CareerPack } from "../types.ts";

// Product Manager career pack. Fictional companies only.
// Loop per scenario: brief -> narrated kickoff (problem / outcome / process) -> spoken PoU -> Plan/Do/Learn stages -> presentation.

const pack: CareerPack = {
  career: {
    id: "product-manager",
    title: "Product Manager",
    tagline: "Decide what to build, why it matters, and how you will know it worked.",
    description:
      "Product managers turn messy evidence into a clear decision: which problem to solve, what the team should ship first, and what success looks like in numbers. You will diagnose real drop-offs, write requirements engineers can build from, design experiments that hold up, and recommend launches to leaders who ask hard questions.",
    skills: [
      "Product discovery",
      "Metrics and funnel analysis",
      "Prioritization with RICE",
      "Roadmapping",
      "Experiment design",
      "Requirements writing (PRDs)",
      "Go-to-market planning",
      "Stakeholder communication",
    ],
    color: "#F2A33A",
  },

  companies: [
    {
      id: "harbourmeal",
      name: "Harbourmeal",
      industry: "Food delivery",
      tagline: "Hot food, close by, in under thirty minutes.",
      color: "#E4572E",
      glyph: "HM",
      building: "campus",
    },
    {
      id: "ledgerlark",
      name: "Ledgerlark",
      industry: "Consumer fintech",
      tagline: "Banking that opens in minutes, not weeks.",
      color: "#2A7F62",
      glyph: "LL",
      building: "tower",
    },
    {
      id: "quillbox",
      name: "Quillbox",
      industry: "B2B note-taking software",
      tagline: "Notes that teams can actually find again.",
      color: "#6C5CE7",
      glyph: "QB",
      building: "loft",
    },
  ],

  npcs: [
    {
      id: "npc-nadia-brennan",
      name: "Nadia Brennan",
      role: "Group Product Manager, Courier Growth",
      companyId: "harbourmeal",
      personality:
        "Direct and numbers first. She asks what would change your mind before she asks what you recommend, and she cuts short any story that never reaches a decision. She has been burned by roadmaps built on survey quotes, so she wants the sample size before the insight.",
      voice: { rate: 1.0, pitch: 1.05 },
      avatarSeed: "nadia-brennan",
    },
    {
      id: "npc-mateo-ruiz",
      name: "Mateo Ruiz",
      role: "Head of Product, Identity and Onboarding",
      companyId: "ledgerlark",
      personality:
        "Calm, careful and deeply aware of regulators. He will challenge any idea that trades customer trust for conversion, and he always asks what the stop condition is. He speaks slowly, pauses before he pushes back, and gives credit when a plan is honest about its risks.",
      voice: { rate: 0.94, pitch: 0.9 },
      avatarSeed: "mateo-ruiz",
    },
    {
      id: "npc-corinne-adeyemi",
      name: "Corinne Adeyemi",
      role: "Director of Product, Teams",
      companyId: "quillbox",
      personality:
        "Energetic, commercial and quick. She thinks in tradeoffs between revenue, sales velocity and roadmap focus, and she wants the recommendation in the first minute. She respects a PM who admits uncertainty but gets impatient with vague answers.",
      voice: { rate: 1.06, pitch: 1.12 },
      avatarSeed: "corinne-adeyemi",
    },
  ],

  scenarios: [
    // ───────────────────────────── Scenario 1 ─────────────────────────────
    {
      id: "pm-driver-churn",
      careerId: "product-manager",
      companyId: "harbourmeal",
      npcId: "npc-nadia-brennan",
      order: 1,
      title: "Diagnose Driver Churn at Harbourmeal",
      coverWord: "RETAIN COURIERS",
      problemStatement:
        "Courier 30-day retention has fallen from 41 percent in the spring to 33 percent this September across six cities. Exit-survey answers point to payout timing and unpredictable batch offers, but the funnel data suggests a different leak. Diagnose the drop, rank the opportunities with RICE, and propose a Q1 2027 roadmap that two engineering squads can staff.",
      userRole: "Product Manager, Courier Growth",
      projectType: "Churn diagnosis and quarter roadmap",
      difficulty: "beginner",
      estMinutes: 150,
      maxXp: 1410,
      tools: ["Google Sheets", "SQL", "Amplitude", "Notion"],
      workflows: [
        "Exit-survey theme coding",
        "Retention cohort analysis",
        "Onboarding funnel analysis",
        "RICE prioritization",
        "Quarter roadmap planning",
      ],
      skills: [
        "Qualitative synthesis",
        "Cohort analysis",
        "RICE scoring",
        "Roadmapping",
        "Marketplace economics",
      ],
      deliverables: [
        {
          title: "Churn diagnosis memo",
          description:
            "A two-page memo with the coded survey themes, the cohort and funnel findings, and three ranked hypotheses, each tied to a stage and a number.",
          kind: "file",
        },
        {
          title: "Prioritized Q1 2027 roadmap",
          description:
            "A RICE scoring sheet with at least five opportunities, the top three placed on a quarter roadmap with owners, dependencies and milestones.",
          kind: "url",
        },
      ],
      kickoff: {
        segments: [
          {
            id: "pm-driver-churn-k1",
            title: "The problem: couriers are leaving faster than we can replace them",
            noteSection: "problem",
            slides: [
              {
                heading: "Couriers are leaving faster than we can onboard them",
                bullets: [
                  "30-day retention fell from 41 percent to 33 percent since spring",
                  "About 8,000 couriers a month sign up and then disappear",
                ],
                visual: "metric",
                metric: { label: "30-day courier retention", value: "33%" },
              },
              {
                heading: "Why couriers say they leave",
                bullets: [
                  "3,200 couriers who left last quarter answered the exit survey",
                  "Payout timing and batch offers make up most of the complaints",
                ],
                visual: "chart",
                chart: [
                  { label: "Payout timing", value: 31 },
                  { label: "Unpredictable batch offers", value: 26 },
                  { label: "Long restaurant waits", value: 19 },
                  { label: "Navigation and address issues", value: 14 },
                  { label: "Safety", value: 10 },
                ],
              },
              {
                heading: "In their words",
                bullets: ["Replacement cost is about 180 dollars per courier"],
                visual: "quote",
                quote: {
                  text: "I cannot plan my rent around a payout that moves every week.",
                  author: "Courier, Riverside market, exit survey",
                },
              },
            ],
            transcript:
              "Thanks for joining. Here is the problem. Thirty-day courier retention has dropped from 41 percent last spring to 33 percent this September across our six cities. That is roughly 8,000 couriers a month who sign up and then disappear, and each replacement costs us about 180 dollars in sign-up bonuses and training. We surveyed 3,200 couriers who left last quarter. The research team coded the open answers, and the top complaint is payout timing at 31 percent. Unpredictable batch offers come second at 26 percent, and long waits at restaurants come third. I do not want you to repeat those percentages back to me. I want you to tell me what is really driving the drop.",
            rubricPoints: [
              "States the 30-day retention drop from 41 to 33 percent",
              "Notes the cost of replacing a courier",
              "Names payout timing and batch offers as the top exit themes",
              "Separates what couriers said from what the data shows",
            ],
            checkpointPrompt:
              "In one or two sentences, write the problem as you understand it, including the size of the drop and who it affects.",
          },
          {
            id: "pm-driver-churn-k2",
            title: "The outcome: a Q1 2027 target and a roadmap leaders can fund",
            noteSection: "outcome",
            slides: [
              {
                heading: "Target for Q1 2027",
                bullets: [
                  "Raise 30-day courier retention from 33 percent to 39 percent",
                  "Keep roughly 5,000 more couriers active each month",
                ],
                visual: "metric",
                metric: { label: "30-day retention goal", value: "39%" },
              },
              {
                heading: "How we get there",
                bullets: [
                  "Diagnose before we build",
                  "Rank opportunities with RICE",
                  "Commit a roadmap two squads can staff",
                ],
                visual: "flow",
                flow: ["Diagnose the drop", "Rank opportunities", "Commit the roadmap", "Review with leadership"],
              },
              {
                heading: "Where applicants drop out",
                bullets: ["Counts are per 100 applicants in a typical month"],
                visual: "chart",
                chart: [
                  { label: "Applied", value: 100 },
                  { label: "Passed checks", value: 58 },
                  { label: "First delivery", value: 44 },
                  { label: "Active in week four", value: 21 },
                ],
              },
            ],
            transcript:
              "Here is the outcome we are signing up for. By the end of Q1 2027 I want 30-day courier retention back at 39 percent, which keeps roughly 5,000 more couriers active each month. Your job is to find where the drop starts. The funnel is the second clue. Of every 100 applicants, 58 pass background and identity checks, 44 make a first delivery, and only 21 are still active in week four. The gap that surprises me sits after that first delivery. You will need a roadmap that Leadership can fund, which means showing the trade-offs between payout changes, dispatch changes and onboarding changes. Keep the scope honest. We have two engineering squads and no appetite for a dispatch rewrite this year.",
            rubricPoints: [
              "Restates the Q1 2027 target of 39 percent 30-day retention",
              "Points to the funnel gap between first delivery and week four",
              "Names the scope limits: two squads and no dispatch rewrite",
              "Frames the work as a prioritized roadmap with trade-offs",
            ],
            checkpointPrompt:
              "Write the outcome in one sentence with a number and a deadline, and note the constraint that matters most.",
          },
          {
            id: "pm-driver-churn-k3",
            title: "The process: how we will run the work",
            noteSection: "process",
            slides: [
              {
                heading: "How we will work",
                bullets: ["Plan the scope with Nadia first", "Then analyze, score and present"],
                visual: "flow",
                flow: ["Plan scope", "Do analysis and scoring", "Learn the method", "Present to Nadia"],
              },
              {
                heading: "Time to a first readout",
                bullets: ["Data pulls are ready and waiting in the warehouse"],
                visual: "metric",
                metric: { label: "Working days to first readout", value: "10" },
              },
              {
                heading: "What good looks like",
                bullets: ["Assumptions written down and evidence behind every score"],
                visual: "quote",
                quote: {
                  text: "Show me the number you would bet your bonus on.",
                  author: "Nadia Brennan, Group Product Manager",
                },
              },
            ],
            transcript:
              "For process, here is how we will run this. You will plan the scope with me first, then do the analysis, then learn the method in short sessions before you score anything. The data is ready. You have read access to the survey export, the courier cohort tables and the funnel events in our warehouse. Please do not start with a solution. I have seen too many roadmaps that begin with an idea and end with a chart that fits it. For each stage I want your assumptions written down and the evidence behind every score. When you present, keep it to the decision, the number behind it and the one trade-off I should worry about. Ask me anything in Plan mode, and expect me to push back.",
            rubricPoints: [
              "Describes the Plan, Do, Learn and Present sequence",
              "Names the sources: survey export, cohort tables and funnel events",
              "Commits to written assumptions and evidence for each score",
              "Keeps the presentation focused on the decision and the trade-off",
            ],
            checkpointPrompt:
              "Note how you will run the work, which data you will use, and what evidence you will show for each score.",
          },
        ],
      },
      pou: [
        {
          id: "pm-driver-churn-q1",
          prompt:
            "The retention number dropped, and the survey says payouts. Why is that not enough to decide what to build?",
          rubricPoints: [
            "Survey answers are stated reasons, not proof of cause",
            "Cohort and funnel data show when and where the drop starts",
            "A good decision tests the hypothesis against behavior",
          ],
          followUp:
            "Suppose payouts are the top complaint, but couriers who received faster payouts still churn at the same rate. What does that tell you?",
        },
        {
          id: "pm-driver-churn-q2",
          prompt: "How would you use RICE to choose between instant payouts and a better batch offer algorithm?",
          rubricPoints: [
            "Reach counts the couriers affected each quarter",
            "Impact is tied to retention, not to feature count",
            "Confidence reflects the strength of the evidence",
            "Effort comes from engineering estimates, stated in weeks",
          ],
          followUp: "Your Confidence score for batch offers is low. What would you need to see to raise it?",
        },
        {
          id: "pm-driver-churn-q3",
          prompt:
            "The survey points to restaurant wait times, but the funnel points to onboarding. Which do you believe, and what do you do next?",
          rubricPoints: [
            "Treats the two sources as answers to different questions",
            "Proposes a cohort split or a small test to resolve the disagreement",
            "Does not drop the minority signal without checking it",
          ],
          followUp:
            "Assume a test is not possible this quarter. How do you present that disagreement to leadership?",
        },
      ],
      stages: [
        {
          id: "pm-driver-churn-s1",
          order: 1,
          title: "Code the exit survey into themes",
          summary:
            "Turn 3,200 open-ended exit responses into a short, defensible list of themes, with counts and quotes you can stand behind.",
          estMinutes: 30,
          kind: "work",
          requirements: [
            "Tag every response into no more than eight themes, each with a one-line definition",
            "Double-code a sample of at least 300 responses and report the agreement rate",
            "Explain how you counted responses that mention more than one theme",
            "Give each theme a count, a share of respondents and one representative quote",
            "Flag the two themes most likely to be fixed by a product change",
          ],
          planOpener:
            "Before you open the export, here is what I need. I think we can get the 3,200 responses into eight themes or fewer, and I want a second coder on a sample so we know the labels hold up. Does that feel like the right size, or would you rather split payouts into timing and amount?",
          learn: [
            {
              id: "pm-driver-churn-s1-l1",
              title: "Coding open-ended survey answers",
              minutes: 5,
              body: `Open-ended answers tell you why people left, but only if you code them consistently. Start with a codebook before you read past the first fifty responses.

**Steps**

1. Read 50 responses and write candidate themes in plain words.
2. Merge themes until you have eight or fewer. Each theme needs a one-line definition and a boundary, meaning what does not count.
3. Code the full set. A response can carry more than one theme.
4. Double-code a random sample of 300. Compare labels and record the agreement rate.

**Codebook template**

| Theme | Definition | Counts when | Does not count when | Example |
|---|---|---|---|---|
| Payout timing | Complaint about when or how often pay arrives | Mentions delay, schedule or weekly cadence | Complains about the amount only | "Pay lands on Friday, not Monday" |

**Reporting**

Show the count, the share of respondents and one quote per theme. Because multi-theme answers overlap, the shares will add up to more than 100 percent. Say so in a footnote instead of hiding it.

**Common traps**

Do not invent a theme for every odd comment. Do not drop the answers you cannot code. List them as other, with a count. If two themes always appear together, check whether they are really one problem.`,
              check: {
                question:
                  "A response says payouts are late and the batch offers are unfair. How should you count it?",
                options: [
                  "Pick the first theme mentioned and drop the rest",
                  "Count it under both themes and note the overlap",
                  "Discard it because it is unclear",
                  "Create a new theme just for it",
                ],
                answerIndex: 1,
                explanation:
                  "Multi-theme answers are real signal. Counting them under each theme and reporting the overlap keeps the shares honest.",
              },
            },
          ],
          submission: {
            kinds: ["file", "text"],
            instructions:
              "Upload your codebook as a file with the theme name, definition, example and count for each theme. Paste a short text note with the second-coder agreement rate and the two themes you flagged for a product change.",
          },
          rubricHints: {
            understanding:
              "Explains why survey answers describe stated reasons rather than causes, and states the coding rules clearly.",
            quality:
              "Themes are distinct and consistently applied, backed by a double-coded sample with a reported agreement rate.",
            communication:
              "The codebook is readable by someone outside the research team, with a definition and an example for each theme.",
            independence:
              "Chooses the coding scheme and sample size without a template, and explains each judgment call.",
          },
          xp: 180,
        },
        {
          id: "pm-driver-churn-s2",
          order: 2,
          title: "Map the funnel and courier cohorts",
          summary:
            "Find where couriers stop and when churn starts, so each hypothesis points at a specific stage instead of a feeling.",
          estMinutes: 40,
          kind: "work",
          requirements: [
            "Build a weekly cohort table of 30-day retention by start month and city",
            "Show the onboarding funnel from applicant to week-four active, with counts and percentages at each step",
            "Compare churn for couriers with a week-one payout delay against those without, and state the selection bias",
            "Write three ranked hypotheses, each tied to a specific stage and a specific number",
          ],
          planOpener:
            "Okay, now the numbers. My instinct says the leak is between the first delivery and week four, but I want you to prove it or prove me wrong. I would start with the cohort table by city. If the drop is everywhere it is a product problem, and if it is only in two cities it is probably local. Which cities would you check first, and how will you cut the cohorts?",
          learn: [
            {
              id: "pm-driver-churn-s2-l1",
              title: "Reading a retention cohort table",
              minutes: 6,
              body: `A cohort table groups couriers by the week they started, then tracks how many are still active over time. It is the fastest way to see whether a drop is getting worse, staying flat, or affecting only one group.

**Template**

| Start month | City | Starters | Active day 30 | Retention |
|---|---|---|---|---|
| Jun 2026 | Riverside | 1,240 | 468 | 37.7% |
| Jul 2026 | Riverside | 1,310 | 439 | 33.5% |

**How to read it**

Read down a column to compare cohorts at the same age. Read across a row to see how one cohort ages. A cohort that starts lower and falls faster points to onboarding. A healthy start that fades points to earnings or dispatch.

**Comparisons need care**

If you compare couriers who had a payout delay against those who did not, ask what else differs. Couriers with few deliveries may both get delayed payouts and quit early. That shared cause is selection bias. State it next to the gap, and look for a fairer comparison, such as couriers with similar delivery counts in week one.

**Before you present**

Confirm the denominator. Starters should be couriers who passed checks and made at least one attempt to log in. Write that definition in a footnote, because a changed definition can make a trend look real when it is not.`,
              check: {
                question:
                  "Couriers with a week-one payout delay churn at 46 percent, and everyone else churns at 31 percent. What is the most important caveat?",
                options: [
                  "The sample is too small to matter",
                  "Couriers who quit early may have been more likely to be delayed, so the gap may not be causal",
                  "Payouts never cause churn",
                  "Retention should be measured in week two instead",
                ],
                answerIndex: 1,
                explanation:
                  "The delay and the churn may both come from a shared cause, such as low delivery volume. Name that caveat before you present the gap as a cause.",
              },
            },
          ],
          submission: {
            kinds: ["url", "file", "text"],
            instructions:
              "Share a link to your sheet or notebook with the cohort table and the funnel. Add a text summary of the three ranked hypotheses with the number behind each one.",
          },
          rubricHints: {
            understanding:
              "Reads cohort and funnel tables correctly, and recognizes selection bias when comparing groups.",
            quality:
              "Cohort cuts are clean, the funnel math reconciles to the totals, and each hypothesis is tied to a stage and a number.",
            communication:
              "Hypotheses are written so a non-analyst can see what evidence would change each one.",
            independence:
              "Chooses the cuts and comparisons that matter without waiting for each one to be specified.",
          },
          xp: 200,
        },
        {
          id: "pm-driver-churn-s3",
          order: 3,
          title: "Score opportunities with RICE and draft the Q1 roadmap",
          summary:
            "Turn the diagnosis into a ranked list of opportunities and a quarter plan that engineering can actually staff.",
          estMinutes: 35,
          kind: "work",
          requirements: [
            "Score at least five opportunities with Reach, Impact, Confidence and Effort, showing the RICE formula and inputs",
            "Justify every Confidence score with a named source from the survey or the funnel",
            "Place the top three opportunities on a Q1 2027 roadmap with owners, dependencies and a milestone for each",
            "Name one opportunity you would explicitly not fund this quarter, and say why",
          ],
          planOpener:
            "Here is where I want your head. Five or six opportunities is plenty. I care less about the formula and more about whether Confidence is honest. Reach should be couriers per quarter, not app users. Which opportunities are you planning to score, and do we have an engineering estimate for the payout work, or should we assume two squads for twelve weeks?",
          learn: [
            {
              id: "pm-driver-churn-s3-l1",
              title: "RICE scoring without fooling yourself",
              minutes: 6,
              body: `RICE scores an opportunity as Reach times Impact times Confidence, divided by Effort. It is only as honest as its inputs, and the input most likely to be inflated is Confidence.

**Define each input**

- **Reach:** how many couriers the change touches in one quarter. Count couriers, not app sessions.
- **Impact:** the effect per courier on the outcome you care about. Use a scale such as 3 for massive, 2 for high, 1 for medium and 0.5 for low.
- **Confidence:** how sure you are about Reach and Impact, from 100 percent for direct data down to 50 percent for a hunch.
- **Effort:** engineer-weeks across all teams, not just the first sprint.

**Scoring sheet**

| Opportunity | Reach | Impact | Confidence | Effort | RICE | Source for Confidence |
|---|---|---|---|---|---|---|
| Faster payout option | 9,000 | 2 | 80% | 6 | 2,400 | Payout delay cohort and funnel |

**Guardrails for honest scores**

Write a source for every Confidence value, even if it says team judgment, low. Do not let the most senior voice set Impact alone. Re-score after new evidence, and say what changed.

**Roadmap check**

The top three scores should fit the squads you have. If an item depends on another team, put it on the roadmap with a dependency note rather than inflating its score.`,
              check: {
                question: "Which RICE input is most likely to be inflated by a team that is excited about an idea?",
                options: ["Reach", "Impact", "Confidence", "Effort"],
                answerIndex: 2,
                explanation:
                  "Confidence is the team's own estimate of how sure it is, so enthusiasm pushes it up. Requiring a source for every Confidence score keeps it honest.",
              },
            },
          ],
          submission: {
            kinds: ["file", "url"],
            instructions:
              "Upload or link your RICE sheet and roadmap. Include the formula, every score, the source for each Confidence value, and the one opportunity you chose not to fund.",
          },
          rubricHints: {
            understanding:
              "Explains what each RICE input measures, and why Reach is counted in couriers rather than app sessions.",
            quality:
              "Scores are internally consistent, Confidence is backed by sources, and the roadmap includes dependencies and milestones.",
            communication:
              "The roadmap and scoring sheet are readable in five minutes and show the reasoning behind the ranking.",
            independence:
              "Makes the ranking calls and defends the one unfunded opportunity without waiting for Nadia to choose.",
          },
          xp: 220,
        },
        {
          id: "pm-driver-churn-s4",
          order: 4,
          title: "Present the diagnosis and roadmap to Nadia",
          summary:
            "Record a short recommendation that leads with the retention problem, the ranking and the trade-off you are willing to accept.",
          estMinutes: 25,
          kind: "presentation",
          requirements: [
            "Open with the retention number, the Q1 2027 target and the cost of doing nothing",
            "Walk through the top three opportunities and the RICE ranking, in order of impact",
            "Name at least one trade-off you are accepting, and what you would give up if leadership says no",
            "Answer one challenge from Nadia on a number you used, without changing the number",
            "Keep the recording between 6 and 8 minutes",
          ],
          planOpener:
            "This is the last stage, and I will be honest, I want a recommendation, not a tour of your spreadsheet. Give me the decision in the first minute. What are you asking leadership to fund, and what evidence would make you change your mind? Tell me the order you will present in, and I will pick one number to challenge.",
          learn: [
            {
              id: "pm-driver-churn-s4-l1",
              title: "Structuring a five-minute recommendation",
              minutes: 5,
              body: `A recommendation is a decision with evidence attached. A senior reader should know what you want within the first minute. A tour of the dashboard is not a substitute.

**Structure**

1. **Decision** (30 seconds): what you are asking the leader to approve.
2. **Problem** (60 seconds): the number that matters, with its baseline and target.
3. **Ranking** (90 seconds): the top three opportunities and why they beat the rest.
4. **Trade-off** (45 seconds): what you accept by doing this, and what you give up if the answer is no.
5. **Next step** (30 seconds): the first milestone and the date you will report back.

**Speaking notes**

Say the number, then say what it means. "Retention is 33 percent, down eight points since spring, so we lose about 8,000 couriers a month" is far better than a chart title alone.

**When challenged**

Repeat the question in your own words, answer the specific number, and say what would change your view. If you do not know, say so and give the date you will know.

**Practice**

Record yourself once and time it. Cut anything that repeats a slide.`,
              check: {
                question: "Which opening best fits a recommendation to a Head of Product?",
                options: [
                  "A history of how the survey was designed",
                  "The decision you want, the number behind it and the cost of waiting",
                  "A list of every opportunity you scored",
                  "An apology for the limits of the data",
                ],
                answerIndex: 1,
                explanation:
                  "Leaders need the decision first, then the number that justifies it and the cost of delay. History and apologies come later, if at all.",
              },
            },
          ],
          submission: {
            kinds: ["recording"],
            instructions:
              "Record a 6 to 8 minute video of your recommendation with your slides or screen visible. Keep the decision in the first minute and leave two minutes for Nadia's questions.",
          },
          rubricHints: {
            understanding:
              "Explains the retention problem and the logic of the ranking in plain terms, including the limits of the data.",
            quality:
              "The recommendation follows from the evidence, the numbers match the earlier stages, and the trade-off is real.",
            communication:
              "Opens with the decision, speaks clearly to a senior audience, and handles a challenge without getting defensive.",
            independence:
              "Frames the recommendation and answers the challenge with their own judgment, not by reciting prompts.",
          },
          xp: 260,
        },
      ],
      map: { x: 14, y: 60 },
    },

    // ───────────────────────────── Scenario 2 ─────────────────────────────
    {
      id: "pm-id-verify-dropoff",
      careerId: "product-manager",
      companyId: "ledgerlark",
      npcId: "npc-mateo-ruiz",
      order: 2,
      title: "Fix Sign-Up Drop-Off at Ledgerlark",
      coverWord: "UNBLOCK ONBOARDING",
      problemStatement:
        "Thirty-eight percent of the 120,000 people who start identity verification each month leave before their account opens, and document capture is the biggest drop. Support is handling about 9,000 verification contacts a month. Write a PRD for a fix that stays inside regulatory and fraud limits, design an A/B experiment with success metrics and guardrails, and define the staged rollout.",
      userRole: "Product Manager, Identity and Onboarding",
      projectType: "PRD, experiment design and rollout plan",
      difficulty: "intermediate",
      estMinutes: 170,
      maxXp: 1450,
      tools: ["SQL", "Amplitude", "Figma", "Google Sheets", "Notion"],
      workflows: [
        "Funnel analysis and segmentation",
        "Session and ticket tagging",
        "PRD writing",
        "A/B test design",
        "Staged rollout planning",
      ],
      skills: [
        "Funnel analysis",
        "Requirements writing",
        "Experiment design",
        "Statistical power",
        "Risk and guardrail management",
      ],
      deliverables: [
        {
          title: "Verification fix PRD",
          description:
            "A PRD with goals, non-goals, testable requirements, the unchanged regulatory checks, guardrails, and a risks table with owners.",
          kind: "file",
        },
        {
          title: "A/B experiment brief and rollout plan",
          description:
            "A brief with the sample size calculation, metric table, ramp schedule with go and stop checks, and the expected lift range.",
          kind: "url",
        },
      ],
      kickoff: {
        segments: [
          {
            id: "pm-id-verify-dropoff-k1",
            title: "The problem: verification is losing too many good customers",
            noteSection: "problem",
            slides: [
              {
                heading: "Verification loses nearly two in five starters",
                bullets: ["About 120,000 people start verification each month"],
                visual: "metric",
                metric: { label: "Users who abandon verification", value: "38%" },
              },
              {
                heading: "Where they leave",
                bullets: ["Document capture is the largest share of abandonment"],
                visual: "chart",
                chart: [
                  { label: "Document capture", value: 44 },
                  { label: "Selfie liveness", value: 27 },
                  { label: "Address entry", value: 16 },
                  { label: "Consent screens", value: 13 },
                ],
              },
              {
                heading: "What customers tell support",
                bullets: ["About 9,000 verification contacts last month"],
                visual: "quote",
                quote: {
                  text: "My phone camera keeps rejecting a passport I can read fine.",
                  author: "Customer interview, March research round",
                },
              },
            ],
            transcript:
              "Welcome to the onboarding problem. Each month about 120,000 people start identity verification with us. Thirty-eight percent of them leave before their account opens. That is a lot of people who wanted a checking account and gave up on the way. The biggest share of that drop, 44 percent, happens on the document capture screen, and selfie liveness is next at 27 percent. Our support team logged about 9,000 contacts last month about verification, and many say the camera rejected a document they could read fine. Remember that regulators watch this flow closely. We cannot simply remove checks. Find the friction that is not a safety check, and make it go away.",
            rubricPoints: [
              "States the 38 percent abandonment rate and the monthly volume",
              "Identifies document capture as the largest drop-off step",
              "Recognizes that the checks are regulated and cannot simply be removed",
              "Links the friction to support contacts or customer quotes",
            ],
            checkpointPrompt:
              "Write the problem in one or two sentences, including the abandonment rate, the step where it happens and the regulatory constraint.",
          },
          {
            id: "pm-id-verify-dropoff-k2",
            title: "The outcome: a completion target with guardrails that cannot break",
            noteSection: "outcome",
            slides: [
              {
                heading: "Completion target",
                bullets: ["Baseline is 62 percent of verification starts completing today"],
                visual: "metric",
                metric: { label: "Verification completion target", value: "66%" },
              },
              {
                heading: "How the work flows",
                bullets: ["Each step has a clear output and an owner"],
                visual: "flow",
                flow: ["Scope the fix", "Write the PRD", "Test with an experiment", "Roll out in stages"],
              },
              {
                heading: "Where we stand",
                bullets: ["Four points of completion rate, about 4,800 accounts a month"],
                visual: "chart",
                chart: [
                  { label: "Today", value: 62 },
                  { label: "Target", value: 66 },
                  { label: "Stretch goal", value: 70 },
                ],
              },
            ],
            transcript:
              "Here is what success looks like. We want verification completion to rise from 62 percent to 66 percent by the end of the first quarter. That is about 4,800 more accounts opened each month, and it is the number I will hold you to. It is not the only number. Fraud loss today sits at 0.4 percent of new accounts, and our risk team has told us that anything above 0.45 percent is a stop sign. False rejects for real customers are at 2.8 percent and must not climb past 3.2 percent. You will write a PRD that mobile and risk can build from, then design an experiment that proves the lift without breaking those guardrails. Our two squads have about eight weeks of capacity.",
            rubricPoints: [
              "Restates the 66 percent completion target from a 62 percent baseline",
              "Names the fraud loss and false reject guardrails with their thresholds",
              "Frames the deliverables as a PRD and an experiment brief",
              "Mentions the constraint of eight weeks of squad capacity",
            ],
            checkpointPrompt:
              "Write the outcome as a target with a baseline, a deadline and the guardrails that cannot be broken.",
          },
          {
            id: "pm-id-verify-dropoff-k3",
            title: "The process: plan, do, learn and present the rollout",
            noteSection: "process",
            slides: [
              {
                heading: "How we will work",
                bullets: ["Agree scope with Mateo before anything gets built"],
                visual: "flow",
                flow: ["Plan scope with Mateo", "Do diagnosis, PRD and test design", "Learn the method", "Present the rollout"],
              },
              {
                heading: "Sample size for the test",
                bullets: ["Needed to detect a 1.5 point lift at 80 percent power"],
                visual: "metric",
                metric: { label: "Users per arm", value: "16,500" },
              },
              {
                heading: "What a good rollout includes",
                bullets: ["Stop conditions come before the ramp schedule"],
                visual: "quote",
                quote: {
                  text: "Tell me what would make you stop the test. Then tell me what you would ship.",
                  author: "Mateo Ruiz, Head of Product",
                },
              },
            ],
            transcript:
              "Now, the way we will work. We start in Plan mode, so you and I agree on scope before anything gets built. Then you move into the diagnosis, the PRD and the test design. Learn sessions are there when you need a method, such as how to size a test or how to write requirements that engineers can build against. Our analytics team has the funnel events and the verification logs ready, and the experiment platform is set up for holdouts. Please do not promise a number you cannot defend. When you present the rollout, I want the stop conditions first, then the ramp schedule, then the owners. If you cannot tell me what would make us stop, the plan is not finished.",
            rubricPoints: [
              "Describes the Plan, Do, Learn and Present sequence",
              "Names the data sources: funnel events, verification logs and the experiment platform",
              "Requires stop conditions before the ramp schedule",
              "Sets the expectation for a defensible rather than optimistic number",
            ],
            checkpointPrompt:
              "Note the process, the data you will use, and what the rollout must include before it can be approved.",
          },
        ],
      },
      pou: [
        {
          id: "pm-id-verify-dropoff-q1",
          prompt:
            "Why would you not simply remove the document capture check to lift completion?",
          rubricPoints: [
            "The check is regulated and protects against fraud",
            "Friction that is not a safety check can be fixed instead",
            "A fix must keep fraud and false rejects inside the guardrails",
          ],
          followUp:
            "Suppose most camera rejects come from lighting and cropping. Which fix would you prioritize, and what would it cost the risk team?",
        },
        {
          id: "pm-id-verify-dropoff-q2",
          prompt: "How would you define the primary metric and guardrails for the experiment?",
          rubricPoints: [
            "The primary metric is completion from verification start to account open",
            "Guardrails cover fraud loss and false rejects, with thresholds",
            "Support contacts and time to complete are watched as secondary signals",
          ],
          followUp:
            "Your experiment shows completion up two points, but false rejects rise to 3.4 percent. Do you ship?",
        },
        {
          id: "pm-id-verify-dropoff-q3",
          prompt: "How large does the test need to be, and how long would it run?",
          rubricPoints: [
            "Uses the baseline rate, minimum detectable effect, alpha and power",
            "Converts the sample per arm into days of traffic",
            "Runs the test through full weekly cycles",
          ],
          followUp: "The risk team wants to watch fraud for longer. How does that change the plan?",
        },
      ],
      stages: [
        {
          id: "pm-id-verify-dropoff-s1",
          order: 1,
          title: "Find where the funnel really breaks",
          summary:
            "Use funnel events and session evidence to separate a real product problem from noise, or from a step that exists for regulatory reasons.",
          estMinutes: 35,
          kind: "work",
          requirements: [
            "Chart the verification funnel from start to account open, with counts and drop-off rate for each step",
            "Segment abandonment by device type, document type and country, and report the two largest gaps",
            "Review at least 10 session recordings or support tickets from the document capture step and tag the failure reasons",
            "Separate friction you can fix from steps that exist for regulatory or fraud reasons",
          ],
          planOpener:
            "Let us start where the users are dropping. I expect the document capture screen to be the story, but I am not going to take that on faith. Please segment before you tell me anything about cause. Which cuts would you check first, device type or document type, and how many support tickets would you read before you trust a view?",
          learn: [
            {
              id: "pm-id-verify-dropoff-s1-l1",
              title: "Reading a funnel without fooling yourself",
              minutes: 5,
              body: `A funnel shows where people stop. It does not show why. Before you name a cause, check that the numbers themselves hold up.

**Funnel template**

| Step | Users entering | Users completing | Step conversion | Overall conversion |
|---|---|---|---|---|
| Start verification | 120,000 | 118,200 | 98.5% | 98.5% |
| Document capture | 118,200 | 91,400 | 77.3% | 76.2% |
| Selfie check | 91,400 | 78,600 | 86.0% | 65.5% |

**Check the basics**

- Are the step definitions the same across the periods you compare?
- Did the population change? A shift in device or country can move a funnel without any product change.
- Are the events firing correctly after the last release?

**Segment before you explain**

Cut by device type, document type and country. An average can hide one broken segment. When you say a change helped, compare segments with the same mix of users.

**Tag the failures**

Read sessions or tickets from the biggest drop, and tag each one with a reason such as glare, cropping, timeout or unclear instruction. Keep an unknown tag, and do not force sessions into reasons they do not fit.

**Separate friction from required checks**

Some steps exist because of regulation or fraud rules. Label them, so the team fixes the friction around those checks and leaves the checks alone.`,
              check: {
                question:
                  "Completion rose from 62 percent to 66 percent after a release, but the device mix also shifted. What should you check first?",
                options: [
                  "Whether the lift holds within each device type with the same mix of users",
                  "Whether the release notes were updated",
                  "Whether the funnel should be redefined",
                  "Whether 66 percent is a round number",
                ],
                answerIndex: 0,
                explanation:
                  "A mix shift can create an apparent lift. Compare within segments, using a consistent population, before you credit the release.",
              },
            },
          ],
          submission: {
            kinds: ["url", "file", "text"],
            instructions:
              "Share a link to your funnel chart and your tagged tickets or session notes. Add a text summary of the two largest gaps, and which steps you consider regulatory rather than friction.",
          },
          rubricHints: {
            understanding:
              "Reads a funnel correctly, distinguishes regulatory checks from product friction, and is clear that counts are not causes.",
            quality:
              "Segments are well chosen, sample reviews are tagged consistently, and the funnel math reconciles to the totals.",
            communication:
              "The summary shows the gaps and their size in a form that a risk partner and an engineer can both read.",
            independence:
              "Chooses which cuts and sessions to review without being told which steps to check.",
          },
          xp: 190,
        },
        {
          id: "pm-id-verify-dropoff-s2",
          order: 2,
          title: "Write the PRD for the verification fix",
          summary:
            "Turn the diagnosis into a requirements document that mobile, risk and support can build and test against.",
          estMinutes: 40,
          kind: "work",
          requirements: [
            "Write a problem statement, goals and non-goals, with the 66 percent target and guardrails on the first page",
            "Specify the capture changes, such as lighting hints, cropping guidance and retry limits, each with acceptance criteria",
            "List every regulatory or fraud check that stays unchanged, and why",
            "Include a risks and open questions section, with an owner and a date for each item",
          ],
          planOpener:
            "Good. The PRD is what engineering reads at nine in the morning, so write it for them. I want to see the non-goals early, because someone will ask us to remove a check. What three things will you put out of scope, and which open questions do you already know the risk team needs to answer?",
          learn: [
            {
              id: "pm-id-verify-dropoff-s2-l1",
              title: "Writing a PRD people can build from",
              minutes: 6,
              body: `A PRD is a shared decision record. Its job is to stop three teams from building three different things.

**Sections, in order**

1. **Problem and evidence:** the diagnosis, with the abandonment rate and where it came from.
2. **Goals:** the target, with a baseline and a deadline.
3. **Non-goals:** what you will not change, such as the regulated checks.
4. **Requirements:** each written as "The system must" with acceptance criteria.
5. **Guardrails:** thresholds for fraud loss and false rejects, and what happens if they are crossed.
6. **Risks and open questions:** each with an owner and a date.

**Acceptance criteria template**

| ID | Requirement | Acceptance test | Owner |
|---|---|---|---|
| R1 | Show a live lighting hint before capture | Hint appears when frame brightness is below threshold, tested on a set of 200 images | Mobile lead |

**Writing rules**

Use one requirement per line. Avoid words like fast or easy without a number. Link each requirement to the diagnosis it addresses, so a reader can see why it exists.

**Keep it short**

Engineering should be able to read it in fifteen minutes. Move background and screenshots to an appendix. Record every decision in a log at the bottom, with the date and the person who made it.`,
              check: {
                question: "Which section most prevents scope creep during an experiment?",
                options: ["Goals", "Non-goals", "Appendix", "Background"],
                answerIndex: 1,
                explanation:
                  "Non-goals name what is out of scope. When someone asks to remove a check or add a feature mid-test, the non-goals settle the question.",
              },
            },
          ],
          submission: {
            kinds: ["file", "url"],
            instructions:
              "Upload your PRD or link to it. It should include goals, non-goals, requirements with acceptance criteria, the unchanged checks, and a risks table with owners.",
          },
          rubricHints: {
            understanding:
              "Explains how each requirement addresses a diagnosed cause, and why the regulatory checks stay in place.",
            quality:
              "Requirements are testable, acceptance criteria are specific, and the guardrails from the outcome appear in the document.",
            communication:
              "The PRD is short enough to read in fifteen minutes, with clear headings and a decision log.",
            independence:
              "Makes scope calls and records open questions with owners, instead of waiting for direction on each section.",
          },
          xp: 220,
        },
        {
          id: "pm-id-verify-dropoff-s3",
          order: 3,
          title: "Design the experiment and rollout guardrails",
          summary:
            "Define the A/B test, its success metrics and guardrails, and a ramp that the team can run safely.",
          estMinutes: 40,
          kind: "work",
          requirements: [
            "State a primary metric, two secondary metrics and guardrails with thresholds for fraud loss and false rejects",
            "Calculate sample size from the 62 percent baseline and a minimum detectable effect of 1.5 points, then convert it into days of traffic",
            "Define the randomization unit, the holdout and the stopping rule",
            "Write a ramp plan from 5 percent to 50 percent of traffic, with a go or stop check at each step",
          ],
          planOpener:
            "Okay, now we make the test honest. I want the sample size math on the page, not in your head. Start with the baseline and the smallest lift that would justify the work. Is a 1.5 point lift the smallest effect that matters to us, and how many days does that take if the test gets half of verification starts?",
          learn: [
            {
              id: "pm-id-verify-dropoff-s3-l1",
              title: "Sizing an A/B test and picking guardrails",
              minutes: 8,
              body: `An A/B test answers one question: did the change cause the lift? It only answers well if you size it before you start.

**Sample size inputs**

- **Baseline rate:** the current completion rate, here 62 percent.
- **Minimum detectable effect:** the smallest lift that justifies the work, such as 1.5 points.
- **Significance (alpha):** usually 5 percent.
- **Power:** usually 80 percent.

For a two-group comparison of proportions, the sample per group is roughly 15.7 times p(1 minus p), divided by the effect squared, where p is the baseline. With a baseline of 0.62 and an effect of 0.015, that is about 16,500 users per arm.

**Metric table**

| Type | Metric | Decision rule |
|---|---|---|
| Primary | Verification completion rate | Ship if the lift is at least 1.5 points |
| Guardrail | False reject rate | Stop if it rises above 3.2 percent |
| Guardrail | Fraud loss rate | Stop if it rises above 0.45 percent |
| Secondary | Support contacts per 1,000 starts | Investigate if it rises by 20 percent |

**Guardrails are not success metrics**

A guardrail is a limit you must not cross, even if the primary metric wins. Pick them before launch, and write the threshold down.

**Ramp**

Move from 5 percent to 25 percent to 50 percent of traffic, checking the guardrails at each step. Do not skip a step to save time.`,
              check: {
                question: "Which of these is a guardrail rather than a success metric?",
                options: [
                  "Verification completion rate",
                  "False reject rate for legitimate customers",
                  "Share of users who open an account within seven days",
                  "Average time spent on the document screen",
                ],
                answerIndex: 1,
                explanation:
                  "A guardrail is a limit you must not cross. False rejects for legitimate customers is one, because a win on completion does not justify rejecting real people.",
              },
            },
          ],
          submission: {
            kinds: ["url", "file", "text"],
            instructions:
              "Share your experiment brief with the sample size calculation, the metric table, the ramp plan and the stop conditions. Paste the ramp schedule in the text box.",
          },
          rubricHints: {
            understanding:
              "Explains statistical power and minimum detectable effect in plain language, and how they set the sample size.",
            quality:
              "The sample size math checks out, guardrails have thresholds, and the ramp includes explicit go and stop criteria.",
            communication:
              "The brief is clear to risk and engineering, with one table that states the decision rule.",
            independence:
              "Chooses sensible thresholds and defends them without needing the manager to supply the numbers.",
          },
          xp: 210,
        },
        {
          id: "pm-id-verify-dropoff-s4",
          order: 4,
          title: "Present the rollout to Mateo",
          summary:
            "Record a recommendation that asks for the rollout, with clear stop conditions, owners and a realistic expected lift.",
          estMinutes: 25,
          kind: "presentation",
          requirements: [
            "Lead with the 62 percent baseline, the 66 percent target and the guardrails",
            "Present the single fix you recommend shipping first, with the diagnosis that supports it",
            "State the expected lift as a range rather than one number, and say what would move it",
            "Give the ramp schedule with stop conditions before you name owners",
            "Keep the recording between 6 and 8 minutes, and answer one challenge from Mateo",
          ],
          planOpener:
            "This is the recommendation stage. My one ask: give me the stop conditions before you give me the upside. Which fix would you ship first, and why does it deserve the risk team's time? And how wide is your range on the lift? I will challenge the top end.",
          learn: [
            {
              id: "pm-id-verify-dropoff-s4-l1",
              title: "Presenting a rollout to a risk-minded leader",
              minutes: 5,
              body: `A risk-minded leader wants to know how a change can go wrong before hearing how it can go right. Build the talk around that.

**Order of the talk**

1. **Baseline and target:** 62 percent today, a 66 percent goal, and the deadline.
2. **Guardrails:** the thresholds for fraud loss and false rejects, stated before any upside.
3. **Recommended fix:** the single change to ship first, and the diagnosis behind it.
4. **Ramp schedule:** the traffic steps, each with a go or stop check.
5. **Expected lift:** a range, such as 1 to 4 points, and what would move you to the low or high end.
6. **Owners:** who makes each decision, and by when.

**Range language**

Say "We expect between one and three points, most likely two, based on the test design." Avoid "it will add four points." A range shows that you have thought about the uncertainty.

**Handling the hard question**

If Mateo asks what happens when a fix raises fraud slightly, answer with the threshold and the action. For example: "If fraud rises above 0.45 percent at any ramp step, we pause, review the cases, and do not proceed until risk signs off."

**Practice tip**

Rehearse out loud with the thresholds in your head. Leaders notice when a PM hesitates on a guardrail.`,
              check: {
                question: "Which order best fits a rollout recommendation?",
                options: [
                  "Upside first, then stop conditions, then owners",
                  "Stop conditions, ramp schedule, then owners, with the expected range",
                  "Team history, then the PRD, then the numbers",
                  "Only the single best-case number",
                ],
                answerIndex: 1,
                explanation:
                  "A risk-minded audience needs the stop conditions and the ramp before the upside. The expected range and the owners complete the decision.",
              },
            },
          ],
          submission: {
            kinds: ["recording"],
            instructions:
              "Record a 6 to 8 minute video of your rollout recommendation with your slides or screen visible. Put the stop conditions and ramp before the expected lift.",
          },
          rubricHints: {
            understanding:
              "Explains the verification drop-off, the chosen fix and the guardrails in plain language, including what the data cannot show.",
            quality:
              "The recommendation is backed by the diagnosis, the test design and the ramp, with a realistic range for the lift.",
            communication:
              "Leads with the decision and the stop conditions, speaks to a risk-minded audience, and stays inside the time limit.",
            independence:
              "Owns the recommendation and handles Mateo's challenge with reasoned judgment rather than a script.",
          },
          xp: 280,
        },
      ],
      map: { x: 34, y: 52 },
    },

    // ───────────────────────────── Scenario 3 ─────────────────────────────
    {
      id: "pm-team-workspaces",
      careerId: "product-manager",
      companyId: "quillbox",
      npcId: "npc-corinne-adeyemi",
      order: 3,
      title: "Launch Team Workspaces at Quillbox",
      coverWord: "LAUNCH TEAM TIER",
      problemStatement:
        "Quillbox has 610,000 individual accounts but no paid team plan. Roughly 1,900 teams work around the product with shared logins, and 14 deals were lost last quarter to a rival with admin controls. Design a paid team workspaces tier: research the packaging and pricing, write a launch plan with go and no-go criteria, and prepare stakeholder comms for Sales, Support, Finance and the executive team.",
      userRole: "Product Manager, Team Plans",
      projectType: "Packaging, pricing and launch plan",
      difficulty: "advanced",
      estMinutes: 190,
      maxXp: 1500,
      tools: ["Google Sheets", "Notion", "Jira", "Figma", "Looker"],
      workflows: [
        "Van Westendorp price research",
        "Trial interview synthesis",
        "Packaging option design",
        "Launch planning with gates",
        "Stakeholder comms",
      ],
      skills: [
        "Pricing research",
        "Packaging strategy",
        "Launch planning",
        "Go/no-go decision design",
        "Stakeholder management",
      ],
      deliverables: [
        {
          title: "Packaging and pricing recommendation",
          description:
            "A one-page recommendation with two or three packaging options, price points, the target segment, and the research behind each claim.",
          kind: "file",
        },
        {
          title: "Launch plan with go and no-go criteria",
          description:
            "A launch timeline with phases, gates with thresholds and owners, the revenue math behind 400 paying teams, and the stakeholder comms pack.",
          kind: "url",
        },
      ],
      kickoff: {
        segments: [
          {
            id: "pm-team-workspaces-k1",
            title: "The problem: teams are working around us, and we are losing deals",
            noteSection: "problem",
            slides: [
              {
                heading: "Deals lost last quarter",
                bullets: ["Lost to a rival that offers a team plan with admin controls"],
                visual: "metric",
                metric: { label: "Lost deals last quarter", value: "14" },
              },
              {
                heading: "What trial teams ask for",
                bullets: ["Companies with ten or more seats in the trial"],
                visual: "chart",
                chart: [
                  { label: "Admin controls", value: 27 },
                  { label: "Shared billing", value: 24 },
                  { label: "Single sign-on", value: 19 },
                  { label: "Guest access limits", value: 16 },
                  { label: "Other", value: 14 },
                ],
              },
              {
                heading: "The workaround",
                bullets: ["Roughly 1,900 teams share one login or pay for several accounts"],
                visual: "quote",
                quote: {
                  text: "We pay for five separate accounts because there is no team plan.",
                  author: "Operations lead, 40-person agency, trial interview",
                },
              },
            ],
            transcript:
              "Quillbox has about 610,000 individual accounts, and that is our strength. The problem is teams. Last quarter we lost 14 deals to a rival called Bindery, which offers a team plan with admin controls. Trial leads from companies with ten or more seats keep asking the same things. Admin controls top the list at 27 percent, shared billing is at 24 percent, and single sign-on at 19 percent. Right now roughly 1,900 teams work around us, sharing one login or paying for five separate accounts. Sales is frustrated, and the trial data says these teams are close to buying. We are considering a paid team workspaces tier. Your job is to make a tier that sells, not just one that exists.",
            rubricPoints: [
              "Quantifies the 14 lost deals to a named rival",
              "Cites the trial requests for admin controls and shared billing",
              "Identifies the roughly 1,900 teams working around the product",
              "States that the goal is a tier that sells, not just one that exists",
            ],
            checkpointPrompt:
              "Write the problem in one or two sentences, including the lost deals and what trial teams are asking for.",
          },
          {
            id: "pm-team-workspaces-k2",
            title: "The outcome: 400 paying teams and a conversion bar to clear",
            noteSection: "outcome",
            slides: [
              {
                heading: "How the work flows",
                bullets: ["Pricing, plan, gates and comms, in that order"],
                visual: "flow",
                flow: ["Price the tier", "Build the launch plan", "Set go and no-go gates", "Brief every team"],
              },
              {
                heading: "Paying teams in 90 days",
                bullets: ["At six seats and 18 dollars per seat, about 520,000 dollars annualized"],
                visual: "metric",
                metric: { label: "Paying teams within 90 days", value: "400" },
              },
              {
                heading: "Trial conversion",
                bullets: ["Team trials convert at about 8 percent today"],
                visual: "chart",
                chart: [
                  { label: "Trial to paid today", value: 8 },
                  { label: "Target", value: 12 },
                  { label: "Stretch", value: 15 },
                ],
              },
            ],
            transcript:
              "Here is what we are aiming at. Within 90 days of launch I want 400 paying teams. At an average of six seats and 18 dollars per seat each month, that is about 520,000 dollars of annualized revenue. The conversion target matters as much as the count. Team trials convert at about 8 percent today, and I want 12 percent before we call the launch a success. You will set up the launch plan and the go and no-go gates. Finance has a discount ceiling it will not exceed, Legal needs a data processing addendum before the first team signs, and the permissions beta is three weeks from ready. I need a recommendation I can defend to the executive team, with the gates written down.",
            rubricPoints: [
              "States the goal of 400 paying teams in 90 days and its revenue value",
              "Names the 12 percent trial conversion target against 8 percent today",
              "Identifies Finance, Legal and the permissions beta as constraints",
              "Frames the deliverable as a launch plan with go and no-go gates",
            ],
            checkpointPrompt:
              "Write the outcome with the count, the revenue value, the conversion target and the constraints that could block it.",
          },
          {
            id: "pm-team-workspaces-k3",
            title: "The process: research, plan, comms and the recommendation",
            noteSection: "process",
            slides: [
              {
                heading: "How we will work",
                bullets: ["Research first, then the launch plan, then comms"],
                visual: "flow",
                flow: ["Research packaging and price", "Write the launch plan", "Draft stakeholder comms", "Recommend to Corinne"],
              },
              {
                heading: "Pricing research base",
                bullets: ["Recent survey plus 14 trial interviews from Sales"],
                visual: "metric",
                metric: { label: "Respondents in the pricing survey", value: "412" },
              },
              {
                heading: "What a good answer shows",
                bullets: ["Tested price points, a target segment, and a plan to change price"],
                visual: "quote",
                quote: {
                  text: "Do not bring me a price until you can tell me why a team pays it.",
                  author: "Corinne Adeyemi, Director of Product",
                },
              },
            ],
            transcript:
              "For the way we will work, we start in Plan mode and agree on scope, then move into research, then the launch plan, then stakeholder comms. Your research starts with the 412 people from our recent pricing survey, which used a Van Westendorp design, and the 14 trial interviews Sales collected. Learn sessions cover pricing methods and launch planning when you need them. Expect Finance to push back on any discount, and expect Support to ask how seat changes are billed. I want your packaging recommendation to show the price points you tested, the segment you are targeting, and what would make you change the price after launch. Good comms say what we know, what we do not know, and when we will know it.",
            rubricPoints: [
              "Describes the Plan, Do, Learn and Present sequence",
              "Names the sources: the 412-person pricing survey and 14 trial interviews",
              "Requires the packaging recommendation to show tested price points and a target segment",
              "Expects honest stakeholder comms that separate known from unknown",
            ],
            checkpointPrompt:
              "Note how you will run the work, which research you will use, and what the packaging recommendation must show.",
          },
        ],
      },
      pou: [
        {
          id: "pm-team-workspaces-q1",
          prompt:
            "Why does a team price of 18 dollars per seat need more than a price survey to justify it?",
          rubricPoints: [
            "Willingness to pay is a stated preference, not a purchase",
            "Team value depends on the admin features buyers need, such as controls and billing",
            "The price should be tested with real trial teams or a limited offer",
          ],
          followUp:
            "The survey says most teams would pay 14 dollars. What do you do with that gap?",
        },
        {
          id: "pm-team-workspaces-q2",
          prompt:
            "Finance wants a 20 percent launch discount. What is your response, and what would you need to see to agree?",
          rubricPoints: [
            "Discounts reset the price anchor and can be hard to reverse",
            "Any discount should be tied to a time limit or a seat minimum",
            "Any concession should be tied to a measured conversion lift",
          ],
          followUp:
            "Sales says a discount is the only way to close deals against Bindery. How would you test that claim?",
        },
        {
          id: "pm-team-workspaces-q3",
          prompt: "What would make you call the launch a no-go at day 60?",
          rubricPoints: [
            "Specific thresholds, such as conversion below a set level or support volume above a limit",
            "A decision owner and a date for the decision",
            "A partial rollback or fix is considered before a full stop",
          ],
          followUp:
            "Engineering says the permissions bug is fixed, but QA is still testing. How does that change your gate?",
        },
      ],
      stages: [
        {
          id: "pm-team-workspaces-s1",
          order: 1,
          title: "Research packaging and price points",
          summary:
            "Combine the pricing survey and trial interviews into a packaging recommendation with price points you can defend.",
          estMinutes: 40,
          kind: "work",
          requirements: [
            "Analyze the 412 Van Westendorp responses and report the acceptable price range, the optimal price point and the indifference point",
            "Synthesize the 14 trial interviews into three buying triggers and the admin features behind each",
            "Propose two or three packaging options, each with seat minimums, included features and a price",
            "Name the segment the Team tier is for, and the segment it is not for",
          ],
          planOpener:
            "Start with the survey, but do not let the curves do the thinking for you. Van Westendorp gives a range, not a decision. I want two or three packaging options and a first segment to target. Which segment buys first in your view, agencies or internal ops teams, and what evidence would make you switch?",
          learn: [
            {
              id: "pm-team-workspaces-s1-l1",
              title: "Reading a Van Westendorp price study",
              minutes: 6,
              body: `A Van Westendorp study asks four price questions: at what price is a product too cheap, a bargain, getting expensive, and too expensive. Plotting the cumulative answers gives you a range of acceptable prices.

**Two points to read first**

| Point | Meaning | How to find it |
|---|---|---|
| Optimal price point | The share who call the price too cheap equals the share who call it too expensive | Crossing of the too cheap and too expensive curves |
| Indifference price point | Equal shares see the price as a bargain or as expensive | Crossing of the bargain and expensive curves |

The acceptable range runs between the outer crossings. Use the optimal price point as the middle of your options, not as the answer.

**Caveats**

Stated willingness to pay is not purchase. People describe prices they like, not prices they would pay with a card in hand. Treat the curves as a range to test, not a verdict.

**Segment the answers**

Agencies and internal operations teams often answer differently. Split the study before you pick a price, and state which segment the package is for.

**Turning it into options**

Build two or three packages around the range, each with a distinct feature set and seat minimum. Make sure the highest price sits inside the acceptable range, and document what you rejected and why.`,
              check: {
                question:
                  "In a Van Westendorp study, what does the crossing of the too cheap and too expensive curves represent?",
                options: [
                  "The most profitable price for the business",
                  "The optimal price point, where the share calling the price too cheap equals the share calling it too expensive",
                  "The maximum price any respondent would pay",
                  "The price at which demand disappears",
                ],
                answerIndex: 1,
                explanation:
                  "That crossing is the optimal price point. It is a useful middle reference, but it does not measure profit or demand.",
              },
            },
          ],
          submission: {
            kinds: ["file", "url", "text"],
            instructions:
              "Upload your research summary or link to it. Include the Van Westendorp results, the three buying triggers, the packaging options with prices, and the target segment with the reason you rejected the alternative.",
          },
          rubricHints: {
            understanding:
              "Explains what the Van Westendorp curves measure, and why stated willingness to pay is not the same as purchase.",
            quality:
              "The analysis is correct, the packaging options are distinct and priced consistently, and the segment choice follows from the interview evidence.",
            communication:
              "The research summary fits on one page, with a clear recommendation and a source for each claim.",
            independence:
              "Chooses the packaging options and target segment, and explains the rejected alternatives without prompting.",
          },
          xp: 200,
        },
        {
          id: "pm-team-workspaces-s2",
          order: 2,
          title: "Write the launch plan and go/no-go criteria",
          summary:
            "Lay out how Quillbox launches the Team tier, when it can go live and what would stop it.",
          estMinutes: 40,
          kind: "work",
          requirements: [
            "Write a launch timeline with private beta, limited availability and general availability phases, with dates",
            "Define go/no-go gates for beta exit and general availability, with thresholds for conversion, support volume and stability",
            "Set the revenue target of 400 paying teams in 90 days, with a monthly breakdown and the assumed six seats per team",
            "Include a rollback or pause plan, and name the decision owner for each gate",
          ],
          planOpener:
            "Let us get the timing right. Engineering says the permissions beta needs three weeks, which I read as making private beta the first phase, not a full launch. What dates would you propose for the phases, and which gate do you think is hardest to pass? I want the thresholds spelled out, not described.",
          learn: [
            {
              id: "pm-team-workspaces-s2-l1",
              title: "Writing go/no-go criteria that hold up",
              minutes: 6,
              body: `A go/no-go gate turns a launch decision into a rule. A good gate is measurable, has a threshold, and names the person who decides.

**Gate template**

| Gate | Metric | Go threshold | No-go trigger | Decision owner |
|---|---|---|---|---|
| Beta exit | Trial to paid conversion over 30 days | 10% or higher | Below 8% | Director of Product |
| GA entry | Support tickets per 100 teams | 4 or fewer for two weeks | Above 6 | Head of Support |
| GA entry | Severity-one billing incidents | Zero open | Any open | Engineering lead |

**Qualities of a good criterion**

- It is measured the same way every time.
- It has a number and a time window.
- It can fail. If nothing could make you stop, it is not a gate.

**Weak criteria to avoid**

"The team feels ready" cannot be measured and gives no one a reason to stop. Replace it with a checklist item that has an owner and a date.

**Revenue math**

Write the arithmetic. For example, 400 paying teams at six seats and 18 dollars per seat per month is 518,400 dollars of annualized revenue. Show the conversion assumption that gets you to 400 teams.

**Rollback**

Name the action for each no-go. Pausing new sign-ups, restoring the previous price page and extending the beta are different responses, and each needs an owner.`,
              check: {
                question: "Which go/no-go criterion is the weakest?",
                options: [
                  "Trial to paid conversion of at least 12 percent over 30 days",
                  "Launch when the team feels ready",
                  "Support tickets per 100 teams at or below 4 for two weeks",
                  "No open severity-one bugs in billing",
                ],
                answerIndex: 1,
                explanation:
                  "A feeling cannot be measured or enforced. The other three have metrics, thresholds and time windows.",
              },
            },
          ],
          submission: {
            kinds: ["file", "url", "text"],
            instructions:
              "Upload or link your launch plan. Include the phase timeline, the gate table with thresholds and owners, the revenue math, and the rollback plan. Paste the revenue math in the text box.",
          },
          rubricHints: {
            understanding:
              "Explains how each gate connects to a revenue or risk outcome, and what the target conversion rate means.",
            quality:
              "The timeline, gates and revenue math are consistent with the research and constraints, with thresholds for every gate.",
            communication:
              "The plan is easy to scan, with dates, owners and thresholds in one table.",
            independence:
              "Sets thresholds and phases with reasoning, and anticipates the Finance and Legal constraints without being reminded.",
          },
          xp: 230,
        },
        {
          id: "pm-team-workspaces-s3",
          order: 3,
          title: "Draft stakeholder comms and the readiness checklist",
          summary:
            "Write the messages and checklist that keep Sales, Support, Finance and Legal aligned before and during launch.",
          estMinutes: 30,
          kind: "work",
          requirements: [
            "Write one executive update with status, the decision needed and the risks, in under 250 words",
            "Write a Sales enablement note covering the price, the discount policy and what Sales cannot promise",
            "Write a Support FAQ with at least five questions, including seat changes and admin role changes",
            "Build a launch readiness checklist with an owner, due date and status for Legal, Finance, Engineering and Support",
          ],
          planOpener:
            "Comms is where launches go to die, so let us keep it sharp. Corinne reads the executive update first and decides whether we proceed. Sales will read the enablement note twice. What is the one decision you need from the executive team right now, and what will you tell Sales they can and cannot offer?",
          learn: [
            {
              id: "pm-team-workspaces-s3-l1",
              title: "Writing launch comms that stakeholders trust",
              minutes: 5,
              body: `Launch comms have three audiences with three jobs. Executives decide. Sales has to sell without overpromising. Support has to answer correctly on day one.

**Executive update template**

- **Status:** one line, such as "Beta on track, general availability at risk by one week."
- **Decision needed:** one decision, with its deadline.
- **Risks:** each with an owner, a mitigation and a date.
- **Known and unknown:** what we know, and when we will know the rest.

**Sales note checklist**

- The price and seat minimum, stated exactly.
- The discount policy, with its time limit and approver.
- What Sales cannot promise, such as custom SSO timelines or future features.

**Support FAQ format**

Write each question the way a customer would ask it. Answer in two or three sentences, and link to the help article. Good starter questions include how seat changes are billed, what happens to a removed admin, and whether existing personal notes move into the team workspace.

**Tone**

Plain words beat slogans. Say "We have not decided yet, and we will confirm by Friday" rather than "We are exploring options."`,
              check: {
                question: "Which element belongs in an executive launch update?",
                options: [
                  "A long history of the project",
                  "The decision needed, the status, and the risks with owners",
                  "Every customer quote collected",
                  "An apology for schedule changes",
                ],
                answerIndex: 1,
                explanation:
                  "Executives need the decision, the current status and the risks with owners. History and quotes can go in an appendix.",
              },
            },
          ],
          submission: {
            kinds: ["file", "text"],
            instructions:
              "Upload the executive update, Sales note, Support FAQ and readiness checklist as one file, or paste the executive update in the text box and attach the rest as a file.",
          },
          rubricHints: {
            understanding:
              "Explains why each audience needs different information, and what Sales and Support must know to answer correctly.",
            quality:
              "The messages are accurate to the plan and pricing, the FAQ answers real questions, and the checklist has owners and dates.",
            communication:
              "Each message is short, plain and specific, and states what is known, what is not known, and when it will be known.",
            independence:
              "Decides what each audience needs, and resolves inconsistencies between the plan and the comms without being told.",
          },
          xp: 220,
        },
        {
          id: "pm-team-workspaces-s4",
          order: 4,
          title: "Present the launch recommendation to Corinne",
          summary:
            "Record the packaging, plan and gate recommendation, with the decisions you need from the executive team.",
          estMinutes: 25,
          kind: "presentation",
          requirements: [
            "Open with the recommended packaging, price and target segment in the first minute",
            "Show the 400 team goal, the 12 percent conversion target and the revenue math",
            "Present the go and no-go gates with thresholds and decision owners",
            "State the discount decision you recommend, and the condition attached to it",
            "Keep the recording between 6 and 8 minutes, and answer one challenge from Corinne",
          ],
          planOpener:
            "This is the room where you ask for the decision. Give me the recommendation first: packaging, price, segment and launch date. Then tell me the one gate you think will fail, because I want to hear you say it out loud. Which gate is that, and what will you do if it fails at day 45?",
          learn: [
            {
              id: "pm-team-workspaces-s4-l1",
              title: "Making a launch recommendation land with executives",
              minutes: 5,
              body: `Executives approve launches that come with a clear view of risk. A recommendation that claims no risk is not believed. One that names the main risk, how you will see it early, and what you will do about it is far easier to approve.

**Structure**

1. **Recommendation:** packaging, price, segment and launch date.
2. **Why:** the two or three findings that make it the right choice.
3. **Revenue math:** the 400-team goal and the conversion target that supports it.
4. **Gates:** the thresholds, owners and dates.
5. **Main risk:** the one most likely to fail, the early signal and the response.
6. **Decision:** the specific approval you need today.

**Discount position**

Recommend a discount only if it has a time limit, a seat minimum and a measured conversion goal. Otherwise say no, and offer what you will test instead.

**Delivery**

Open with the decision. Keep numbers to the few that matter. When Corinne pushes, answer with the number, then the reasoning, then what would change your mind.

**Before you record**

Can you state the decision in one sentence? Can you say the conversion target without looking? Does every number match the research?`,
              check: {
                question: "What should a launch recommendation say about risk?",
                options: [
                  "That no risks exist",
                  "The main risk, how you will detect it early, and what you will do",
                  "Risks belong only in the appendix",
                  "Every risk is equally important",
                ],
                answerIndex: 1,
                explanation:
                  "Naming the main risk with an early signal and a response shows judgment. Hiding risk, or treating all risks as equal, does not.",
              },
            },
          ],
          submission: {
            kinds: ["recording"],
            instructions:
              "Record a 6 to 8 minute video of your launch recommendation with your slides or screen visible. Open with the decision, and leave two minutes for Corinne's challenge.",
          },
          rubricHints: {
            understanding:
              "Explains the packaging, pricing and gates in plain language, and why the target segment was chosen.",
            quality:
              "The recommendation follows from the research, the revenue math is correct, and the gates are specific enough to enforce.",
            communication:
              "Opens with the decision, names the risk plainly, and keeps the story within the time limit for an executive audience.",
            independence:
              "Owns the recommendation and defends the discount position with judgment rather than reciting the plan.",
          },
          xp: 300,
        },
      ],
      map: { x: 52, y: 64 },
    },
  ],
};

export default pack;
