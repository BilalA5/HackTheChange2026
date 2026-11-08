import type { Career, Company, Npc, Scenario } from "@pw/shared";
import type { CareerPack } from "../types.ts";

const career: Career = {
  id: "data-analyst",
  title: "Data Analyst",
  tagline: "Turn messy data into decisions a team will act on.",
  description:
    "Data analysts answer business questions with SQL, Python and dashboards, and they are judged by whether a manager changes what they do next. You will work with messy event logs, live experiments and demand history, and learn to show your work so others can trust it. Every project ends with a recommendation and the evidence behind it.",
  skills: [
    "SQL",
    "Cohort and funnel analysis",
    "A/B test design and analysis",
    "pandas and Python",
    "Forecasting and error measurement",
    "Dashboard design",
    "Stakeholder communication",
    "Data quality checks",
  ],
  color: "#3DD68C",
};

const companies: Company[] = [
  {
    id: "pulseline-studio",
    name: "Pulseline Studio",
    industry: "Fitness subscriptions",
    tagline: "Live and on-demand classes for busy people.",
    color: "#FF5A36",
    glyph: "PL",
    building: "loft",
  },
  {
    id: "hearthmark-market",
    name: "Hearthmark",
    industry: "Secondhand furniture marketplace",
    tagline: "Good furniture, a second life, local pickup.",
    color: "#8B5E3C",
    glyph: "HK",
    building: "dome",
  },
  {
    id: "larkfield-grocers",
    name: "Larkfield Grocers",
    industry: "Regional grocery retail",
    tagline: "Forty-one neighborhood stores, fresh every morning.",
    color: "#2E7D4F",
    glyph: "LG",
    building: "hangar",
  },
];

const npcs: Npc[] = [
  {
    id: "npc-priya-raman",
    name: "Priya Raman",
    role: "Analytics Lead, Growth",
    companyId: "pulseline-studio",
    personality:
      "Priya is warm but exacting and speaks in short, direct sentences. She cares most about whether a number would survive a skeptical product manager, so she will ask you to define a metric before she looks at it. She rewards clean reasoning far more than clever queries.",
    voice: { rate: 1.0, pitch: 1.08, style: "feminine" },
    avatarSeed: "priya-raman",
  },
  {
    id: "npc-dev-halvorsen",
    name: "Dev Halvorsen",
    role: "Director of Marketplace Data",
    companyId: "hearthmark-market",
    personality:
      "Dev is dry, funny and deliberate, and he often opens with a question. He protects sellers and will push hard on fairness and on anything that moves fees. He wants a memo a busy executive can read in five minutes, with the caveats stated up front.",
    voice: { rate: 0.94, pitch: 0.9, style: "masculine" },
    avatarSeed: "dev-halvorsen",
  },
  {
    id: "npc-ruth-abernathy",
    name: "Ruth Abernathy",
    role: "Senior Manager, Supply Planning Analytics",
    companyId: "larkfield-grocers",
    personality:
      "Ruth is brisk and operational, the kind of person who has walked a store floor at 5 a.m. She thinks in cases, pallets and out-of-stocks, and gets impatient with abstract accuracy scores. She wants you to explain what a forecast miss costs a store in lost sales or spoiled produce.",
    voice: { rate: 1.04, pitch: 1.12, style: "feminine" },
    avatarSeed: "ruth-abernathy",
  },
];

// ───────────────────────────── Scenario 1: retention ─────────────────────────────

