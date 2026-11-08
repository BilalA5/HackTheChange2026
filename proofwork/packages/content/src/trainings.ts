import type { Training } from "@pw/shared";

export const trainings: Training[] = [
  // ───────────────────────────── Skill ─────────────────────────────
  {
    id: "tr-structured-prompting",
    kind: "skill",
    title: "Structured prompting for production",
    summary: "Turn a one-off prompt into a reliable component with a clear contract, defined inputs and checkable outputs. Built for anyone shipping model features.",
    minutes: 18,
    tags: ["llm", "prompting", "reliability"],
    recommendedFor: ["ai-engineer", "data-analyst"],
    lessons: [
      {
        title: "Write a prompt contract",
        caption: "Every production prompt states its role, inputs, output shape and failure behaviour.",
        body: `A prompt that works once in a playground is not yet a component. In production, the prompt is a contract between your code and the model, so write it like one.

Start with four parts, in this order:

- **Role and goal**: one sentence describing the job, for example "Classify support tickets by urgency."
- **Inputs**: name each variable and say where it comes from, such as ticket_text and customer_tier.
- **Output shape**: specify the exact format, ideally JSON with named keys and a fixed list of allowed values.
- **Failure behaviour**: tell the model what to do when information is missing, for example return "unknown" rather than guessing.

Before you ship, run this checklist:

1. Can a teammate who has never seen the prompt predict its output?
2. Does every variable appear in the template exactly once?
3. Is there a defined value for "I cannot tell"?
4. Does the parser reject anything outside the allowed values?

Keep the contract short. Long prompts hide conflicting instructions, and conflicting instructions cause the most intermittent bugs. When you change a line, record the reason in version control so the next person knows why the wording exists.`,
      },
      {
        title: "Give examples that teach the edge cases",
        caption: "Two or three well-chosen examples beat a paragraph of rules.",
        body: `Examples do more work than adjectives. Instead of writing "be concise and careful with dates," show the model one input and the exact output you expect.

Pick examples with a purpose:

- One typical case that shows the normal format.
- One ambiguous case that shows how to choose between two labels.
- One empty or broken case that shows the fallback value.

Keep the examples in the same format as the real input. If production text arrives with HTML tags, your examples should too. Otherwise the model learns a cleaner world than the one it actually works in.

Watch the balance of labels. If nine of ten examples say "high", the model will drift toward "high" on unclear inputs. Mix them evenly, and check that the order does not always put one label last.

Store examples as data, not as hard-coded text. A small file of input and expected output pairs lets you add a new edge case in minutes, and it doubles as the seed for your evaluation set later.

A good test: hide the examples from a colleague, give them only the rules, and see whether they produce the same answers. If they cannot, the examples are carrying information the rules are missing.`,
      },
      {
        title: "Validate outputs and retry safely",
        caption: "Never trust a model response until your code has parsed and checked it.",
        body: `Even a well-written prompt will sometimes return malformed output. Plan for that instead of hoping it will not happen.

A simple validation loop looks like this:

    response = call_model(prompt)
    try:
        data = json.loads(response)
        assert data["label"] in ALLOWED
    except (ValueError, KeyError, AssertionError):
        response = call_model(prompt + RETRY_HINT)

Three rules keep this safe:

- Cap retries at two. An endless loop burns money and hides the real problem.
- Log the raw output of every failed attempt. Those logs are your best source of new test cases.
- Make the retry hint specific, such as "Return only the JSON object with the key label."

Decide what happens after the final failure. For a classifier, route the item to a human queue. For a summary, show the user an error state. Never silently insert a guessed value into a downstream system.

Finally, measure the failure rate. If more than a few percent of responses need a retry, the prompt is the thing to fix, not the retry logic.`,
      },
    ],
  },
  {
    id: "tr-git-branching",
    kind: "skill",
    title: "Git branching for project work",
    summary: "Use short-lived branches, small commits and focused pull requests so project history stays readable and reviews stay fast.",
    minutes: 12,
    tags: ["git", "version-control", "collaboration"],
    recommendedFor: ["ai-engineer", "product-manager"],
    lessons: [
      {
        title: "One branch per change",
        caption: "A branch should answer one question and be easy to delete when it is merged.",
        body: `A branch is a label for a line of work. Keep each one focused on a single change, so it can be reviewed, merged or dropped without affecting anything else.

A workable pattern for a small team:

- Branch from the main branch every time you start something new.
- Name branches after the change, such as add-retry-to-ingest or fix-empty-invoice-total.
- Merge within a few days. Long-lived branches drift away from main and create painful merges.

Before you start, run through this checklist:

1. Pull the latest main branch.
2. Create the new branch from it.
3. Write one sentence describing what "done" means for this branch.

If you discover a second problem halfway through, do not add it to the same branch. Commit what you have, open a separate branch for the new problem, and come back later. This keeps reviews small and makes it obvious which change caused a regression.

Delete branches after merging. An old branch with a vague name is noise for everyone who reads the repository later, and it makes the next person wonder whether something important is still pending.`,
      },
      {
        title: "Commits that tell a story",
        caption: "Each commit should do one clearly named thing and leave the project in a working state.",
        body: `Commits are the history of your thinking. A reviewer reading them should understand the order of your decisions without opening every file.

Good commit messages have a short subject in the imperative mood, under about 72 characters, followed by a body when the reason is not obvious:

    Add retry limit to ingest worker

    Ingest jobs were retrying forever on malformed files, which filled the queue.
    Cap retries at three and send the file to the review folder.

Some habits that help:

- Commit after each working step, not only at the end of the day.
- Keep formatting changes in their own commit, so the real change is easy to spot.
- Check what you are about to commit with a status and diff review before saving it.
- Never commit secrets, local settings or generated files.

When a branch contains messy experiments, tidy it before review. Squash the throwaway commits, reorder the rest and rewrite the messages. Do this only on your own branch that nobody else has pulled, because rewriting shared history confuses everyone else.

The payoff is simple. When something breaks in six months, a clear history lets you find the cause with one command instead of an afternoon of guessing.`,
      },
      {
        title: "Opening a reviewable pull request",
        caption: "A good pull request explains why, shows how you checked it and stays small.",
        body: `A pull request is a request for someone to understand your change. Your job is to make that understanding cheap.

Structure every description with three short parts:

- **Why**: the problem or goal in two or three sentences.
- **What changed**: a bullet list of the main edits, so the reviewer knows where to look.
- **How it was checked**: the tests you ran, the manual steps and any result worth noting.

Add a screenshot or a sample output when the change affects what people see or produce. A picture often answers a question that would take three review comments.

Keep the size in mind. Reviews of a few hundred changed lines get careful attention. Reviews of several thousand lines get a skim. If your change is large, split it into a sequence of smaller pull requests that build on each other.

Before requesting review, read your own diff once from top to bottom. Remove debugging output, leftover comments and unrelated edits. You will catch more mistakes in five minutes of self-review than in an hour of reviewer back-and-forth.

When feedback arrives, respond to each comment, either by changing the code or by explaining why not. Silence makes reviewers ask again.`,
      },
    ],
  },
  {
    id: "tr-writing-llm-evals",
    kind: "skill",
    title: "Writing LLM evals",
    summary: "Build a small, honest test set so you can tell whether a model or prompt change made your feature better or worse.",
    minutes: 20,
    tags: ["evals", "llm", "quality"],
    recommendedFor: ["ai-engineer", "product-manager"],
    lessons: [
      {
        title: "Start from real failures",
        caption: "Good eval cases come from observed mistakes, not from imagined ones.",
        body: `An evaluation set is a collection of inputs where you already know what a good answer looks like. The best way to build one is to start from the failures your feature has actually produced.

Collect them in three steps:

1. Pull fifty recent inputs from logs or user sessions, including the bad ones.
2. Mark each output as good, acceptable or wrong, with one sentence of reasoning.
3. Keep the wrong cases, and add the trickiest good ones so the set does not reward a model that refuses everything.

Aim for variety. Include short and long inputs, common and rare topics, and the messy formats your users really send. A set of forty clean, similar examples will tell you very little.

Store each case as a simple record:

    {"id": "case-017", "input": "...", "expected": "refund", "note": "user typed refnd"}

Keep a note on why the case exists. Six months later, that note tells the next person whether the case still matters.

Do not treat the set as finished. Every new production failure is a candidate for the set, and removing an outdated case should be a deliberate choice recorded in version control.`,
      },
      {
        title: "Score with clear rubrics",
        caption: "A rubric turns a vague idea of a good answer into criteria someone else can check.",
        body: `"The answer should be good" cannot be scored. A rubric breaks quality into checkable statements, and each statement gets a clear pass or fail.

For a support-reply feature, a rubric might be:

- The reply mentions the customer's order number. (yes or no)
- The reply does not promise a refund the policy does not allow. (yes or no)
- The reply stays under 120 words. (yes or no)

Where possible, use code for the checks. Length limits, required fields and JSON validity can be tested automatically in milliseconds. Keep human judgement for the things code cannot see, such as tone or whether the answer actually helps.

When you use a model as a grader, test the grader first. Run it on twenty cases you have already labelled yourself, and measure how often it agrees with you. If agreement is low, tighten the grader's instructions before trusting its scores.

Report results as counts, not impressions. "Forty-one of fifty pass the policy check, up from thirty-six" is a statement a stakeholder can act on. "It feels better" is not.`,
      },
      {
        title: "Track results over time",
        caption: "An eval only matters when you rerun it on every change and compare against the last run.",
        body: `A single eval run is a snapshot. The value comes from comparing snapshots, so every prompt, model or retrieval change should trigger a run.

Set up a simple routine:

- Save each run with its date, the model version, the prompt version and the overall pass rate.
- Compare the new run with the previous baseline, case by case, not only in total.
- Flag any case that moved from pass to fail. Those regressions matter more than the headline number.

Pass rates can hide trade-offs. A change that improves accuracy by five points but doubles latency may be a bad trade. Track speed and cost next to quality, so the decision is made with the full picture.

Guard against overfitting. If you tune the prompt until every case in the set passes, the set no longer measures generalisation. Keep a held-out group of cases that you look at only when you are deciding whether to ship.

Finally, make results visible. A shared dashboard or a short weekly note in the team channel keeps quality on the agenda. Teams that never look at the numbers slowly accept regressions without noticing.`,
      },
    ],
  },
  {
    id: "tr-sql-window-functions",
    kind: "skill",
    title: "SQL window functions",
    summary: "Compute rankings, running totals and comparisons with previous rows without collapsing your result set into summary groups.",
    minutes: 22,
    tags: ["sql", "analytics", "querying"],
    recommendedFor: ["product-manager", "data-analyst"],
    lessons: [
      {
        title: "The OVER clause",
        caption: "A window function adds a computed column while keeping every row in the result.",
        body: `A normal aggregate such as SUM or COUNT collapses rows into one result per group. A window function does the same calculation but keeps every row, so you can show the detail and the summary side by side.

The key piece is the OVER clause:

    SELECT
      order_id,
      customer_id,
      amount,
      SUM(amount) OVER (PARTITION BY customer_id) AS customer_total
    FROM orders;

PARTITION BY splits the rows into groups, and the function runs inside each group. Each order row keeps its own amount and also shows its customer's total.

Add ORDER BY inside OVER when the calculation depends on sequence, such as a running total:

    SUM(amount) OVER (PARTITION BY customer_id ORDER BY order_date)

Checklist before you trust a window query:

1. Did the row count stay the same as the source table?
2. Does PARTITION BY match the level you want to compare within?
3. Is ORDER BY set when the question is about time or sequence?

A common mistake is filtering on a window result in the same WHERE clause. Window functions run after WHERE, so wrap the query in a subquery or CTE and filter the outer query instead.`,
      },
      {
        title: "Ranking and top-N per group",
        caption: "Use ROW_NUMBER with PARTITION BY to pick the best rows within each group.",
        body: `Ranking questions come up constantly in analytics: the best product per region, the most recent event per user, the top three campaigns per channel. Window functions solve these cleanly.

The standard pattern is:

    WITH ranked AS (
      SELECT
        region,
        product,
        revenue,
        ROW_NUMBER() OVER (PARTITION BY region ORDER BY revenue DESC) AS rn
      FROM product_sales
    )
    SELECT region, product, revenue
    FROM ranked
    WHERE rn <= 3;

ROW_NUMBER gives every row a unique position. If you want ties to share a rank, use RANK or DENSE_RANK instead. Pick deliberately, because the choice changes how many rows come back.

Two checks protect you from silent errors:

- Ask what should happen with ties and confirm the function matches.
- Make the ORDER BY deterministic, for example by adding a unique id as a tiebreaker, so reruns return the same rows.

When the answer looks surprising, select the ranked CTE without the filter and read a few partitions by hand. Seeing the numbers next to each other usually reveals the problem in a minute.`,
      },
      {
        title: "Running totals and lag comparisons",
        caption: "LAG and running sums express period-over-period questions in a single query.",
        body: `Many business questions compare a value with what came before: this month against last month, today's signups against the running total, the gap between two events. Window functions answer them without self-joins.

Compare with the previous period using LAG:

    SELECT
      month,
      revenue,
      LAG(revenue) OVER (ORDER BY month) AS prev_revenue,
      revenue - LAG(revenue) OVER (ORDER BY month) AS change
    FROM monthly_revenue;

The first row has no previous value, so LAG returns NULL there. Decide whether NULL means zero or unknown before you present the result.

For a cumulative view, use a running sum with an explicit frame:

    SUM(revenue) OVER (ORDER BY month ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)

Practical tips:

- Always set ORDER BY inside OVER for these calculations.
- Make sure the table has one row per period. Duplicate months will quietly distort the comparison.
- Check that the first and last totals match a simple sum, as a quick sanity test.

Once you are comfortable with these three ideas, most reporting questions become a matter of choosing the right partition and order.`,
      },
    ],
  },
  {
    id: "tr-experiment-design",
    kind: "skill",
    title: "Experiment design basics",
    summary: "Frame a clear hypothesis, pick one success metric and size the test so the result can actually change a decision.",
    minutes: 15,
    tags: ["experiments", "statistics", "product"],
    recommendedFor: ["ai-engineer", "data-analyst"],
    lessons: [
      {
        title: "Write a falsifiable hypothesis",
        caption: "State the change, the expected effect and the number that would prove you wrong.",
        body: `An experiment is only worth running if it could come out against your idea. A good hypothesis makes that possibility explicit.

Use this template:

"If we change [specific thing] for [specific group], then [metric] will [increase or decrease] by at least [amount] within [time period]."

For example: "If we show the summary before the full article for new readers, then the article completion rate will increase by at least three points within two weeks."

Each part earns its place:

- The specific change keeps the test from becoming a vague redesign.
- The group tells you who the result applies to.
- The metric and minimum effect tell you what counts as success.
- The time period stops you from declaring victory on a lucky first day.

Write the hypothesis down before any data comes in. If you wait until after the test, you will be tempted to describe whatever happened as the result you expected.

Ask one more question: what outcome would make us change nothing? If you cannot name one, the test cannot inform a decision, and it may not be worth the engineering time.`,
      },
      {
        title: "Choose one primary metric",
        caption: "Name a single decision metric and list guardrails separately so nothing is hidden.",
        body: `When an experiment reports fifteen metrics, one of them will look good by chance. Avoid that trap by declaring one primary metric before the test starts.

Structure the metrics in three tiers:

- **Primary**: the one number that decides whether the change ships.
- **Secondary**: supporting metrics that explain why the primary moved.
- **Guardrails**: things that must not get worse, such as error rate, page load time or refund requests.

Make the primary metric specific. "Engagement" is not a metric. "Share of new users who complete their first project within seven days" is.

Be careful with metrics that are hard to move or easy to game. A click count can rise because the design is confusing. Pair it with a measure of real value, such as task completion, to make sure the number means what you think.

If a guardrail drops, treat it as a stop signal even when the primary metric improved. Decide in advance what size of drop would block the launch, so you are not negotiating with yourself at the end.

Write the metric definitions in a shared document, including the exact event names and the time window. Two analysts using slightly different definitions will reach two different conclusions from the same data.`,
      },
      {
        title: "Size the test before you start",
        caption: "Decide the sample size and duration up front to avoid stopping early on a lucky result.",
        body: `Stopping an experiment the moment the chart looks good is one of the most common ways to fool yourself. Random variation produces streaks, and a streak can look like a win.

Before launch, estimate three things:

1. The baseline rate of your primary metric, such as twenty percent completion.
2. The smallest change worth detecting, such as two percentage points.
3. The traffic you can send to the test each day.

Those inputs give you a required sample size per group. A quick sample size calculator or a standard formula will do the job. Divide the required sample by daily traffic per group to get a minimum duration.

Round the duration up to full weeks. Weekday and weekend behaviour differ, and a test that runs Monday to Thursday only sees part of the story.

Agree on the stopping rule now. "We will read the result on the planned end date, and we will not peek and stop early" is a rule. "We will see how it goes" is not.

If the required sample is larger than you can collect, the honest answer is that the test is underpowered. Either widen the change so the effect is bigger, or accept that you cannot detect small improvements this quarter.`,
      },
    ],
  },
  {
    id: "tr-product-funnel",
    kind: "skill",
    title: "Reading a product funnel",
    summary: "Read conversion steps, find the step that loses the most people and separate real drop-off from measurement noise.",
    minutes: 14,
    tags: ["analytics", "product", "funnels"],
    recommendedFor: ["product-manager", "data-analyst"],
    lessons: [
      {
        title: "Define the steps precisely",
        caption: "A funnel is only as trustworthy as the event definitions behind each step.",
        body: `A funnel tracks how many people move from one step to the next: visit, sign up, create a project, invite a teammate, pay. Before you read any numbers, make sure every step means exactly one thing.

For each step, write down:

- The event name in the tracking code.
- The condition that counts as completing the step, such as "project saved with at least one task."
- The time window allowed between steps, such as "within seven days of signup."

Watch for the usual traps. If the sign-up event fires on button click instead of on successful account creation, the top of the funnel is inflated. If one step allows users to skip ahead, the percentages will look better than the reality.

Check that users are counted once. Use a stable user identifier rather than a browser cookie, because a person on a laptop and a phone is one user, not two.

Finally, confirm the funnel order matches how people really behave. A quick sample of ten session recordings or support tickets often reveals a step that users reach through an unexpected path.

A funnel built on loose definitions produces confident charts that mislead. Spending an hour on the definitions saves weeks of arguing about the results.`,
      },
      {
        title: "Find the biggest leak",
        caption: "Compare conversion between steps and count users lost, not just percentages.",
        body: `Once the steps are defined, the question is where the funnel leaks most. Percentages help, but absolute numbers decide where effort pays off.

Build a simple table:

    Step              Users    Conversion from previous
    Visit             10000    -
    Sign up            2400    24%
    Create project      960    40%
    Invite teammate     190    20%
    Pay                  38    20%

A 20 percent step after sign-up looks bad, but the invite step loses 770 users, more than any other step. Fixing that leak is worth more than a larger improvement at a step that only affects a few people.

Compare against your own history, not against a benchmark from another company. Ask whether the conversion dropped this month, and whether it dropped for everyone or only for new users.

Use the table to propose a hypothesis. "Invites drop because the invite form asks for a role before anyone has seen the product" is a testable idea. "Users are not engaged" is not.

Also check the time between steps. A step that converts well but takes three weeks is a different problem from one that converts poorly within a day.`,
      },
      {
        title: "Segment before you conclude",
        caption: "An average can hide a broken step for one device, region or cohort.",
        body: `A healthy overall funnel can still hide a serious problem. A checkout that works on desktop can be broken on Android, and the blended rate may barely move.

Segment the funnel along a few dimensions that matter to your product:

- Platform, such as web, iOS and Android.
- Acquisition channel, such as paid search, referral and organic.
- Cohort, meaning when the user signed up.
- Region or language, where the flow or content differs.

Look for segments where a step converts far below the rest. Then ask whether the difference is real. Small segments produce wild percentages, so check the count before you get excited. Twelve users converting at 50 percent is not the same evidence as twelve thousand.

Watch for mix shifts. If a campaign brings in many low-intent visitors this month, the overall conversion falls even though every segment performs the same. Compare like with like.

Before reporting a drop, rule out instrumentation changes. A new release that renames an event will look like a collapse in the funnel. Check the tracking log for the same date.

Good funnel analysis ends with a specific claim: which segment, which step, how many users, and what you recommend testing next.`,
      },
    ],
  },

  // ───────────────────────────── Mindset ─────────────────────────────
  {
    id: "tr-working-with-ambiguity",
    kind: "mindset",
    title: "Working with ambiguity",
    summary: "Make progress when the brief is vague by stating your assumptions, choosing a reversible next step and revisiting the plan as facts arrive.",
    minutes: 10,
    tags: ["mindset", "planning", "judgment"],
    recommendedFor: ["product-manager", "data-analyst"],
    lessons: [
      {
        title: "Name what you don't know",
        caption: "List the unknowns before you start so they become tasks instead of surprises.",
        body: `A vague brief is not a reason to wait. It is a list of questions you have not answered yet, and the first job is to write them down.

Try this in the first hour on any new project:

1. Write the goal in one sentence. If you cannot, that is your first unknown.
2. List everything you would need to know to start, in plain words.
3. Mark each item as "can answer myself", "need a person" or "need data".
4. Pick the two unknowns that would change the plan the most, and go after those first.

Unknowns are more manageable when they are visible. A list on the wall or in a shared doc turns a fog of worry into a short set of tasks, each with an owner.

Be specific about the question. "What do customers want?" is too broad. "Do enterprise customers need audit logs in the first release?" is a question someone can answer this week.

Share the list with your manager or sponsor. Their answers often reveal a constraint you did not know existed, and they will feel more confident that you are making progress rather than drifting.

The aim is not to remove all ambiguity. It is to know which ambiguity is worth resolving now and which can wait until you have more information.`,
      },
      {
        title: "Pick a reversible next step",
        caption: "Prefer small moves you can undo over big bets you cannot.",
        body: `When the path is unclear, the best next step is often the one that teaches you the most for the least cost. Reversible moves let you learn without locking in a wrong answer.

Compare two options:

- A large build that takes six weeks and is hard to change once customers depend on it.
- A prototype or manual process that takes two days and can be dropped tomorrow.

The second option usually wins while the problem is still fuzzy. It answers a real question, such as whether anyone wants the outcome at all, before you commit the budget.

Ask yourself three questions before choosing a step:

1. What would I learn from this, and would I act differently afterwards?
2. How hard is it to undo if I am wrong?
3. Who is affected if it fails, and how much?

Keep a clear line between reversible and irreversible decisions. Deleting data, announcing a date externally or signing a vendor contract need more care. Most internal experiments do not.

Announce the step as an experiment with a short review date. "We will test a manual version for two weeks and review on Friday" gives everyone a reason to engage and a clear point to change course.`,
      },
      {
        title: "Write down your assumptions",
        caption: "Assumptions are cheap to state and expensive to discover late in the project.",
        body: `Every plan rests on assumptions. The danger is not having them. The danger is having them silently, so nobody knows which beliefs to check when the project goes sideways.

Keep an assumptions log with four columns:

- The assumption, written as a plain statement, such as "Users will export data at least once a month."
- Why you believe it, whether that is a support ticket, a survey or a gut feeling.
- How you would test it, and how long that would take.
- The status: unverified, confirmed or disproved.

Review the log each week. Move items to confirmed as evidence arrives, and rewrite the plan wherever an assumption breaks. Gut feelings belong on the list too, marked as such, because they are often where the risks hide.

Be honest about the ones that matter most. An assumption that would sink the project if it were false deserves a test before anything else gets built. Ignore the low-stakes ones until later.

Sharing the log makes it a team tool. When a colleague says "I think users will do that," you can ask whether it is on the list and how to verify it. That conversation is faster and kinder than an argument after launch.`,
      },
    ],
  },
  {
    id: "tr-ownership-without-authority",
    kind: "mindset",
    title: "Ownership without authority",
    summary: "Drive outcomes across teams you do not manage by making the work visible, the asks concrete and the follow-through reliable.",
    minutes: 12,
    tags: ["mindset", "leadership", "influence"],
    recommendedFor: ["ai-engineer", "product-manager"],
    lessons: [
      {
        title: "Own the outcome, not the territory",
        caption: "Care about the result even when the fix sits in someone else's queue.",
        body: `Ownership is not about the org chart. It is about caring whether the thing you are responsible for actually works, even when the code or decision belongs to another team.

Consider a common case. Customers report that exports fail for large files. The export service belongs to the platform team, but the complaint lands in your feature. Ownership means you do not reply "not my area" and move on.

Instead, take three steps:

1. Reproduce the problem and write the smallest example that triggers it.
2. Find the people who own the broken piece, and confirm they know about it.
3. Offer what you can do to help, such as a test case, a log excerpt or a proposed fix.

Ownership also means checking the outcome at the end. When the fix ships, verify it with the original customers. Closing the ticket is not the same as solving the problem.

People notice who follows problems to the end. That reputation earns you the trust needed to lead work across teams later, which is what authority really rests on.

A simple self-test: when something in your area goes wrong, do you ask "whose problem is this?" or "how do we fix it?" The second question is ownership.`,
      },
      {
        title: "Make the ask concrete",
        caption: "Replace 'can someone look at this' with a named owner, a date and a reason.",
        body: `Vague requests get vague responses. "Can someone look at the dashboard?" is easy to ignore because nobody is named and nothing is due. A concrete ask is much harder to put off.

A strong ask includes four elements:

- **Who**: the named person, not the team inbox.
- **What**: the exact thing you need, such as "confirm whether the nightly job still reads the new column."
- **Why**: the impact in one sentence, such as "three customers are seeing stale totals."
- **When**: a specific date, and what happens if it slips.

Compare two messages. The first: "The totals look off, can someone check?" The second: "Sam, the nightly totals for the Maple Clinic account are off by about four percent since Tuesday. Could you confirm by Thursday whether the job still reads the new column? I'll pair with you if it helps."

The second message is kinder as well as clearer. It respects the other person's time and shows you have already done some of the thinking.

Offer a way out. Saying "if this is not a priority for your team, tell me and I will raise it with your manager" lets people decline honestly, which is better than a quiet ignore.`,
      },
      {
        title: "Follow through quietly",
        caption: "Track commitments in writing and close loops before anyone has to chase you.",
        body: `Influence without authority depends on reliability. When you say you will do something, people plan around it. When you forget, they lose trust, and they stop counting on you.

Use a simple system to keep commitments visible:

- Write every promise in one shared list, with the owner and the date.
- Review the list at the start of each day and pick the two items due soonest.
- When something slips, tell the affected person before the deadline, with a new date.

Closing loops matters as much as starting work. After a fix ships, send a short note to everyone who raised the issue: what changed, where to check, and what to report if it still fails. That note turns a private favour into a visible result.

Be careful with commitments you cannot keep. It is better to say "I can look at this next week, not this week" than to accept and let it slide. Honest limits build more trust than heroic over-promising.

Quiet follow-through is powerful because it removes the need for reminders. Over time, people start bringing you work because they know it will be finished.`,
      },
    ],
  },
  {
    id: "tr-asking-for-help-early",
    kind: "mindset",
    title: "Asking for help early",
    summary: "Raise blockers while they are still small, with enough context that the person helping can act quickly and the answer sticks.",
    minutes: 8,
    tags: ["mindset", "collaboration", "growth"],
    recommendedFor: ["ai-engineer", "data-analyst"],
    lessons: [
      {
        title: "Set a help threshold",
        caption: "Decide in advance how long you will stay stuck before you ask for a second pair of eyes.",
        body: `Many people wait too long before asking for help. They feel that struggling alone shows competence, and they lose a day or a week to a problem a colleague could solve in ten minutes.

Set a threshold before you start, so the decision is not left to pride in the moment. A common rule:

- Stuck on the same error or question for thirty minutes: search the docs and the team's notes.
- Still stuck after one more hour: ask a colleague, and say what you have tried.
- Blocked on a decision that affects others: raise it the same day.

The threshold depends on the task. A complex bug may justify a longer attempt, while a missing access permission should be raised immediately, because nobody can solve that for you by thinking harder.

Write the threshold on your plan. When the clock runs out, you have permission to ask, and you do not need to feel bad about it.

Remember that asking early is also a signal of good judgement. It tells your team that you know the difference between a problem you can solve and one that needs a second view.`,
      },
      {
        title: "Bring context, not just a question",
        caption: "Share what you tried, what you expected and what you actually saw.",
        body: `A question like "this is broken, any idea?" forces the helper to ask five follow-up questions before they can help. A message with context lets them start working straight away.

Include four things in every request:

1. The goal: what you are trying to achieve.
2. The exact symptom: the error message, the output or the screenshot.
3. What you have tried, and what happened each time.
4. The smallest example that reproduces the problem, if one exists.

Compare two messages. "The sync fails, what should I do?" versus "The sync job fails with a timeout after about 30 seconds when the file is over 50 MB. I tried raising the limit to 120 seconds with no change. Here is the log line and a sample file that fails." The second message can be answered in one reply.

Put the most important part first. Helpers read the top of a message and decide whether to engage.

Context also protects you from giving the same explanation twice. When you write it down clearly, you often solve the problem while writing, which happens more often than people expect.`,
      },
      {
        title: "Close the loop",
        caption: "Thank the helper, report the fix and write down the answer so the next person is faster.",
        body: `Asking for help is only half of the exchange. Closing the loop is what makes the next request easier, both for you and for everyone who helps you later.

When you get an answer that solves the problem:

- Thank the person specifically, such as "the tip about the connection pool fixed it."
- Confirm the fix in the original thread, so anyone reading later sees the outcome.
- If the answer was not obvious, write a short note in the team's notes or the ticket.

A short written note is an investment. Three sentences describing the symptom, the cause and the fix can save a colleague an afternoon next time. Over months, these notes become a searchable record of how your team solves problems.

Return the favour when you can. Keep an eye out for questions in the team channel that you can answer, and do it quickly. A culture where people help readily starts with people who notice when they have been helped.

Finally, reflect briefly. Ask what would have let you solve it sooner, such as a missing doc or an unclear error message, and fix that if it is in your power.`,
      },
    ],
  },
  {
    id: "tr-timeboxing",
    kind: "mindset",
    title: "Timeboxing",
    summary: "Cap how long a task can take, decide what you will do when the box runs out and protect the deadline without sacrificing quality.",
    minutes: 10,
    tags: ["mindset", "planning", "focus"],
    recommendedFor: ["product-manager", "data-analyst"],
    lessons: [
      {
        title: "Set the box before you start",
        caption: "Choose a fixed amount of time for a task and write it on the plan before you begin.",
        body: `Open-ended tasks expand to fill the time available. A research question with no limit can swallow a week, while a two-day box forces sharper choices about what matters.

Before you start any task that could drift, write three things on your plan:

- The question the task must answer, in one sentence.
- The time box, such as one day or three hours.
- The check-in time, when you will stop and review whether to continue.

Pick the box size from the stakes. A quick comparison of two dashboards might get two hours. A new metric definition that finance will rely on might get two days and a review. Smaller boxes are almost always better, because they force you to ship a useful partial answer rather than a perfect unfinished one.

Put the box on your calendar. A visible block of time signals to colleagues that you are heads-down, and it gives you a clear moment to stop.

Notice when you feel the urge to add "just one more thing." That feeling is the signal to write the extra idea on a separate list for later, and return to the box.`,
      },
      {
        title: "Decide what good enough means",
        caption: "Define the minimum acceptable output so the box has a clear finish line.",
        body: `A time box without a definition of done is just a deadline you will miss. Before the clock starts, describe the minimum output that would be useful to the person waiting for it.

Ask two questions:

1. What decision will this output support?
2. What is the least detail that lets that decision happen?

For example, a request to "analyse churn" might be useful as a single chart of monthly churn by plan, with three bullet points on likely causes. The full cohort model can come later if the chart shows a real problem.

Write the minimum as a short list. Include the format, the audience and the key content. This prevents both under-delivery, where the answer is too thin, and over-delivery, where you polish the wrong parts.

Agree the definition with the requester. A five-minute conversation saves hours of work that nobody needed. If they want more than the box allows, you can say so directly and offer a second box for the extra scope.

Good enough is not sloppy work. It is work that fits the decision it serves, delivered on time.`,
      },
      {
        title: "Review when the box ends",
        caption: "When time runs out, either ship, cut scope or extend the box with a stated reason.",
        body: `The end of a time box is a decision point, not a suggestion. Without a deliberate review, the default is to keep going and quietly miss everything else on your list.

When the box ends, choose one of three options:

- **Ship**: the output meets the minimum definition, so deliver it and note any open questions.
- **Cut scope**: the core is nearly there, so remove the nice-to-have parts and deliver the rest.
- **Extend**: you have found a real reason the task needs more time. Write the reason and a new end date, and tell the requester.

Extending should be the exception. Ask whether the extra time will change the decision the output supports. If it will not, ship what you have.

Keep the review short, about ten minutes. Read your output as the audience would, check it against the definition of done, and make the call.

Track how often your boxes end in extensions. If the pattern is constant, your estimates are too low, and that is useful information to share when you plan the next quarter.`,
      },
    ],
  },
  {
    id: "tr-learning-from-feedback",
    kind: "mindset",
    title: "Learning from feedback",
    summary: "Turn critique into specific changes by separating the message from the delivery and testing your next draft against it.",
    minutes: 11,
    tags: ["mindset", "growth", "feedback"],
    recommendedFor: ["ai-engineer", "data-analyst"],
    lessons: [
      {
        title: "Separate signal from tone",
        caption: "Find the underlying point even when the delivery is blunt or unfair.",
        body: `Feedback often arrives wrapped in frustration, rushed wording or a tone you dislike. The skill is to set the wrapping aside and find the underlying point, because that is what can make your work better.

When a comment stings, run a quick sort:

- What is the factual point? For example, "the chart axis is unlabelled."
- What is the behaviour I could change? For example, "label every axis before sharing."
- What is only tone? For example, "this is sloppy," which says more about the reviewer's mood than your work.

Keep the first two. Let the third go, or ask about it later in private if it keeps happening.

Give yourself a short pause before replying. Write your reaction in a notes file if it helps, then return to the factual content. You will learn more from a rough comment that holds a real point than from a polished one that holds none.

If you genuinely cannot find the point, ask a simple clarifying question such as "Which part of the analysis was unclear to you?" Questions keep the exchange open and usually reveal the signal.`,
      },
      {
        title: "Turn comments into specific changes",
        caption: "Rewrite each piece of feedback as an action you can check when the work is done.",
        body: `Feedback only helps when it becomes a change. "The summary is weak" is a feeling. "Lead the summary with the recommendation, then the two supporting numbers" is an action.

For each comment you receive, write a line in this format:

    Feedback: [what they said]
    Change: [what I will do differently]
    Check: [how I will know it worked]

Here is an example:

    Feedback: The model is hard to follow.
    Change: Add a one-page overview and name each sheet by its purpose.
    Check: A colleague who has not seen it can explain the result back to me in two minutes.

Group related comments together. Five notes about unclear labels usually point to one habit you can fix in one pass.

Prioritise. Not every comment deserves an immediate change. Pick the two with the highest impact on the reader, make those changes well, and note the rest for next time.

Finally, look for patterns across projects. If the same type of comment appears in three reviews, you have found a skill to build, and a training or a practice habit will help more than another fix to a single file.`,
      },
      {
        title: "Ask for a second look",
        caption: "Show the revised work to the same reviewer and ask specifically what changed.",
        body: `Acting on feedback is only part of the loop. The other part is checking whether your change landed, and the fastest way to do that is to ask the person who gave the feedback.

When you send a revised version, include a short note:

- What you changed, mapped to each comment.
- Anything you chose not to change, and why.
- One specific question, such as "Is the recommendation clear on the first page now?"

Keep the request small. A reviewer who is asked to read everything again may skim. A reviewer who is asked about one thing will give you a precise answer.

Pay attention to what they do not mention. If they move straight to new points, the earlier issues are probably resolved. If they reopen an old point, the change did not go far enough, and you have learned something important.

Over time, ask for feedback earlier, before the work is polished. A rough draft review costs the reviewer less time and gives you more room to change direction. Both of you benefit when the feedback arrives before the expensive part of the work.`,
      },
    ],
  },
  {
    id: "tr-bias-for-shipping",
    kind: "mindset",
    title: "Bias for shipping",
    summary: "Get working output in front of real users early, learn from actual use and resist polishing work nobody has asked for yet.",
    minutes: 9,
    tags: ["mindset", "delivery", "iteration"],
    recommendedFor: ["ai-engineer", "product-manager"],
    lessons: [
      {
        title: "Ship the smallest useful slice",
        caption: "Cut the scope until the first version can answer one real question.",
        body: `Most features take longer than planned because the first version tries to do everything. A bias for shipping means asking what the smallest useful slice looks like, then building only that.

Use a simple method to find it:

1. List every capability the full feature would need.
2. Mark the one or two that answer the core question for the user.
3. Build those, and defer everything else to a later release.

Consider a feature that suggests replies to support tickets. The full version might cover tone, language, policies and integrations. The useful slice might be a single suggested reply, shown to agents who can edit it, with no automatic sending. That slice tests whether the suggestions help at all.

A small release also makes problems cheaper. If it fails, you have lost days rather than months, and the lesson is clear.

Be honest about what the slice cannot do. Tell users and stakeholders what is missing and when it will arrive. Transparency keeps trust even when the first version is modest.`,
      },
      {
        title: "Define done before you start",
        caption: "Write the done criteria so shipping becomes a decision rather than a feeling.",
        body: `Work rarely feels finished. Without clear criteria, you will keep polishing, adding edge cases and reworking details until the moment for release has passed.

Write done criteria before you build. Keep them short and testable:

- The primary user can complete the main task without help.
- The result is correct for the three most common inputs.
- Errors show a clear message rather than a blank screen.
- Someone other than the author has tried it.

Each criterion should be something you can check in under ten minutes. "The experience is delightful" is not testable. "A new user finishes setup in under five minutes in a usability check" is.

When every criterion passes, ship. Resist the urge to add one more improvement first. The remaining ideas go on a list, ranked, for the next release.

Done criteria also protect you from pressure in the other direction. When someone asks for a new requirement at the last minute, you can say "that is not in the done criteria, so it goes in the next release unless it blocks the main task."

Shipping is a decision you make on purpose. Writing the criteria turns it into one.`,
      },
      {
        title: "Learn from the release",
        caption: "Watch how people actually use the release and let that evidence decide the next step.",
        body: `Shipping is the start of learning, not the end of a project. The real product only reveals itself when people use it on their own terms.

After release, set up a short learning routine:

- Check the key usage numbers daily for the first week, including errors and drop-off points.
- Read a handful of user comments, support tickets or session notes, and note surprising behaviour.
- Schedule a fifteen-minute review at the end of the week to decide what to change next.

Separate the evidence from your interpretation. "Forty percent of users stopped at step two" is evidence. "They did not understand the form" is a hypothesis to test with a small change.

Be willing to be wrong. A release that disappoints is useful, because it tells you where your assumptions were off. The worst outcome is a long project that ships to silence and gets quietly abandoned.

Close each cycle by writing down what you learned. A short note in the team log turns a release into knowledge that shapes the next one.`,
      },
    ],
  },

  // ───────────────────────────── Communication ─────────────────────────────
  {
    id: "tr-status-updates",
    kind: "communication",
    title: "Status updates that land",
    summary: "Write short updates that state progress, risk and the decision you need, so readers can act without scheduling a meeting.",
    minutes: 9,
    tags: ["communication", "writing", "stakeholders"],
    recommendedFor: ["ai-engineer", "product-manager"],
    lessons: [
      {
        title: "Lead with the state",
        caption: "Open every update with one sentence on where the work stands right now.",
        body: `Most status updates bury the point. They open with a list of activities, and the reader has to work out whether things are on track. Lead with the state instead.

Use a three-line opening:

- **Status**: on track, at risk or blocked.
- **Progress**: what moved since the last update, in one clause.
- **Next**: the main thing happening before the next update.

For example: "On track. The retrieval prototype now answers forty of fifty test questions correctly. Next, we are running the full evaluation set on Thursday."

Readers should be able to stop after the first line and still know whether they need to worry. Everything below that line is detail for those who want it.

Keep the cadence predictable. A short update every Friday trains people to look for it, and an update that appears only when something goes wrong teaches them to dread your messages.

Avoid vague colour words such as "good progress" or "mostly done." Replace them with a number, a date or a named milestone. Specifics are what make an update trustworthy.`,
      },
      {
        title: "Surface risks with a next step",
        caption: "Name the risk, its impact and what you are doing about it in the same message.",
        body: `A risk you hide until it becomes an issue costs far more than one you raise early. The trick is to raise risks in a way that invites help rather than alarm.

Every risk needs four parts:

1. What could happen, in plain words.
2. The impact on the goal, such as a delayed date or a lower quality bar.
3. The likelihood, roughly: low, medium or high.
4. The mitigation you are doing now, and what you need from anyone else.

Compare two versions. "Some concerns about the data pipeline." versus "Risk: the vendor data feed may arrive two days late next week (medium likelihood). Impact: the dashboard launch moves from Monday to Wednesday. Mitigation: I have a cached copy from last month for testing, and I have asked the vendor for a firm date by Tuesday."

The second version tells the reader exactly what to do, if anything. It also shows you are already on it, which keeps the conversation calm.

When a risk turns into an issue, say so the same day. Update the message, state the new date and explain what changed. Reporting the change quickly is more important than having predicted it perfectly.`,
      },
      {
        title: "Ask for the decision",
        caption: "End with the specific decision or help you need, and the date by which you need it.",
        body: `The most useful sentence in a status update is often the last one: the explicit request. Without it, readers finish the update, agree it sounds fine and move on, and your blocker sits unresolved.

Close each update with an ask when you need one:

- **Decision needed**: the choice, the options and your recommendation.
- **Help needed**: the specific person, the specific task and the deadline.
- **Nothing needed**: say so, which also helps readers relax.

A good ask reads like this: "Decision needed by Thursday: do we ship the English version first, or wait for all three languages? I recommend English first, because it unblocks the sales pilot two weeks sooner."

Notice the structure. There is one decision, a recommendation and a deadline. Readers can answer in a single word.

If nobody responds by the date you gave, follow up directly, in a short message that restates the question. Silence is usually a sign that the request was unclear, not that the answer is no.`,
      },
    ],
  },
  {
    id: "tr-demoing-in-five-minutes",
    kind: "communication",
    title: "Demoing in five minutes",
    summary: "Show a working result in a tight five-minute demo that frames the problem, walks one real path and ends on a clear outcome.",
    minutes: 12,
    tags: ["communication", "demo", "presentation"],
    recommendedFor: ["ai-engineer", "data-analyst"],
    lessons: [
      {
        title: "Frame the problem in thirty seconds",
        caption: "Start with who is affected and what changed for them, before you open anything.",
        body: `Audiences decide in the first thirty seconds whether a demo is worth their attention. Use that time to explain why the work matters, not how it was built.

A strong opening has three sentences:

- Who has the problem: "Support agents spend about twenty minutes finding the right policy for each refund."
- What changed: "This prototype finds the policy and drafts the reply in under ten seconds."
- What you will show: "I will walk through one real refund request from start to finish."

Avoid opening with architecture, tool names or a list of features. Those details can wait for questions. The room needs the reason first.

Keep the framing concrete. A real customer situation, an actual number or a quote from a user does more work than any slide. If you have a baseline measure, put it on screen during the opening so the improvement is obvious later.

Practise the opening out loud until it takes less than thirty seconds. If you stumble through the framing, the rest of the demo will feel rushed, and listeners will lose the thread.`,
      },
      {
        title: "Show one real path",
        caption: "Walk through a single realistic input rather than trying to show every feature.",
        body: `The temptation in a demo is to show everything. Resist it. Five minutes allows one complete path, and a complete path is far more convincing than a tour of disconnected features.

Choose the path carefully:

- Pick a realistic input that the audience will recognise, not a cherry-picked perfect case.
- Include one moment where the system does something useful that a person could not do quickly.
- Avoid the feature you know is fragile. If you must show it, prepare a recording as backup.

Narrate as you go, in short sentences. "I am pasting the ticket. The system pulls the three matching policies. Here is the draft reply, and this highlighted line is the refund limit." The narration keeps people oriented without requiring them to read the screen.

Rehearse the path twice before the meeting, with a timer. Time is the constraint that matters most in a five-minute slot, and rehearsal reveals which steps can be shortened.

Have a fallback ready. If the live system fails, a screenshot sequence lets you finish the story. A demo that recovers gracefully often lands better than a flawless one.`,
      },
      {
        title: "End with the result and the ask",
        caption: "Close with the measured outcome and what you want the audience to do next.",
        body: `The last thirty seconds of a demo are what people remember and repeat. End on a result you can measure, followed by a clear request.

Structure the close like this:

1. The result: "In the test group of two hundred tickets, median handling time dropped from eighteen minutes to seven."
2. The caveat: "Accuracy on refund amounts is still ninety-one percent, so agents review every draft for now."
3. The ask: "I would like two agents to try it on live tickets next week. Can you help me find them?"

Keep the ask specific and small. "Give us feedback" is hard to act on. "Two agents, five tickets each, by Friday" is easy to say yes to.

Leave time for questions by planning the demo for three and a half minutes, with a buffer. Questions reveal what the audience cares about, which tells you what to follow up on.

After the meeting, send the recording and the three-line summary the same day. A demo that people can revisit does more for the project than one that only lives in memory.`,
      },
    ],
  },
  {
    id: "tr-one-page-prd",
    kind: "communication",
    title: "Writing a one-page PRD",
    summary: "Write a product requirements document short enough to read in one sitting and specific enough for a team to build from.",
    minutes: 16,
    tags: ["communication", "product", "writing"],
    recommendedFor: ["product-manager", "data-analyst"],
    lessons: [
      {
        title: "Problem and audience first",
        caption: "Describe the user problem and who has it before proposing any solution.",
        body: `A requirements document that starts with a solution invites argument about the solution. Start with the problem, so the team agrees on what matters before debating how to address it.

The first section needs three short parts:

- **Problem**: the situation in two or three sentences, written from the user's point of view.
- **Audience**: who has this problem, how often, and how much it costs them today.
- **Evidence**: the observations behind the claim, such as support tickets, interviews or usage data.

For example: "Small clinic managers reschedule about forty appointments a week by phone. Each call takes four minutes, and two of the last five support tickets mention missed slots."

Avoid words like "users want" without a source. If the evidence is thin, say so and list it as a risk. Honest uncertainty is more useful than confident guessing.

Keep this section to one short screen. If you cannot explain the problem briefly, the team will not be able to judge whether a proposed solution fits it.`,
      },
      {
        title: "Goals, non-goals and metrics",
        caption: "Say what success looks like and what you are deliberately not doing in this release.",
        body: `Goals tell the team what success looks like. Non-goals tell them what you are choosing not to do. Both are essential, and most documents include only the first.

Write goals as outcomes with numbers:

- Reduce average rescheduling time from four minutes to under one minute for the pilot clinics.
- Keep the no-show rate at or below its current level, so the change does not hurt patients.

Then write two or three non-goals:

- Not building patient self-service in this release.
- Not integrating with the second scheduling system until the pilot ends.

Non-goals are where scope arguments get settled. When someone asks for a feature late in the project, the answer is already on the page.

Attach one primary metric and two guardrails, as you would for an experiment. Make each one measurable with a named data source. "Satisfaction improves" needs a survey, a sample size and a date to be a real metric.

Review the goals with the engineering and design leads before you go further. Disagreement at this stage is cheap, and it is much more expensive after the work has started.`,
      },
      {
        title: "Requirements and open questions",
        caption: "List testable requirements and flag what is still unknown so nobody assumes it.",
        body: `The requirements section turns goals into the things the team will build. Each requirement should be specific enough that someone can test whether it has been met.

Write each one as a short statement with an identifier:

- R1: Staff can move an appointment to a new slot in three taps or fewer.
- R2: The system warns before double-booking a clinician.
- R3: Every change is logged with the user, time and reason.

Mark priorities with a simple label, such as must, should or could. This lets the team cut scope confidently when time runs short.

Then list the open questions. Give each one an owner and a date by which it must be answered. Examples include "Do clinics need approval for weekend slots?" with an owner in operations and a date before design starts.

An open question is not a failure. It is an honest marker of what you still need to learn. Hiding it means the team will make the decision by accident, usually in the middle of a sprint.

Finish with a short revision note at the top of the page: the date, the version and what changed. Readers should always know whether they are looking at the current document.`,
      },
    ],
  },
  {
    id: "tr-explaining-tradeoffs",
    kind: "communication",
    title: "Explaining tradeoffs",
    summary: "Lay out two or three options with their costs, risks and reversibility so a decision-maker can choose with confidence.",
    minutes: 13,
    tags: ["communication", "decisions", "engineering"],
    recommendedFor: ["ai-engineer", "product-manager"],
    lessons: [
      {
        title: "Name the options honestly",
        caption: "Give each option a fair description, including the one you personally dislike.",
        body: `A tradeoff discussion fails the moment one option is presented as a straw man. Decision-makers notice, and they stop trusting the analysis. Describe every option as its best supporter would.

Start by listing the realistic choices, usually two or three. Include the status quo when it is a real option, because doing nothing has costs too.

For each one, write a short paragraph covering:

- What it is, in one sentence.
- The strongest argument for it.
- The strongest argument against it.

Example: "Option A: fine-tune a smaller model on our support data. For: lower cost per request and tighter control over tone. Against: six weeks of labelling work and a retraining step every time the policy changes."

Ask a colleague who prefers a different option to review your description. If they say you have made their choice sound weak, rewrite it until they agree it is fair.

When you are fair to the options you reject, you earn the right to recommend the one you prefer. People trust a recommendation that shows its alternatives have been taken seriously.`,
      },
      {
        title: "Compare on the same axes",
        caption: "Use the same criteria for every option, such as cost, speed, risk and reversibility.",
        body: `Options are hard to compare when each is described in its own terms. Pick a fixed set of criteria and score every option against all of them. The table becomes the anchor of the discussion.

A useful set of criteria for technical and product choices:

- Cost: build and run, in money and in time.
- Speed: how soon users see the benefit.
- Quality: the expected outcome on the main measure.
- Risk: what could go wrong and how badly.
- Reversibility: how hard it is to change course later.

A compact comparison looks like this:

    Criterion        Option A        Option B        Option C
    Cost             Low             High            Medium
    Speed            Two weeks       Two months      One month
    Quality          Good            Very good       Good
    Risk             Low             Medium          Medium
    Reversibility    High            Low             High

Use words that a non-specialist can read. Replace jargon with plain descriptions, and define any term the audience may not know.

Do not hide a weak score. If one option is clearly slower, say so in the table. The point is an honest comparison, not a flattering one.`,
      },
      {
        title: "Recommend and state what would change your mind",
        caption: "Pick a default and name the new fact that would flip the decision.",
        body: `After the options are fair and comparable, make a recommendation. Decision-makers want your judgement, not only a neutral menu. Give them a clear default, with the reasons.

Structure the recommendation in three lines:

- "I recommend Option A."
- "Because it delivers the core benefit within two weeks and keeps our future options open."
- "I would change this if we learn that customers need tone control that only Option B can provide."

The last line is the most valuable part. It shows the decision-maker exactly which fact matters, and it gives the team a way to revisit the choice without reopening everything.

Be explicit about what you do not know. If the recommendation depends on a cost estimate that could be off by half, say so, and offer a way to firm it up quickly.

Finally, agree on when the decision will be reviewed. A date such as "we will check the result after the first month of use" turns a one-time choice into a managed bet. People accept decisions more readily when they know they will be revisited on evidence.`,
      },
    ],
  },
  {
    id: "tr-presenting-data-to-executives",
    kind: "communication",
    title: "Presenting data to executives",
    summary: "Turn an analysis into a short story with one headline number, one clear chart and one recommendation the executive can act on.",
    minutes: 17,
    tags: ["communication", "data", "executives"],
    recommendedFor: ["product-manager", "data-analyst"],
    lessons: [
      {
        title: "Lead with the answer",
        caption: "Put the conclusion in the first sentence, then support it with evidence.",
        body: `Executives have little time and many decisions in flight. They want the answer first, then enough evidence to trust it, then the detail only if they ask. Build your presentation in that order.

Write the headline before you build any slides. Complete this sentence in one line: "The data shows that [finding], so we should [action]."

For example: "The data shows that trial users who invite a teammate in week one are three times more likely to pay, so we should move the invite prompt to the first screen."

If you cannot write that sentence, the analysis is not finished. Keep working until you can state a finding and a recommended action clearly.

Once the headline is set, add two or three supporting points. Each should be a number with context: the size of the effect, the confidence in it and the population it applies to.

Resist the urge to walk the audience through your process. They do not need to see every query. They need to know what you found, how sure you are and what you suggest.`,
      },
      {
        title: "One chart per point",
        caption: "Choose the simplest chart that shows the comparison without decoration.",
        body: `A chart should make one comparison obvious in a few seconds. When a slide carries three charts and a table, the audience has to do the analysis themselves, and most of them will not.

Match the chart to the question:

- Change over time: a line chart with a clear starting point.
- Comparison between groups: a bar chart sorted from highest to lowest.
- Share of a whole: a single stacked bar, and only with two or three parts.

Remove everything that does not help. Drop gridlines you do not need, remove legends when you can label the lines directly, and use one accent colour to highlight the number you are discussing.

Give the chart a title that states the finding, not the topic. "Invites drive conversion" is better than "Conversion by step." The title should carry the message even if the audience glances away.

Label the key value directly on the chart. Executives often read the headline number first and the axis second, so make sure the number is impossible to miss.`,
      },
      {
        title: "Anticipate the question",
        caption: "Prepare for the first challenge, such as sample size, definitions or time period.",
        body: `Experienced executives push on the weakest part of an analysis within the first minute of questions. Find that weakness yourself before the meeting, and prepare a clear answer.

Walk through the usual challenges:

- How big is the sample, and is the difference bigger than normal variation?
- How is the key metric defined, and did the definition change during the period?
- Why this time window, and would a different one change the answer?
- Are there other explanations, such as a seasonal effect or a marketing campaign?

Prepare a one-line answer for each, plus a backup slide if the question needs more detail. Keep the backup in an appendix so it does not clutter the main story.

When you do not know the answer, say so and commit to a date. "I have not checked the effect of the pricing change yet. I will report back by Friday" builds more credibility than a guess.

Finish by restating the recommendation and the one thing that would change it. A short close keeps the discussion focused on the decision rather than on the methods.`,
      },
    ],
  },
  {
    id: "tr-running-a-kickoff",
    kind: "communication",
    title: "Running a kickoff meeting",
    summary: "Start a project with a short meeting that aligns goal, scope, owners and the first milestone so work begins cleanly.",
    minutes: 11,
    tags: ["communication", "meetings", "facilitation"],
    recommendedFor: ["ai-engineer", "data-analyst"],
    lessons: [
      {
        title: "Set the purpose in the first minute",
        caption: "Open with the goal and the decision the meeting must reach before anything else.",
        body: `A kickoff meeting is expensive. Five people for an hour is five hours of attention, so the purpose needs to be clear before the first slide appears.

Open with three sentences:

- The goal: "We are building a first version of the refund assistant for the support team."
- The decision: "By the end of this hour, we need agreement on scope, owners and the first milestone."
- The format: "I will talk for five minutes, then we will work through three questions together."

Share the agenda in the calendar invite as well, so people arrive knowing what to expect. Attendees who understand the purpose contribute more and wander less.

Invite only the people who must decide or deliver. Observers can receive the written summary afterwards. A smaller room makes it easier to reach agreement.

Start on time, and end on time. Starting late tells people the meeting is optional, and it trains them to arrive late next time.`,
      },
      {
        title: "Agree on scope and owners",
        caption: "Write down what is in, what is out and who owns each piece of the work.",
        body: `Most project confusion comes from unspoken assumptions about scope and ownership. A kickoff is the moment to surface them, while changing course is still cheap.

Work through two lists on a shared screen:

- **In scope**: the three to five capabilities the first release must include.
- **Out of scope**: the things people might expect but you are deliberately not doing yet.

Then assign an owner to every item. Ownership means one named person who answers questions and makes the call when the team is stuck. A group owner is no owner at all.

Ask the room directly: "What is missing from this list?" Give people a moment to think, and then wait. The silence feels awkward, but it is where the important concerns usually surface.

When someone raises a new request, place it on a parking list rather than adding it to scope on the spot. Say when the parking list will be reviewed. This keeps the meeting moving without dismissing the idea.

End this section by reading the final lists back aloud. Hearing them once more catches misunderstandings before they become tickets.`,
      },
      {
        title: "Close with the first milestone",
        caption: "End with a dated next step and a written summary sent the same day.",
        body: `A kickoff that ends in general agreement but no next step will drift. The final ten minutes should produce a concrete milestone and a date that everyone can see.

Choose the first milestone carefully. It should be something the team can finish in one or two weeks and that proves the approach works. Examples include a working prototype on real data, a completed interview round or a test environment that runs end to end.

Confirm three things before people leave:

1. The milestone, stated in one sentence with its date.
2. The owner of each task needed to reach it.
3. The next meeting, if one is needed, and its purpose.

Then send a written summary the same day. Keep it under one page: the goal, the in-scope and out-of-scope lists, the owners, the milestone and the open questions with their owners and dates.

Thank the group for their time and specific input. Naming one useful contribution reinforces the behaviour you want in later meetings.

A clear kickoff is a short meeting followed by a clear summary. The summary is what people will refer to when the project gets busy.`,
      },
    ],
  },
];