const retention: Scenario = {
  id: "da-retention-cohorts",
  careerId: "data-analyst",
  companyId: "pulseline-studio",
  npcId: "npc-priya-raman",
  order: 1,
  title: "Find What Keeps New Members Coming Back",
  coverWord: "READ THE COHORTS",
  problemStatement:
    "Pulseline's week-8 retention for new members dropped from 41 percent to 33 percent over the last two quarters, and nobody agrees on why. Using the events warehouse, build weekly retention cohorts for members who started in the last six months, find which onboarding behaviors in the first 14 days predict whether someone is still active at week 8, and recommend two or three changes the lifecycle team can test next month.",
  userRole: "Junior analyst on the Growth analytics team",
  projectType: "Cohort retention analysis",
  difficulty: "beginner",
  estMinutes: 150,
  maxXp: 1360,
  tools: ["BigQuery (SQL)", "Python with pandas", "Jupyter notebooks", "Looker Studio", "Google Sheets"],
  workflows: [
    "Validate the events table",
    "Build a weekly retention cohort table",
    "Compare early onboarding behaviors",
    "Recommend lifecycle experiments",
  ],
  skills: ["Cohort construction", "Retention curves", "Window functions", "Confounder awareness", "Recommendation writing"],
  deliverables: [
    {
      title: "Cohort retention notebook",
      description:
        "SQL that builds weekly signup cohorts, plus a pandas notebook that charts retention curves and onboarding comparisons.",
      kind: "github",
    },
    {
      title: "Recommendation memo",
      description:
        "A one-page memo with the top three onboarding signals, the caveats that limit them, and two proposed experiments.",
      kind: "file",
    },
  ],
  kickoff: {
    segments: [
      {
        id: "da-retention-cohorts-k1",
        title: "The retention drop",
        noteSection: "problem",
        slides: [
          {
            heading: "Eight-week retention is sliding",
            bullets: [
              "Week-8 retention fell from 41% to 33% across the last two cohort cycles",
              "Roughly 4,000 fewer active members each month at flat acquisition spend",
            ],
            visual: "metric",
            metric: { label: "Week-8 retention, latest cohort", value: "33%" },
          },
          {
            heading: "Week-8 retention by signup month (%)",
            bullets: [
              "The drop starts with the March trial offer and keeps going",
              "Three theories are on the table, and none has been tested",
            ],
            visual: "chart",
            chart: [
              { label: "Mar", value: 41 },
              { label: "Apr", value: 38 },
              { label: "May", value: 36 },
              { label: "Jun", value: 33 },
            ],
          },
        ],
        transcript:
          "Okay, let's start with the number that keeps me up at night. Week-8 retention for new members went from forty-one percent in March to thirty-three percent in June. That is about four thousand fewer active members every month, and our acquisition spend has not moved. Nobody on the lifecycle team agrees on why. Marketing says the trial offer changed and brought in people who were less committed. Product says the spring onboarding redesign removed the first-class prompt. Instructors think the class mix shifted toward longer strength sessions. I don't want you to pick a winner yet. I want a retention table you can defend, and a clear answer to which early behaviors actually predict staying. Start from the events table, not the dashboard, because the dashboard counts a paused member as retained.",
        rubricPoints: [
          "States the week-8 retention drop with the actual cohort numbers",
          "Names the three competing explanations",
          "Defines retention and cohort precisely enough to reproduce",
          "Notes that paused members must be handled explicitly",
        ],
        checkpointPrompt:
          "In your own words, what is the retention problem, and what would make you confident about its cause?",
      },
      {
        id: "da-retention-cohorts-k2",
        title: "What a good answer looks like",
        noteSection: "outcome",
        slides: [
          {
            heading: "The three deliverables",
            bullets: [
              "A weekly retention table by signup cohort, weeks 0 through 8",
              "Early behaviors ranked by how well they separate stayers from leavers",
              "Two or three experiments the lifecycle team can run next month",
            ],
            visual: "flow",
            flow: ["Build cohorts", "Measure retention", "Compare behaviors", "Recommend tests"],
          },
          {
            heading: "Active has a precise meaning",
            bullets: [
              "Active means at least one class booked or attended in the trailing 14 days",
              "Paused memberships are not active, but they get their own reporting line",
              "Week 0 is the first paid plan start, measured in studio local time",
            ],
            visual: "metric",
            metric: { label: "Active definition", value: "1+ class in 14 days" },
          },
        ],
        transcript:
          "Here is what I need back from you. First, a retention table: one row per weekly signup cohort, with columns for week zero through week eight, showing the share still active. Second, a ranked list of early behaviors that separate people who stay from people who leave. Third, two or three experiments I can hand to the lifecycle team. Active has a precise meaning for us. A member counts as active if they booked or attended at least one class in the trailing fourteen days. Paused memberships are not active, but I want them reported on their own line, because a pause often becomes a cancel. Week zero is the first paid plan start in studio local time, not UTC. Mobile events also arrive late, sometimes three days later, so recent cohorts will look worse than they are. Leave the last two weeks of cohorts out of the headline number and flag them as incomplete.",
        rubricPoints: [
          "Lists the three deliverables: cohort table, ranked behaviors, experiments",
          "Defines active as one or more classes in a 14-day window",
          "Reports paused members separately instead of counting them as retained",
          "Explains that late mobile events make the newest cohorts incomplete",
        ],
        checkpointPrompt: "Summarize what the finished analysis must contain and how you will define active.",
      },
      {
        id: "da-retention-cohorts-k3",
        title: "How I want you to work",
        noteSection: "process",
        slides: [
          {
            heading: "Work order",
            bullets: [
              "Validate the events table for duplicates, time zones and gaps",
              "Build cohorts in SQL and export one tidy table",
              "Compare behaviors in pandas and check each platform separately",
            ],
            visual: "flow",
            flow: ["Validate events", "Build cohorts in SQL", "Compare behaviors in pandas", "Write the memo"],
          },
          {
            heading: "Know the traps",
            bullets: [
              "The Android SDK resends queued events, so dedupe on event_id",
              "Heavy users do everything more, so raw comparisons flatter any behavior",
            ],
            visual: "quote",
            quote: {
              text: "If a behavior only shows up in our most engaged members, it is a symptom, not a lever.",
              author: "Priya Raman, Analytics Lead, Growth",
            },
          },
        ],
        transcript:
          "Let me walk you through how I'd like you to approach this. Start by validating the events table. Android resends events when a connection drops, so the same event can show up twice with different load times. Dedupe on event_id, not on timestamp. Then build your cohorts in SQL and move a tidy table into your notebook. In pandas, compare the early behaviors, like booking a class in the first 48 hours, connecting a wearable, or finishing a profile, and check whether each effect holds on iOS and on Android separately. Watch out for the big trap. Heavy users do everything more, so a raw comparison will flatter almost any behavior. Compare members with similar first-week class counts before you claim a lever. Keep notes on every filter you apply, because I will ask.",
        rubricPoints: [
          "Dedupes Android events on event_id rather than timestamp",
          "Plans a per-platform check for each candidate behavior",
          "Warns that heavy early users confound behavior comparisons",
          "Sequences the work as validation, then SQL cohorts, then pandas comparison",
        ],
        checkpointPrompt: "Write down how you will validate the data and avoid confounding before you run any numbers.",
      },
    ],
  },
  pou: [
    {
      id: "da-retention-cohorts-q1",
      prompt: "Walk me through how you would define an active member, and why paused members need their own line.",
      rubricPoints: [
        "Active means one or more classes in a 14-day window",
        "Paused members are excluded from active but reported separately",
        "A pause often comes before a cancellation, so it matters",
      ],
      followUp: "What happens to the week-8 number if you count paused members as retained?",
    },
    {
      id: "da-retention-cohorts-q2",
      prompt: "Why might booking a first class within 48 hours look predictive even if it does not cause retention?",
      rubricPoints: [
        "Engaged members do many things, so the behavior is confounded with general engagement",
        "Compare against members with similar early activity",
        "An association is not a lever until it is tested",
      ],
      followUp: "How would you design a test that shows the behavior actually causes retention?",
    },
    {
      id: "da-retention-cohorts-q3",
      prompt: "Your cohort table shows the last two weeks dropping sharply. What do you check before reporting that?",
      rubricPoints: [
        "Late-arriving mobile events can make recent cohorts look worse than they are",
        "Mark the recent cohorts as incomplete rather than reporting them as final",
        "Re-run the table once the data has settled",
      ],
      followUp: "How long would you wait before trusting the most recent cohort?",
    },
  ],
  stages: [
    {
      id: "da-retention-cohorts-s1",
      order: 1,
      title: "Validate and clean the events",
      summary: "Confirm the events table is trustworthy before any retention math starts.",
      estMinutes: 30,
      kind: "work",
      requirements: [
        "Deduplicate events on event_id and report how many duplicates you removed",
        "Convert event timestamps to studio local time for cohort assignment",
        "Document how paused memberships and cancellations are represented",
        "Report the share of cohorts whose week-8 window is not yet complete",
      ],
      planOpener:
        "Before we build anything, I want the data to earn our trust. Tell me how you will find duplicates in the Android stream, which timezone you will cohort on, and how you will handle pauses. Once we agree, you can start the validation queries.",
      learn: [
        {
          id: "da-retention-cohorts-s1-l1",
          title: "Deduplicating event streams",
          minutes: 5,
          body: `Event pipelines deliver the same event more than once. The Android SDK resends anything queued during a dropped connection, and the warehouse can replay a batch after a failed load. If you count raw rows, every retention number you produce will be inflated, and the inflation is worst for the most active members, who generate the most events.

The fix is to decide what makes an event unique and then keep exactly one copy of each. In our data, event_id is assigned once on the device and never changes, so it is the right key. Load time and ingest time change on every resend, so they cannot be used to spot duplicates.

Here is a deduplication pattern you can reuse:

\`\`\`sql
with ranked as (
  select
    event_id, member_id, event_name, event_ts,
    row_number() over (partition by event_id order by ingested_at) as rn
  from raw.events
)
select * from ranked where rn = 1;
\`\`\`

Keep a count of how many rows you removed, by platform and by day. A sudden spike usually means an SDK release caused a retry storm, which is worth a line in your data quality log. Do not silently drop rows you dislike. Every removal should be explainable in one sentence to the manager who reads your log.`,
          check: {
            question: "The Android SDK resends events after a dropped connection. What is the safest key to dedupe on?",
            options: [
              "event_id, the unique id assigned once on the device",
              "event_ts, because duplicates share a timestamp",
              "member_id plus event_name",
              "ingested_at, the time the warehouse received the row",
            ],
            answerIndex: 0,
            explanation:
              "event_id is assigned once on the device, so every resend carries the same value. Load and ingest times change on resend, and member_id plus event_name would collapse legitimate repeat events such as two class bookings.",
          },
        },
      ],
      submission: {
        kinds: ["github", "file"],
        instructions:
          "Commit your validation SQL to the repo and attach a short data quality log as a file. The log should be one table with columns for check, result and the action you took.",
      },
      rubricHints: {
        understanding: "Explains why duplicates and time zones change cohort sizes and retention rates.",
        quality: "Validation queries are reproducible and every removed row is accounted for.",
        communication: "The data quality log states each finding in plain terms a manager can scan in a minute.",
        independence: "Finds the duplicate and pause issues without being prompted.",
      },
      xp: 160,
    },
    {
      id: "da-retention-cohorts-s2",
      order: 2,
      title: "Build weekly retention cohorts",
      summary: "Assign each member to a signup cohort and measure week 0 through week 8 activity.",
      estMinutes: 40,
      kind: "work",
      requirements: [
        "Build a weekly signup cohort table in SQL covering the last six months",
        "Compute week 0 through week 8 active rates using the 14-day active definition",
        "Report paused members on a separate line from active and churned members",
        "Mark cohorts whose week-8 window is incomplete and exclude them from the headline",
      ],
      planOpener:
        "Now the core table. Each row is a signup week, each column is weeks since start, and each cell is the share of members still active. Send me your definition of active and your plan for excluding incomplete cohorts before you write the query.",
      learn: [
        {
          id: "da-retention-cohorts-s2-l1",
          title: "Building cohorts from weeks since start",
          minutes: 6,
          body: `A retention table answers one question for every cohort: of the people who started in a given week, how many were still active N weeks later? That only works if each member's clock starts at their own signup, not on the calendar. A calendar-week table mixes people who joined on Monday with people who joined on Sunday and hides the decay curve you are trying to measure.

Build the cohort first, then measure activity against it. Assign each member a signup week, then compute the number of whole weeks between their start and each activity date.

\`\`\`sql
select
  date_trunc(c.signup_date, week) as cohort_week,
  cast(floor(date_diff(a.activity_date, c.signup_date, day) / 7) as int64) as week_n,
  count(distinct a.member_id) as active_members
from cohorts c
join member_activity a using (member_id)
where a.is_active_14d
group by 1, 2;
\`\`\`

Divide each active count by the cohort size to get a rate. Then add a cohort size column so the reader can see how much a small cohort can move a number. Mark any cohort whose week-8 window ends after yesterday as incomplete. Leave those cells blank in your headline table rather than showing a low number that will rise later.`,
          check: {
            question: "Which mistake is most common when building a weekly cohort table?",
            options: [
              "Measuring weeks from each member's own start date, not from the calendar",
              "Counting members who never subscribed",
              "Writing the logic in SQL instead of a Python loop",
              "Dividing by total events instead of total members",
            ],
            answerIndex: 0,
            explanation:
              "Cohort weeks must be measured from each member's own start. Calendar weeks mix people who joined at different points, which blurs the decay curve you are trying to read.",
          },
        },
      ],
      submission: {
        kinds: ["github", "file"],
        instructions:
          "Push the cohort SQL to your repo and attach the exported cohort table as a CSV file with a cohort size column.",
      },
      rubricHints: {
        understanding: "Explains why cohort weeks are counted from each member's own start date.",
        quality: "The cohort table uses the agreed active definition and leaves incomplete cohorts out of the headline.",
        communication: "Labels each row and column so a reader can tell the cohort size and the completeness status.",
        independence: "Flags the incomplete recent cohorts before being asked.",
      },
      xp: 190,
    },
    {
      id: "da-retention-cohorts-s3",
      order: 3,
      title: "Compare onboarding behaviors",
      summary: "Find which first-14-day behaviors predict week-8 activity after accounting for engagement.",
      estMinutes: 35,
      kind: "work",
      requirements: [
        "Compute week-8 retention with and without each of at least five onboarding behaviors",
        "Compare members with similar first-week class counts to reduce confounding",
        "Check whether the top behavior holds on iOS and Android separately",
        "Rank behaviors by effect size and report the sample size behind each one",
      ],
      planOpener:
        "This is where people overreach, so go slowly. I want a ranked list, but every behavior has to survive a comparison against similar members. Tell me which behaviors you will test and how you will control for first-week activity.",
      learn: [
        {
          id: "da-retention-cohorts-s3-l1",
          title: "Comparing behaviors without fooling yourself",
          minutes: 7,
          body: `Suppose members who book a class in their first 48 hours retain at 46 percent, while everyone else retains at 29 percent. That gap is real, but it does not tell you to push every new member to book. Members who book quickly are also the members who come three times in week one, who download the app early and who buy the family plan. The behavior is a marker of motivation, not a switch you can flip.

The first control is to stratify. Bucket members by how many classes they attended in week one, then compare the behavior inside each bucket.

\`\`\`python
import pandas as pd

df["booked_48h"] = df["first_booking_hours"].le(48)
df["week1_bucket"] = pd.cut(df["week1_classes"], bins=[-1, 0, 2, 5, 99],
                            labels=["none", "1-2", "3-5", "6+"])

lift = (
    df.groupby(["week1_bucket", "booked_48h"], observed=True)["active_w8"]
      .agg(["mean", "size"])
)
\`\`\`

Read the table inside each bucket, not the overall average. If the gap shrinks to almost nothing within buckets, the behavior was mostly engagement. Report the sample size next to every rate. A 15-point difference on 40 members is a hint, not a finding.`,
          check: {
            question: "Why stratify by first-week class count before comparing an onboarding behavior?",
            options: [
              "Heavy early users both do more behaviors and stay longer, so stratifying separates the behavior from general engagement",
              "Pandas cannot compare two groups without buckets",
              "It reduces the number of rows the query has to scan",
              "First-week class count is the outcome variable",
            ],
            answerIndex: 0,
            explanation:
              "Engagement drives both the behavior and retention. Comparing within buckets of similar early activity shows whether the behavior adds anything beyond how engaged the member already was.",
          },
        },
      ],
      submission: {
        kinds: ["github", "text"],
        instructions:
          "Commit the comparison notebook and paste a short text summary listing each behavior, its effect within buckets, and the sample size behind it.",
      },
      rubricHints: {
        understanding: "Explains why raw comparisons overstate behaviors that engaged members do more often.",
        quality: "Comparisons are stratified, sample sizes are reported, and platform checks are included.",
        communication: "The ranked list states uncertainty and avoids calling any behavior a cause.",
        independence: "Raises the confounding problem on their own before the manager points it out.",
      },
      xp: 220,
    },
    {
      id: "da-retention-cohorts-s4",
      order: 4,
      title: "Present the retention findings",
      summary: "Walk Priya through the curve, the ranked behaviors and two proposed experiments.",
      estMinutes: 25,
      kind: "presentation",
      requirements: [
        "Record a 5 to 8 minute walkthrough of the retention curve",
        "State the top two onboarding signals with effect sizes and sample sizes",
        "Name at least one caveat and how it changes your confidence",
        "Propose two experiments, each with a success metric and a minimum sample size",
      ],
      planOpener:
        "Last step. Record a short walkthrough for me, as if I were the lifecycle lead who has not seen your notebook. Lead with the answer, then show the curve, then the caveats. Confirm the two experiments you want to recommend before you record.",
      learn: [
        {
          id: "da-retention-cohorts-s4-l1",
          title: "Leading with the answer",
          minutes: 4,
          body: `A findings read-out is a decision aid, not a tour of your notebook. The people listening have ten minutes and a lot of other work. Start with the one thing you want them to do, then give the evidence that justifies it, then state the limits.

For this project, a strong order looks like this. First, say which onboarding signals are worth testing and why. Second, show the retention curve for the latest complete cohorts next to the earlier ones, so the drop is visible. Third, give the effect size for each signal along with the sample size, and say which result would have to change to alter your recommendation. Fourth, name the caveats: the late mobile events, the pause treatment, and the fact that behaviors are observed rather than assigned.

Numbers need units and context. Say "retention fell 8 points, from 41 percent to 33 percent" rather than "retention dropped." Round to whole percentages unless the difference is smaller than a point. If you show a confidence interval, explain it in one sentence the first time you use it.

Keep the recording to five or eight minutes. Speak the answer in the first thirty seconds. If the listener stops after that, they should still know what to do next.`,
          check: {
            question: "In a findings read-out for a busy lifecycle lead, what should come first?",
            options: [
              "The recommendation and its main caveat, so the listener can act even if they stop early",
              "A full history of the data pipeline",
              "Every table from the notebook in order",
              "The statistical method used to compute retention",
            ],
            answerIndex: 0,
            explanation:
              "Busy decision makers need the answer first. The recommendation plus its key caveat lets them act immediately, and the supporting evidence follows for anyone who keeps listening.",
          },
        },
      ],
      submission: {
        kinds: ["recording"],
        instructions:
          "Upload a screen recording of 5 to 8 minutes walking through the retention curve and your recommendation. Lead with the answer in the first 30 seconds.",
      },
      rubricHints: {
        understanding: "Explains what the retention curve shows and what the behaviors do and do not prove.",
        quality: "Charts are labeled, numbers have units and sample sizes, and experiments have clear success metrics.",
        communication: "Leads with the recommendation and speaks in plain language a lifecycle lead can repeat.",
        independence: "Anticipates the manager's questions about caveats and proposes next steps unprompted.",
      },
      xp: 240,
    },
  ],
  map: { x: 30, y: 76 },
};

// ───────────────────────────── Scenario 2: pricing A/B test ─────────────────────────────

const pricing: Scenario = {
  id: "da-pricing-ab-test",
  careerId: "data-analyst",
  companyId: "hearthmark-market",
  npcId: "npc-dev-halvorsen",
  order: 2,
  title: "Decide Whether the New Buyer Fee Ships",
  coverWord: "TEST THE FEE",
  problemStatement:
    "Hearthmark ran a two-week test of a lower buyer service fee, 3.5 percent instead of 5 percent, on furniture listings above 150 dollars, and the product team wants to ship it. Check whether the randomization was clean, compute the lift in purchase conversion and gross merchandise value per visitor with confidence intervals, look for segment effects, and write a ship or no-ship memo a director can act on this week.",
  userRole: "Analyst supporting the Marketplace Pricing team",
  projectType: "A/B test analysis and decision memo",
  difficulty: "intermediate",
  estMinutes: 180,
  maxXp: 1410,
  tools: ["Python with pandas and SciPy", "SQL on the experiment warehouse", "Jupyter notebooks", "Google Sheets for the decision summary"],
  workflows: [
    "Sample ratio mismatch check",
    "Lift and confidence interval calculation",
    "Segment effect review",
    "Ship or no-ship memo",
  ],
  skills: ["Experiment design review", "Sample ratio mismatch", "Confidence intervals", "Heterogeneous treatment effects", "Decision writing"],
  deliverables: [
    {
      title: "Experiment analysis notebook",
      description:
        "A reproducible notebook with the sample ratio mismatch check, lift estimates with intervals, and the segment tables.",
      kind: "github",
    },
    {
      title: "Ship or no-ship memo",
      description:
        "A two-page memo with a recommendation, the main risks, and the result that would change the decision.",
      kind: "file",
    },
  ],
  kickoff: {
    segments: [
      {
        id: "da-pricing-ab-test-k1",
        title: "The fee question",
        noteSection: "problem",
        slides: [
          {
            heading: "Conversion, treatment against control",
            bullets: [
              "Two-week test on listings above 150 dollars",
              "Buyer service fee cut from 5 percent to 3.5 percent in treatment",
            ],
            visual: "metric",
            metric: { label: "Conversion, treatment vs control", value: "3.42% vs 3.10%" },
          },
          {
            heading: "Both sides of the market feel this",
            bullets: [
              "Buyers pay less, which should raise conversion",
              "Sellers may see different demand, which we have not measured yet",
            ],
            visual: "quote",
            quote: {
              text: "If the lift only shows up in the app, I want to know that before the fee goes live everywhere.",
              author: "Dev Halvorsen, Director of Marketplace Data",
            },
          },
        ],
        transcript:
          "The product team wants to ship a lower buyer fee on furniture listings above one hundred fifty dollars. The test ran for two weeks. Treatment converted at three point four two percent and control at three point one zero, so the headline looks like a win. I'm not celebrating yet, and you shouldn't either. Before anyone talks about shipping, I need you to check whether the two groups were actually comparable. Then compute the lift with a real confidence interval, look at whether it holds across shopping channels, and tell us whether to ship. Remember that this fee touches both sides of the market. Buyers pay less, and sellers may see a different mix of demand. Our sellers are a small business community, and I want their side of the story in your memo.",
        rubricPoints: [
          "States the conversion numbers for control and treatment",
          "Identifies that a randomization check must come before any lift",
          "Names the buyer and seller sides of the marketplace effect",
          "Frames the decision as ship, no-ship, or retest",
        ],
        checkpointPrompt:
          "What is the business question, and what must be checked before any lift is trusted?",
      },
      {
        id: "da-pricing-ab-test-k2",
        title: "What you deliver",
        noteSection: "outcome",
        slides: [
          {
            heading: "Three outputs and one shipping rule",
            bullets: [
              "A randomization check, then conversion and GMV per visitor lift with 95% intervals",
              "A segment view across app and web, and logged-in and logged-out shoppers",
              "A memo with a clear recommendation",
            ],
            visual: "flow",
            flow: ["Check randomization", "Compute lift and intervals", "Review segments", "Write the memo"],
          },
          {
            heading: "The bar to ship",
            bullets: [
              "Conversion lift must clear 0.2 percentage points",
              "The 95% interval must sit above zero",
            ],
            visual: "metric",
            metric: { label: "Ship rule", value: "+0.2 pts and CI above 0" },
          },
        ],
        transcript:
          "Here is what I need from you. A notebook that checks the randomization first, with a sample ratio mismatch test on the assignment counts. Then the lift in conversion and in gross merchandise value per visitor, each with a ninety-five percent interval. Then a segment view across app and web, and across logged-in and logged-out shoppers. Last, a memo with a recommendation. Our rule is simple. The conversion lift needs to clear two-tenths of a point, and its interval has to sit above zero. I also need to know whether the lift comes from one place and hurts another. If the effect depends on the channel, the memo should say so clearly. Do not give me a p-value and nothing else. I need a number a director can repeat in a meeting without getting it wrong.",
        rubricPoints: [
          "Requires a sample ratio mismatch check before reporting lift",
          "Asks for conversion and GMV per visitor, each with an interval",
          "Names the app versus web segment analysis",
          "States the ship rule as a lift above 0.2 points with an interval above zero",
        ],
        checkpointPrompt: "Describe the three outputs and the shipping rule in your own words.",
      },
      {
        id: "da-pricing-ab-test-k3",
        title: "Where I would look first",
        noteSection: "process",
        slides: [
          {
            heading: "Observed split by arm (%)",
            bullets: [
              "Design was 50/50, with roughly 101,800 assigned users",
              "Observed split is 51.2% control and 48.8% treatment",
            ],
            visual: "chart",
            chart: [
              { label: "Control", value: 51 },
              { label: "Treatment", value: 49 },
            ],
          },
          {
            heading: "Work order",
            bullets: [
              "Trace the assignment path before you blame the product",
              "Confirm the cause, then rerun the comparison on clean traffic",
            ],
            visual: "flow",
            flow: ["Check assignment path", "Confirm the cause", "Rerun on clean traffic"],
          },
        ],
        transcript:
          "Let me tell you where I'd look first. The assignment service should split users fifty-fifty. Our counts came back fifty-one point two percent control and forty-eight point eight percent treatment, across about one hundred one thousand users. That gap is too big to be luck, so the test has a sample ratio mismatch. My guess is the feature flag call timing out on logged-out web sessions, which fall back to control. Confirm that before you blame anything. If the cause sits in the assignment path, the conversion lift may be measuring a different population. Once you find the cause, separate the clean traffic from the contaminated traffic and rerun the comparison on the clean set. Show me both results side by side, so I can see how much the answer moved.",
        rubricPoints: [
          "Recognizes the uneven split as a sample ratio mismatch",
          "Proposes checking the assignment path and its fallback behavior",
          "Notes that the lift may describe a different population",
          "Plans to compare clean and contaminated results side by side",
        ],
        checkpointPrompt: "How would you check whether the split problem is real, and what would you do about it?",
      },
    ],
  },
  pou: [
    {
      id: "da-pricing-ab-test-q1",
      prompt: "Why does a sample ratio mismatch matter even when the lift looks positive?",
      rubricPoints: [
        "An SRM means assignment was not random, so the groups may differ in ways we cannot see",
        "The measured lift may describe a different population than the one we want to ship to",
        "The mismatch must be diagnosed before the effect can be trusted",
      ],
      followUp: "What would you check first to find the cause of the mismatch?",
    },
    {
      id: "da-pricing-ab-test-q2",
      prompt: "How do you report uncertainty on the conversion lift to a director who does not work with statistics?",
      rubricPoints: [
        "Give the point estimate together with a 95 percent interval",
        "Explain the interval as the range of effects consistent with the data",
        "Say which result would change the decision",
      ],
      followUp: "What does it mean if the interval for the lift includes zero?",
    },
    {
      id: "da-pricing-ab-test-q3",
      prompt: "Why would you split results by app and web before making a shipping call?",
      rubricPoints: [
        "The effect can differ across channels",
        "An average can hide a segment that gets worse",
        "A segment needs enough sample before it can be trusted",
      ],
      followUp: "How would you tell a real segment difference from noise?",
    },
  ],
  stages: [
    {
      id: "da-pricing-ab-test-s1",
      order: 1,
      title: "Audit the randomization",
      summary: "Confirm the traffic split is trustworthy before measuring any outcome.",
      estMinutes: 30,
      kind: "work",
      requirements: [
        "Count assigned users per variant from experiment_assignments and compare them to the 50/50 design",
        "Run a chi-square sample ratio mismatch test and report the statistic and p-value",
        "Break the imbalance down by platform and login state to locate the cause",
        "Write a one-paragraph diagnosis with a recommended next step",
      ],
      planOpener:
        "Before anyone looks at conversion, I need to know whether the split is real. The design said fifty-fifty and the counts do not match. Tell me how you will run the mismatch test and which breakdowns you will use to find where the imbalance comes from.",
      learn: [
        {
          id: "da-pricing-ab-test-s1-l1",
          title: "Sample ratio mismatch in practice",
          minutes: 5,
          body: `An A/B test is only as good as its assignment. If the design says 50/50, the counts of users in each arm should land close to 50/50 once you have enough of them. A sample ratio mismatch, or SRM, is a statistically unlikely gap between the designed split and the observed split. It is one of the few checks that can tell you the test is broken before you look at any outcome.

The test is a chi-square goodness-of-fit on the assignment counts. With 101,800 users, a split of 52,114 to 49,686 is far from the expected 50,900 in each arm.

\`\`\`python
from scipy.stats import chisquare

observed = [52114, 49686]
expected = [sum(observed) / 2] * 2
stat, p = chisquare(observed, f_exp=expected)
print(round(stat, 1), p)
\`\`\`

A tiny p-value means the imbalance is very unlikely to be chance. It does not tell you the cause. Next, break the counts down by platform, login state and entry page. An SRM that appears only on logged-out web traffic points at a bug in the assignment path, such as a fallback that sends users to control when a service times out.

Until the SRM is explained, do not report the lift. A mismatch means the arms may contain different people, and any difference in conversion could come from that rather than from the fee.`,
          check: {
            question: "What does a very small p-value from an SRM test tell you?",
            options: [
              "The assignment split probably is not what the design intended, so the groups may not be comparable",
              "The treatment definitely made users buy more",
              "The lift is statistically significant",
              "The sample is too large to analyze",
            ],
            answerIndex: 0,
            explanation:
              "An SRM test compares assignment counts with the design. A tiny p-value means the imbalance is very unlikely to be chance, which points to a bug or biased path, and the outcome comparison cannot be trusted until the cause is understood.",
          },
        },
      ],
      submission: {
        kinds: ["github", "file"],
        instructions:
          "Commit the SRM notebook to your repo and attach a one-paragraph diagnosis as a file, with the chi-square statistic and p-value stated.",
      },
      rubricHints: {
        understanding: "Explains what an SRM test checks and why an imbalance threatens the validity of the lift.",
        quality: "The SRM calculation is correct and the breakdowns isolate where the imbalance sits.",
        communication: "The diagnosis is short, states the numbers and names a concrete next step.",
        independence: "Chooses useful breakdowns on their own rather than waiting for instructions.",
      },
      xp: 170,
    },
    {
      id: "da-pricing-ab-test-s2",
      order: 2,
      title: "Estimate lift and intervals",
      summary: "Compute conversion and GMV per visitor lift with 95 percent intervals on the clean population.",
      estMinutes: 40,
      kind: "work",
      requirements: [
        "Compute conversion for each arm using visitors as the unit, not orders",
        "Report absolute and relative lift with 95 percent confidence intervals",
        "Compute GMV per visitor for each arm with an interval",
        "Repeat the comparison on the clean population after excluding the affected traffic",
      ],
      planOpener:
        "The headline is conversion, but the business also cares about GMV per visitor. Tell me the unit of analysis you will use and how you will build the intervals. Also tell me how you will define the clean population, because that choice will move the answer.",
      learn: [
        {
          id: "da-pricing-ab-test-s2-l1",
          title: "Lift and intervals for conversion",
          minutes: 6,
          body: `The unit of randomization is the visitor. Each visitor was assigned to one arm, so conversion should be the share of visitors who bought at least once. Counting orders instead breaks the setup, because one buyer can place several orders and inflate the numerator, and the orders from a single buyer are not independent.

Once you have buyers and visitors per arm, the difference in conversion is a difference of two proportions. The normal approximation is fine at this sample size.

\`\`\`python
import numpy as np

p1 = c["buyers"] / c["visitors"]
p2 = t["buyers"] / t["visitors"]
se = np.sqrt(p1 * (1 - p1) / c["visitors"] + p2 * (1 - p2) / t["visitors"])
diff = p2 - p1
ci = (diff - 1.96 * se, diff + 1.96 * se)
\`\`\`

Report the absolute lift in percentage points and the relative lift as a percent of control. A lift of 0.32 points on a base of 3.10 percent is about a ten percent relative change, and the two numbers answer different questions. Put both in the memo. For GMV per visitor, the distribution is skewed by a few large orders, so use a bootstrap interval rather than the normal formula.

Decide the clean population before you look at the outcome, and write the rule down. Changing it after seeing the result is how teams talk themselves into a win.`,
          check: {
            question: "Why use visitors rather than orders as the unit when computing conversion?",
            options: [
              "A visitor is the randomized unit, and one buyer can place several orders, which breaks independence",
              "Orders are always more numerous than visitors",
              "Visitors are easier to join in SQL",
              "Orders include refunds, which makes them unreliable",
            ],
            answerIndex: 0,
            explanation:
              "Randomization happened at the visitor level. Counting orders lets a single buyer inflate the result, and the repeated orders are not independent observations, so the interval would be too narrow.",
          },
        },
      ],
      submission: {
        kinds: ["github", "url"],
        instructions:
          "Push the lift notebook to your repo and link the rendered notebook output in the submission. Include both the full-population and clean-population tables.",
      },
      rubricHints: {
        understanding: "Explains why visitors are the unit and how the interval reflects sampling uncertainty.",
        quality: "Lift is computed correctly with intervals, and the clean population rule is stated before results.",
        communication: "Reports absolute and relative lift together with the intervals in a table a director can read.",
        independence: "Runs the clean-population comparison without being asked to.",
      },
      xp: 200,
    },
    {
      id: "da-pricing-ab-test-s3",
      order: 3,
      title: "Check segments and recommend",
      summary: "Look for segment effects, then decide and write the ship or no-ship memo.",
      estMinutes: 35,
      kind: "work",
      requirements: [
        "Report lift for app and web separately, with an interval for each",
        "Check logged-in versus logged-out shoppers and the listing price bands",
        "Flag any segment with fewer than 2,000 visitors per arm as directional only",
        "Write a ship, no-ship or retest recommendation with the two main risks",
      ],
      planOpener:
        "Averages hide things. Tell me which segments you will look at and how you will decide whether a segment difference is real or just noise. We will talk about what the memo needs before you write it.",
      learn: [
        {
          id: "da-pricing-ab-test-s3-l1",
          title: "Reading segment effects honestly",
          minutes: 5,
          body: `A segment is a slice of the test population, such as app users, web users or shoppers on a particular listing price band. Slicing is useful because a fee change can help one group and hurt another, and an average can hide that. Slicing is also dangerous, because the more slices you look at, the more likely one of them looks dramatic by chance.

Decide your segments before you open the results, and keep the list short. Then compute the same lift for each segment, with its own interval and visitor counts.

\`\`\`python
seg = (
    df.groupby(["platform", "variant"])
      .agg(visitors=("visitor_id", "nunique"), buyers=("buyer", "sum"))
      .reset_index()
)
\`\`\`

A segment with only a few hundred visitors per arm has a wide interval. A lift of six tenths of a point there may be real, but it is directional. Say so in the memo, and do not let it carry the recommendation alone.

Look for a pattern across segments, not a single standout. If the app shows a clear gain and web shows a gain whose interval crosses zero, the honest summary is that the evidence is strong in one channel and inconclusive in the other. That is a reason to retest web, not a reason to ship everywhere or to shelve the idea.`,
          check: {
            question: "A segment shows a lift of +0.6 points with about 400 visitors per arm. What is the most honest reading?",
            options: [
              "Directional only, because the sample is too small to separate the effect from noise",
              "Ship the fee for that segment immediately",
              "Ignore the segment entirely",
              "The lift is exact because the segment is small",
            ],
            answerIndex: 0,
            explanation:
              "With about 400 visitors per arm the interval will be wide, so the apparent lift could easily be noise. It is worth noting and retesting, but it should not drive a ship decision on its own.",
          },
        },
      ],
      submission: {
        kinds: ["file", "text"],
        instructions:
          "Attach the ship or no-ship memo as a file, and paste a three-sentence summary of the recommendation into the text submission.",
      },
      rubricHints: {
        understanding: "Explains why segment effects can change the decision and why small segments need caution.",
        quality: "Segment results include intervals and visitor counts, and the recommendation follows from the evidence.",
        communication: "The memo states the recommendation first, then the risks, in a form a director can read in five minutes.",
        independence: "Identifies the web segment concern on their own and proposes a concrete follow-up.",
      },
      xp: 230,
    },
    {
      id: "da-pricing-ab-test-s4",
      order: 4,
      title: "Defend the recommendation",
      summary: "Present the finding and the recommendation to Dev in a recorded walkthrough.",
      estMinutes: 30,
      kind: "presentation",
      requirements: [
        "Record 5 to 8 minutes covering the SRM finding, the lift with its interval and the segment view",
        "Give a clear ship, no-ship or retest answer in the first 30 seconds",
        "Name the two biggest risks to the recommendation, including the seller impact",
        "Say which result would change your decision",
      ],
      planOpener:
        "This is your read-out. I will push on sellers, so be ready for that. Record a short walkthrough and lead with the decision. Tell me your recommendation in one sentence before you start recording.",
      learn: [
        {
          id: "da-pricing-ab-test-s4-l1",
          title: "Structuring a decision memo",
          minutes: 4,
          body: `A decision memo is read by someone who has to act on it this week. The most important sentence is the recommendation, and it should be the first thing on the page. The second most important thing is the reason the recommendation might be wrong. Everything else is support.

A useful structure has four parts. Start with the decision: ship, do not ship, or retest, along with the single number that drives it. Next, the evidence: the SRM result and how it was handled, the conversion lift with its interval, and the GMV effect. Then the segments, flagged by how much weight each can bear. Last, the risks and the trigger that would change your mind, such as a seller churn signal above a set level in the first month.

Write the numbers the way a director will repeat them. "Conversion rose 0.3 points, with a range of 0.1 to 0.5" is clear. "The effect was significant at the 0.05 level" is not something a person can take into a meeting.

Avoid the methodology appendix in the body. Put the SRM details, the query and the code in the notebook, and link it. A reader who trusts your conclusion should be able to find the detail without you explaining it in the memo.`,
          check: {
            question: "In a decision memo, what should come first?",
            options: [
              "The recommendation and its main risk, so the reader can act even if they read only the opening",
              "A full history of how the test was designed",
              "Every table from the notebook in order",
              "The methodology appendix",
            ],
            answerIndex: 0,
            explanation:
              "Readers often stop after the opening. Putting the recommendation and its main risk first lets them act on the memo immediately, while the supporting evidence is there for anyone who keeps reading.",
          },
        },
      ],
      submission: {
        kinds: ["recording"],
        instructions:
          "Upload a screen recording of 5 to 8 minutes walking through the SRM finding, the lift, the segments and your recommendation. State the decision in the first 30 seconds.",
      },
      rubricHints: {
        understanding: "Explains the SRM issue, the lift and its interval, and what the segment results do and do not show.",
        quality: "The walkthrough uses correct numbers and is backed by a notebook a reviewer can rerun.",
        communication: "Leads with a clear decision and speaks to a director who wants a number they can repeat.",
        independence: "Raises the seller-side risk before being asked and names what would change the call.",
      },
      xp: 260,
    },
  ],
  map: { x: 50, y: 80 },
};

// ───────────────────────────── Scenario 3: demand forecasting ─────────────────────────────

const forecast: Scenario = {
  id: "da-demand-forecast",
  careerId: "data-analyst",
  companyId: "larkfield-grocers",
  npcId: "npc-ruth-abernathy",
  order: 3,
  title: "Forecast Produce Demand Before the Shelves Empty",
  coverWord: "FORECAST THE SHELF",
  problemStatement:
    "Larkfield's 41 stores lost an estimated 2.3 percent of fresh produce sales last quarter to stockouts, and threw away about 4 percent more from overordering. Build a seasonal baseline forecast for the top 500 fresh SKUs using two years of daily point-of-sale data, measure forecast error with MAPE and bias, design an inventory dashboard for store managers and supply planners, and set alert thresholds that fire before a shelf goes empty.",
  userRole: "Analytics analyst on the Supply Planning team",
  projectType: "Demand forecast and inventory dashboard",
  difficulty: "advanced",
  estMinutes: 200,
  maxXp: 1460,
  tools: [
    "Python with pandas and statsmodels",
    "SQL on the retail warehouse",
    "dbt for the transformation layer",
    "Looker-style BI dashboards",
    "Google Sheets for threshold review",
  ],
  workflows: [
    "Clean the daily sales history",
    "Build a seasonal baseline forecast",
    "Measure forecast error",
    "Design the inventory dashboard and alert thresholds",
  ],
  skills: ["Seasonal decomposition", "MAPE and bias", "Forecast backtesting", "Dashboard design", "Alert design"],
  deliverables: [
    {
      title: "Forecast notebook and dbt model",
      description:
        "A backtested seasonal baseline with MAPE and bias by category, plus the dbt model that publishes the daily store-SKU forecast.",
      kind: "github",
    },
    {
      title: "Dashboard spec and alert thresholds",
      description:
        "A dashboard wireframe with metric definitions and the alert thresholds, each with its lead-time rationale.",
      kind: "file",
    },
  ],
  kickoff: {
    segments: [
      {
        id: "da-demand-forecast-k1",
        title: "The shelf problem",
        noteSection: "problem",
        slides: [
          {
            heading: "Fresh produce lost last quarter",
            bullets: [
              "About 2.3% of fresh produce sales lost to empty shelves across 41 stores",
              "About 4% more thrown away after overordering",
            ],
            visual: "metric",
            metric: { label: "Produce sales lost to stockouts", value: "2.3%" },
          },
          {
            heading: "Where the lost dollars come from (%)",
            bullets: [
              "Stockouts account for most of the shrink dollars",
              "Overordering covers the rest, mostly on weekends and holidays",
            ],
            visual: "chart",
            chart: [
              { label: "Stockout loss", value: 58 },
              { label: "Overordered waste", value: 42 },
            ],
          },
        ],
        transcript:
          "Let me start with the shelf. Last quarter our forty-one stores lost about two point three percent of fresh produce sales to stockouts. That is a sale we never got because the bin was empty on a Saturday morning. We also threw away about four percent of fresh produce because stores ordered too much on other days. Stockouts make up roughly fifty-eight percent of the dollars we lost, and overordering makes up the rest. Supply planning currently runs on a simple rule, last week times a store factor, and it misses holidays and weather. I want a seasonal baseline for our top five hundred fresh SKUs, honest error numbers to prove how good it is, and a dashboard the store managers can read every morning. Pay attention to hurricane days, because a closed store will break your history if you ignore it.",
        rubricPoints: [
          "Quantifies the stockout loss and the overordering waste",
          "Names the current rule and why it misses holidays and weather",
          "Frames the work as baseline, error measurement, dashboard and alerts",
          "Notes that closed-store days distort the history",
        ],
        checkpointPrompt: "What does the current problem cost, and what must a better forecast account for?",
      },
      {
        id: "da-demand-forecast-k2",
        title: "What success looks like",
        noteSection: "outcome",
        slides: [
          {
            heading: "The four outputs",
            bullets: [
              "Daily unit forecasts for each store and SKU, 14 days ahead",
              "MAPE and bias by category and by store cluster",
              "A dashboard a store manager can read in under a minute",
              "Alert thresholds that fire with enough lead time to reorder",
            ],
            visual: "flow",
            flow: ["Baseline forecast", "Measure error", "Manager dashboard", "Alert thresholds"],
          },
          {
            heading: "The accuracy bar",
            bullets: [
              "Backtest on the last 12 weeks, not the training window",
              "Bias should stay within plus or minus 5 percent",
            ],
            visual: "metric",
            metric: { label: "Target MAPE, top 500 SKUs", value: "under 18%" },
          },
        ],
        transcript:
          "Here is what success looks like. First, a daily forecast for every store and every top five hundred fresh SKU, fourteen days ahead, built from a seasonal baseline you can explain. Second, honest error measurement. I want MAPE and bias by category and by store cluster, backtested on the last twelve weeks and not scored on the training window. Our target is a MAPE under eighteen percent for the top SKUs, with bias inside plus or minus five percent. Third, a dashboard a store manager can read in under a minute, showing projected days of cover, the next three days of forecast and any SKU at risk. Fourth, alert thresholds that fire early enough for a manager to reorder. A forecast that is accurate on paper but arrives after the truck is useless to us, so think about timing from the start.",
        rubricPoints: [
          "States the forecast horizon and granularity",
          "Uses MAPE and bias as error measures with a backtest",
          "Describes the store manager dashboard and its one-minute test",
          "Ties the alerts to reorder lead time",
        ],
        checkpointPrompt: "Describe the four outputs and how you would know the forecast is good enough to use.",
      },
      {
        id: "da-demand-forecast-k3",
        title: "How I want you to work",
        noteSection: "process",
        slides: [
          {
            heading: "Work order",
            bullets: [
              "Clean the sales history before modeling anything",
              "Decompose seasonality by category, then build a naive benchmark",
              "Backtest on rolling 12-week windows",
            ],
            visual: "flow",
            flow: ["Clean the sales history", "Decompose seasonality", "Backtest the baseline", "Tune alerts with planners"],
          },
          {
            heading: "Planners decide if it is usable",
            bullets: [
              "A forecast planners do not trust gets overridden",
              "Set alert thresholds from planner answers, not from intuition",
            ],
            visual: "quote",
            quote: {
              text: "A forecast the planners do not trust will get overridden by Friday.",
              author: "Ruth Abernathy, Senior Manager, Supply Planning Analytics",
            },
          },
        ],
        transcript:
          "Here is the order I want you to follow. Start with the sales history and clean it before you model anything. Hurricane closures show up as zero sales for every SKU in a store, so mark those days and exclude them from training. Returns come through as negative units, so decide whether they belong in demand and write that decision down. Then decompose weekly seasonality by category. Produce and dairy behave differently around holidays, and Thanksgiving week is its own problem. Build a seasonal naive baseline first and beat it with something simple before you reach for anything fancy. Backtest on rolling twelve-week windows. Finally, sit down with two planners and ask what alert would make them act. Their answers should set your thresholds, not your gut.",
        rubricPoints: [
          "Excludes closed-store days from training",
          "Handles returns as negative units under a stated rule",
          "Uses seasonal decomposition and a naive benchmark before anything complex",
          "Sets alert thresholds using planner input",
        ],
        checkpointPrompt: "How will you clean the history and choose the baseline before any modeling?",
      },
    ],
  },
  pou: [
    {
      id: "da-demand-forecast-q1",
      prompt: "Why is MAPE misleading for slow-moving SKUs, and what would you report alongside it?",
      rubricPoints: [
        "MAPE explodes when actual sales are near zero",
        "A weighted measure such as WAPE or bias is more stable for slow movers",
        "Error should be reported by volume band, not as one number",
      ],
      followUp: "How would you report accuracy for an item that sells two units a week?",
    },
    {
      id: "da-demand-forecast-q2",
      prompt: "How would you prove the seasonal baseline beats last week times a store factor?",
      rubricPoints: [
        "Backtest both methods on the same rolling holdout windows",
        "Compare error on weeks the model never saw during training",
        "Report the improvement with the same metric for both",
      ],
      followUp: "What would make you distrust a result that looks too good?",
    },
    {
      id: "da-demand-forecast-q3",
      prompt: "What should an alert fire on, and why is forecast error alone not enough?",
      rubricPoints: [
        "Alert on projected days of cover falling below reorder lead time",
        "Forecast error alone does not tell a manager what to do",
        "Thresholds should reflect lead time and planner input",
      ],
      followUp: "What threshold would you start with for a produce SKU with a two-day shelf life?",
    },
  ],
  stages: [
    {
      id: "da-demand-forecast-s1",
      order: 1,
      title: "Clean the sales history",
      summary: "Prepare two years of daily store-SKU sales for modeling.",
      estMinutes: 35,
      kind: "work",
      requirements: [
        "Flag store-days with closures using the closure log and exclude them from training",
        "Define how returns and negative units are handled and document the rule",
        "Route SKUs with fewer than 60 days of history into a separate group",
        "Produce a tidy daily table with one row per store, SKU and date",
      ],
      planOpener:
        "Two years of point-of-sale history sounds clean until you open it. Tell me how you will find closure days, what you will do with returns and how you will treat new SKUs. Give me your rules before you write the transform.",
      learn: [
        {
          id: "da-demand-forecast-s1-l1",
          title: "Cleaning retail sales history",
          minutes: 6,
          body: `Retail sales history looks clean in a dashboard and turns out to be full of traps when you model it. Three cause the most damage. Closed days are recorded as zero, which teaches a model that demand disappeared. Returns are recorded as negative units, which can pull a week's demand below zero. New SKUs have a few weeks of history, which makes any seasonal pattern unreliable.

Start by removing closed store-days. Use the closure log, not the sales table, to decide what was closed, because a store can record a few sales on a closed day.

\`\`\`sql
select p.store_id, p.sku_id, p.sale_date, sum(p.units_sold) as units
from pos_sales_daily p
where not exists (
  select 1
  from store_closures c
  where c.store_id = p.store_id
    and c.closed_date = p.sale_date
)
group by 1, 2, 3;
\`\`\`

Next, decide what returns mean for demand. Most teams keep the sale and the return as separate measures and forecast net demand only when returns are reliable. Write the rule in the data quality log, including how you treat a SKU with a large return rate.

Finally, route new SKUs to a separate group. A category-level profile is a better starting point for them than a model fit to two months of data. Keep these rules in one place, because every forecast downstream depends on them.`,
          check: {
            question: "A hurricane closed a store for three days, and the sales table shows zero units. What should you do before modeling?",
            options: [
              "Exclude those store-days from training so the model does not learn a false drop",
              "Keep them, since zero sales are real demand",
              "Replace them with the yearly average",
              "Remove them only for perishable SKUs",
            ],
            answerIndex: 0,
            explanation:
              "Zeros from a closed store are not demand. Training on them teaches the model a drop that never happened, which later shows up as false stockout risk.",
          },
        },
      ],
      submission: {
        kinds: ["github", "file"],
        instructions:
          "Commit the cleaning SQL and transform to your repo and attach the data quality log as a file, with one row per rule and the count of rows it affected.",
      },
      rubricHints: {
        understanding: "Explains why closed days, returns and new SKUs distort a forecast if left alone.",
        quality: "Closure exclusion uses the closure log, and every rule is documented with its row counts.",
        communication: "The data quality log lets a planner see each rule and its effect without reading the code.",
        independence: "Finds the closure and return issues without being walked through them.",
      },
      xp: 180,
    },
    {
      id: "da-demand-forecast-s2",
      order: 2,
      title: "Build the seasonal baseline",
      summary: "Fit a seasonal baseline and beat the naive benchmark on holdout weeks.",
      estMinutes: 40,
      kind: "work",
      requirements: [
        "Build a seasonal naive baseline by category, weekday and week-of-year",
        "Benchmark it against last week times a store factor on the same rolling holdouts",
        "Report MAPE and bias by category for the top 500 SKUs across 12 holdout weeks",
        "Flag any category with MAPE above 25 percent for review",
      ],
      planOpener:
        "Start simple. The baseline has to beat what planners do today, which is last week times a store factor. Tell me your baseline method, your holdout design and which categories you expect to be hardest. I want numbers, not promises, before we go further.",
      learn: [
        {
          id: "da-demand-forecast-s2-l1",
          title: "Seasonal baselines and holdouts",
          minutes: 6,
          body: `A seasonal baseline is a forecast that repeats the pattern of the past. For produce, the pattern is strong: the same weekday tends to look similar week after week, and the same week of the year tends to look similar year after year. A baseline that captures those two rhythms is hard to beat, and it gives you something concrete to improve on.

Build the profile from training data only, then score the forecast on weeks the profile has never seen. Scoring on the training window rewards memorization and tells you nothing about the next two weeks.

\`\`\`python
cutoff = pd.Timestamp("2026-08-01")
train = df[df.sale_date < cutoff]
test = df[(df.sale_date >= cutoff) & (df.sale_date < cutoff + pd.Timedelta(weeks=12))]

profile = train.groupby(["category", "dow"])["units"].mean().rename("baseline")
scored = test.join(profile, on=["category", "dow"])
\`\`\`

Use rolling origins, meaning you move the cutoff several times and average the results. A single holdout can be unrepresentative, especially if it contains a holiday. Compare the baseline with last week times a store factor on exactly the same windows. If your method cannot beat that rule, the extra complexity is not earning its keep.

Report the results by category. A baseline that looks good overall can still miss badly on bakery, where short shelf life makes every miss expensive.`,
          check: {
            question: "Why should a seasonal baseline be scored on holdout weeks that come after the training window?",
            options: [
              "Scoring on training data rewards memorization, while a holdout shows how the forecast performs on weeks it has not seen",
              "Holdout weeks always contain more sales",
              "Pandas cannot score data that was used for training",
              "It makes the dashboard refresh faster",
            ],
            answerIndex: 0,
            explanation:
              "A forecast that is only scored on its own training data looks better than it will perform. Holdout weeks show how it behaves on new data, which is what planners will actually use.",
          },
        },
      ],
      submission: {
        kinds: ["github", "file"],
        instructions:
          "Commit the baseline notebook and attach a table of MAPE and bias by category for the 12 holdout weeks, including the last-week-times-store-factor comparison.",
      },
      rubricHints: {
        understanding: "Explains why a seasonal baseline must be scored on unseen weeks and compared to the current rule.",
        quality: "The baseline and benchmark use the same holdouts, and the error tables are computed correctly.",
        communication: "The comparison table states clearly whether the baseline beats the current rule and by how much.",
        independence: "Chooses rolling holdouts and flags weak categories without being asked.",
      },
      xp: 210,
    },
    {
      id: "da-demand-forecast-s3",
      order: 3,
      title: "Measure error and design the dashboard",
      summary: "Report forecast error honestly and design the screens store managers will read each morning.",
      estMinutes: 40,
      kind: "work",
      requirements: [
        "Report MAPE and bias for the top 500 SKUs, split by volume band and store cluster",
        "Add a weighted error measure for slow-moving SKUs alongside MAPE",
        "Wireframe a store manager dashboard showing projected days of cover and the next three days of forecast",
        "Define each dashboard metric in one line so managers and planners read it the same way",
      ],
      planOpener:
        "The dashboard is where your forecast meets a person with a clipboard in a cold cooler. Tell me how you will report error across volume bands, and sketch the screens you plan to build. Keep it to what a store manager will read before the 6 a.m. delivery.",
      learn: [
        {
          id: "da-demand-forecast-s3-l1",
          title: "Choosing error metrics that mean something",
          minutes: 7,
          body: `MAPE is the most common forecast metric and one of the easiest to misread. It divides each error by the actual value. When actual sales are close to zero, that division blows up. A SKU that sells two units in a week and is forecast at four units shows a 100 percent error, and a single slow item can drag an average far past any useful number.

Use more than one measure, and make each one answer a specific question. MAPE is useful for comparing well-selling items. WAPE, which is total absolute error divided by total actual units, weights the error by volume and stays stable for slow movers. Bias, which is total forecast minus total actual divided by total actual, tells you whether the forecast leans high or low, and a biased forecast causes overordering or stockouts even when its error looks small.

\`\`\`python
valid = actual > 0
mape = (err.abs()[valid] / actual[valid]).mean()
wape = err.abs().sum() / actual.sum()
bias = err.sum() / actual.sum()
\`\`\`

Report all three by volume band, such as top, middle and tail, and by store cluster. A dashboard that shows one blended error number will hide exactly the problems managers care about. Define each metric in a single line on the dashboard, so a planner and a store manager mean the same thing when they say accuracy.`,
          check: {
            question: "A SKU sells about two units a week and MAPE reports 90 percent. What is the most useful next step?",
            options: [
              "Report WAPE and bias for that volume band, since MAPE is inflated by small denominators",
              "Drop the SKU from the report entirely",
              "Raise the forecast by 90 percent",
              "Switch the dashboard to show only average price",
            ],
            answerIndex: 0,
            explanation:
              "MAPE divides by small actual values for slow movers, which inflates it. A weighted measure and bias for that volume band show how the forecast performs in a way planners can act on.",
          },
        },
      ],
      submission: {
        kinds: ["file", "url"],
        instructions:
          "Attach the dashboard wireframe and metric definitions as a file, and link the error report view in the submission.",
      },
      rubricHints: {
        understanding: "Explains why MAPE misleads on slow movers and what WAPE and bias add.",
        quality: "Error is reported by volume band and store cluster, with metric definitions that are unambiguous.",
        communication: "The dashboard is readable in under a minute and every metric has a one-line definition.",
        independence: "Splits the error by volume band before a manager asks why the single number looks odd.",
      },
      xp: 240,
    },
    {
      id: "da-demand-forecast-s4",
      order: 4,
      title: "Present the forecast and alert plan",
      summary: "Walk Ruth through forecast accuracy, the dashboard and the alert thresholds in a recorded review.",
      estMinutes: 30,
      kind: "presentation",
      requirements: [
        "Record a 5 to 8 minute walkthrough of baseline accuracy against the current rule",
        "Explain the MAPE, WAPE and bias results for the top 500 SKUs in plain language",
        "Walk through the dashboard and each alert threshold with its lead-time rationale",
        "Name the one category you do not yet trust and what you will do about it",
      ],
      planOpener:
        "Last step. Record a walkthrough as if I were walking into the Monday supply meeting. Lead with the accuracy result against the current rule, then the alerts. Tell me which category worries you before you record.",
      learn: [
        {
          id: "da-demand-forecast-s4-l1",
          title: "Presenting to an operations lead",
          minutes: 4,
          body: `An operations lead does not need to know how the seasonal term was fit. She needs to know whether the forecast is better than what her team does today, where it is weak, and what she should do differently on Monday. Build the presentation around those three questions.

Open with the comparison. Say that the new baseline cut the weekly miss on the top 500 SKUs compared with last week times a store factor, and give the number in units or in dollars of lost sales where you can. A supply lead thinks in cases and pallets, so translate percentages into the thing she orders.

Then show the error by volume band. Explain bias in plain words: if the forecast runs high, stores overorder; if it runs low, shelves empty. Say which category you do not trust yet and why, such as bakery during a holiday week with little history.

Finally, walk through the alerts. For each threshold, state the trigger, the lead time it gives a manager to reorder, and who gets the message. A threshold with no owner will be ignored by Friday.

Stay under eight minutes. Name the risk before the listener does.`,
          check: {
            question: "What should a forecast presentation to an operations lead lead with?",
            options: [
              "The decision it supports and whether it beats the current rule, with error in operational terms",
              "The full list of model parameters",
              "A history of the data pipeline",
              "The statistical test used to fit the seasonal term",
            ],
            answerIndex: 0,
            explanation:
              "An operations lead acts on decisions. Leading with whether the forecast beats the current rule, and what error means in cases or dollars, gives her what she needs to decide.",
          },
        },
      ],
      submission: {
        kinds: ["recording"],
        instructions:
          "Upload a screen recording of 5 to 8 minutes walking through the accuracy result, the dashboard and the alert thresholds. State the main result in the first 30 seconds.",
      },
      rubricHints: {
        understanding: "Explains what the forecast gets right and wrong and why bias matters as much as error.",
        quality: "Accuracy numbers are correct and the alert thresholds have a stated rationale tied to lead time.",
        communication: "Translates error into cases, dollars or lost sales that an operations lead can act on.",
        independence: "Names the category they do not trust and a concrete plan to address it without prompting.",
      },
      xp: 280,
    },
  ],
  map: { x: 64, y: 58 },
};

const pack: CareerPack = {
  career,
  companies,
  npcs,
  scenarios: [retention, pricing, forecast],
};

export default pack;
