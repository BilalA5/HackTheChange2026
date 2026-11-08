import type { CareerPack } from "../types.ts";

const pack: CareerPack = {
  career: {
    id: "ai-engineer",
    title: "AI Engineer",
    tagline: "Ship LLM features that hold up in production",
    description:
      "AI Engineers turn language models into dependable product features. You will connect models to real tools and data, decide when a system should act and when it should hand off to a person, and prove with measurements that a change made things better rather than quieter. The work sits between product, data and platform teams, so clear writing and sound judgment matter as much as code.",
    skills: [
      "LLM application design",
      "Retrieval-augmented generation",
      "Agent tool use and routing",
      "Structured output and prompt design",
      "LLM evaluation and rubrics",
      "Guardrails and privacy checks",
      "Python and API integration",
      "Production monitoring",
    ],
    color: "#7B6CF6",
  },

  companies: [
    {
      id: "kettle-commerce",
      name: "Kettle Commerce",
      industry: "E-commerce marketplace",
      tagline: "Everything small merchants need, one checkout away",
      color: "#E4572E",
      glyph: "KC",
      building: "tower",
    },
    {
      id: "maplewood-toys",
      name: "Maplewood Toy Works",
      industry: "Toys and children's products",
      tagline: "Build-it-yourself toys with manuals families actually read",
      color: "#2A9D8F",
      glyph: "MT",
      building: "campus",
    },
    {
      id: "larkspur-travel",
      name: "Larkspur Travel",
      industry: "Online travel booking",
      tagline: "Plan the trip, we will handle the details",
      color: "#1D3557",
      glyph: "LT",
      building: "spire",
    },
  ],

  npcs: [
    {
      id: "npc-ines-okafor",
      name: "Ines Okafor",
      role: "Staff ML Engineer",
      companyId: "kettle-commerce",
      personality:
        "Ines is direct, warm and a little impatient with vague plans. She talks in short, numbered points, asks for concrete numbers, and she always wants to know what happens when the model is wrong. She cares most about merchants never losing money because of an automated mistake.",
      voice: { rate: 1.02, pitch: 1.05, style: "feminine" },
      avatarSeed: "ines-okafor-kc",
    },
    {
      id: "npc-tomas-lindqvist",
      name: "Tomas Lindqvist",
      role: "Principal Applied Scientist",
      companyId: "maplewood-toys",
      personality:
        "Tomas speaks slowly and precisely, and he likes to ask why before he asks how. He pushes back gently on any answer that is not backed by a page number or a measurement. He cares about children's safety above all, and he would rather see a refusal than a confident guess.",
      voice: { rate: 0.94, pitch: 0.9, style: "masculine" },
      avatarSeed: "tomas-lindqvist-mt",
    },
    {
      id: "npc-dana-whitfield",
      name: "Dana Whitfield",
      role: "Engineering Manager, Trust and Quality",
      companyId: "larkspur-travel",
      personality:
        "Dana is upbeat, quick and fond of analogies, but she gets very focused when money or personal data is involved. She asks for thresholds and gate definitions, and she wants your reasoning more than your tooling. She cares that every prompt change is measured before it reaches a traveler.",
      voice: { rate: 1.07, pitch: 1.12, style: "feminine" },
      avatarSeed: "dana-whitfield-lt",
    },
  ],

  scenarios: [
    // ───────────────────────── Scenario 1: ticket triage (beginner) ─────────────────────────
    {
      id: "ai-eng-ticket-triage",
      careerId: "ai-engineer",
      companyId: "kettle-commerce",
      npcId: "npc-ines-okafor",
      order: 1,
      title: "Ship a Ticket-Routing Agent for Kettle Commerce",
      coverWord: "ROUTE TICKETS",
      problemStatement:
        "Kettle Commerce receives about 40,000 merchant support tickets a week. Tier one agents tag each ticket by hand and forward it to a specialist queue, so the median first response is 19 hours. Build an agent that routes every ticket to the right queue, resolves the safe, routine cases with tools, and hands risky cases such as bank detail changes or fraud signals to a human with a clear summary.",
      userRole: "AI engineer on the Merchant Support Platform team",
      projectType: "Triage agent with tool calls, a policy gate and human handoff",
      difficulty: "beginner",
      estMinutes: 150,
      maxXp: 1300,
      tools: ["Python 3.12", "Orders API sandbox", "Postgres", "An LLM API with function calling", "pytest", "GitHub Actions"],
      workflows: [
        "Classify and route each incoming ticket to one of six queues",
        "Call read-only and low-risk tools to resolve safe categories",
        "Pass every tool call through a deterministic policy gate",
        "Hand risky tickets to a human queue with a structured summary",
      ],
      skills: ["Agent design", "Routing and classification", "Tool calling", "Policy and guardrails", "Evaluation", "Technical writing"],
      deliverables: [
        {
          title: "Triage agent repository",
          description: "Router, tools, policy gate and handoff code, plus an eval script and a README with routing accuracy and auto-resolve results.",
          kind: "github",
        },
        {
          title: "Six-minute demo recording",
          description: "Screen recording that shows one auto-resolved ticket, one handoff and the eval table on screen.",
          kind: "recording",
        },
      ],
      kickoff: {
        segments: [
          {
            id: "ai-eng-ticket-triage-k1",
            title: "The problem",
            noteSection: "problem",
            slides: [
              {
                heading: "Merchants wait too long for a reply",
                bullets: [
                  "About 40,000 merchant tickets arrive every week",
                  "Every ticket lands in one shared queue and gets tagged by hand",
                ],
                visual: "metric",
                metric: { label: "Median first response", value: "19 hours" },
              },
              {
                heading: "Routing is the bottleneck",
                bullets: [
                  "Tier one agents read, tag and forward before any real work starts",
                  "Specialists often receive tickets that belong somewhere else",
                ],
                visual: "flow",
                flow: ["Ticket arrives", "Tier one reads it", "Tag and forward", "Specialist replies", "Merchant waits"],
              },
              {
                heading: "Most tickets are routine",
                bullets: [
                  "Routine questions could be answered in seconds with the right tools",
                  "Risky tickets must never be resolved automatically",
                ],
                visual: "chart",
                chart: [
                  { label: "Payouts", value: 31 },
                  { label: "Shipping labels", value: 18 },
                  { label: "Tax forms", value: 13 },
                  { label: "Account access", value: 22 },
                  { label: "Other", value: 16 },
                ],
              },
            ],
            transcript:
              "Thanks for jumping on. Here is the problem. Merchants on the Kettle marketplace open about 40,000 support tickets a week, and right now every one of them lands in a shared queue. Tier one agents read each ticket, tag it by hand, and forward it to a specialist team. The median first response is 19 hours, and merchants notice. Most of what comes in is routine: payout timing, shipping label reprints, tax form lookups. Those should take seconds, not a day. But some tickets are risky. A payout hold tied to a fraud signal, or a request to change bank details, must never be resolved automatically. So the issue is not that we lack people. We route badly, and we resolve nothing automatically. Keep that in mind as you write your note.",
            rubricPoints: [
              "Names the 19-hour median first response and the 40,000 weekly volume",
              "Explains that routine ticket types can be resolved automatically",
              "States that risky cases such as bank detail changes must go to a human",
              "Identifies manual tagging and forwarding as the bottleneck",
            ],
            checkpointPrompt: "In your own words, write the core problem and the two kinds of tickets the system must treat differently.",
          },
          {
            id: "ai-eng-ticket-triage-k2",
            title: "The outcome",
            noteSection: "outcome",
            slides: [
              {
                heading: "Auto-resolve the safe half",
                bullets: [
                  "Target: resolve about 45 percent of volume automatically",
                  "Resolution must land within five minutes of the ticket arriving",
                ],
                visual: "metric",
                metric: { label: "Auto-resolve target", value: "45 percent" },
              },
              {
                heading: "Zero wrong money moves",
                bullets: [
                  "A single wrong payout action is a release blocker",
                  "The agent may only read payout data in this release",
                ],
                visual: "quote",
                quote: {
                  text: "If the agent ever moves money on a guess, we switch it off that afternoon.",
                  author: "Ines Okafor, Staff ML Engineer",
                },
              },
              {
                heading: "Handoffs a human can act on",
                bullets: [
                  "Routing accuracy of at least 90 percent on a 300-ticket labeled set",
                  "Every handoff summary lets a specialist act in under a minute",
                ],
              },
            ],
            transcript:
              "Here is what success looks like for the first release. We want the router to send each ticket to the right queue at least 90 percent of the time, measured against a labeled set of 300 past tickets I will give you. For the safe categories, payout timing, label reprints, and tax form lookups, the agent should resolve about 45 percent of volume on its own within five minutes. Zero wrong payout actions. That number is not negotiable. For everything else, the handoff matters as much as the routing. A specialist should be able to read the summary and act in under a minute, without reopening the merchant's whole history. Write the outcome in your note as measurable targets, and tell me what you would measure first.",
            rubricPoints: [
              "States a routing accuracy target of 90 percent on the labeled set",
              "Gives an auto-resolve target of about 45 percent for safe categories",
              "Treats zero wrong payout actions as a hard constraint",
              "Describes handoff summaries that let a human act in under a minute",
            ],
            checkpointPrompt: "Write the outcome as two or three measurable targets, including the one that cannot fail.",
          },
          {
            id: "ai-eng-ticket-triage-k3",
            title: "The process",
            noteSection: "process",
            slides: [
              {
                heading: "Five steps per ticket",
                bullets: [
                  "Each ticket moves through the same path, whether it is routine or risky",
                ],
                visual: "flow",
                flow: ["Classify intent", "Route to queue", "Call safe tools", "Check policy gate", "Resolve or hand off"],
              },
              {
                heading: "Build order matters",
                bullets: [
                  "Start with the labeled set and the scorer, then the router",
                  "Add tools only after routing beats the keyword baseline",
                ],
                visual: "chart",
                chart: [
                  { label: "Labeled eval set", value: 20 },
                  { label: "Router", value: 30 },
                  { label: "Tools and policy gate", value: 30 },
                  { label: "Handoff summaries", value: 20 },
                ],
              },
              {
                heading: "Sandbox first",
                bullets: [
                  "Use the orders API sandbox, never production data",
                  "Log every tool call with the gate decision that allowed it",
                ],
              },
            ],
            transcript:
              "Here is how I would approach it. Start with the labeled set. Pull the 300 tickets, and write a small scoring script that reports routing accuracy before you touch a prompt. Then build the router, a classifier that picks one of six queues. Next, give the agent three tools: look up order status, reissue a shipping label, and fetch a payout schedule. Those are read-only or low risk. Every tool call passes through a policy gate that checks the merchant tier and the ticket category. Anything involving money movement or account ownership goes to a human with a summary. Use the sandbox, not production. Your note should describe the order of work and where the gate sits, because that is where I will push back.",
            rubricPoints: [
              "Builds the eval harness before the router",
              "Describes a six-queue router with a small set of tools",
              "Places a deterministic policy gate in front of every tool call",
              "Routes risky categories to a human with a summary",
            ],
            checkpointPrompt: "Describe the build order and where the policy gate sits in the flow.",
          },
        ],
      },
      pou: [
        {
          id: "ai-eng-ticket-triage-q1",
          prompt:
            "Tell me what the router has to get right and what it must never do. Walk me through it like you are briefing a new hire.",
          rubricPoints: [
            "Names routing accuracy as the main measure",
            "States clearly that money movement is never resolved automatically",
            "Mentions the handoff path for risky tickets",
          ],
          followUp: "What happens to a ticket the router is unsure about?",
        },
        {
          id: "ai-eng-ticket-triage-q2",
          prompt: "Why build the labeled evaluation set before the agent itself?",
          rubricPoints: [
            "Gives a baseline before any prompt changes",
            "Makes regressions visible when the prompt changes",
            "A holdout set guards against tuning to the dev examples",
          ],
          followUp: "How would you know a prompt change made routing worse?",
        },
        {
          id: "ai-eng-ticket-triage-q3",
          prompt:
            "A merchant asks the chat agent to change their bank details. What does the system do, step by step?",
          rubricPoints: [
            "Routes the request to a human and does not execute the change",
            "Explains that bank detail changes are a high-risk action",
            "Mentions the structured summary handed to the specialist",
          ],
          followUp: "What should the merchant see while they wait?",
        },
      ],
      stages: [
        {
          id: "ai-eng-ticket-triage-s1",
          order: 1,
          title: "Build the eval set and ticket router",
          summary: "Create a labeled ticket set, a scoring script and a six-queue router that beats a keyword baseline.",
          estMinutes: 35,
          kind: "work",
          requirements: [
            "Labeled set of at least 300 tickets, split into a 200-ticket dev set and a 100-ticket holdout",
            "Scoring script reports routing accuracy per queue, not only overall",
            "Router assigns one of six queues: payouts, shipping, tax, account access, fraud review, general",
            "Keyword baseline and router accuracy both recorded in the README before any prompt tuning",
          ],
          planOpener:
            "Morning. Before we touch the agent, let's agree on scope for the eval set. I want 300 labeled tickets with a holdout of 100, and I want you to own the six queue definitions. Does that match how you would start, or would you cut anything?",
          learn: [
            {
              id: "ai-eng-ticket-triage-s1-l1",
              title: "Build the eval before the router",
              minutes: 5,
              body: `A router is only as good as the tickets you test it on. Before you write a prompt, build a labeled set and a scorer, so every later change has a number attached.

**Labeled set.** Export 300 past tickets with the queue a senior agent finally used. Split them into a dev set of 200 for tuning and a holdout of 100 that you look at only before a release. Store them as JSONL so diffs stay readable:

\`\`\`json
{"id": "t-10482", "text": "My payout went out two days late, why?", "queue": "payouts", "risk": "low"}
\`\`\`

**Scorer.** Report accuracy per queue, not just overall. A router that scores 92 percent overall but misses 40 percent of fraud reviews is dangerous, and a single average hides that.

**Baseline first.** Record the score of the simplest version, such as keyword rules, in the README. If your LLM router cannot beat keywords, the problem is usually the queue definitions, not the model.

**Confusion matrix.** Count which queues get mixed up. Payout timing and tax form questions often collide, and that tells you where the definitions need sharper wording.

Freeze the labels once you start tuning. Changing a label to match a prediction is the fastest way to fool yourself.`,
              check: {
                question: "Why keep a holdout set that you do not tune against?",
                options: [
                  "To make the final demo look better",
                  "To measure generalization without tuning to the answers",
                  "To reduce the token cost of each model call",
                  "To replace the labeled dev set entirely",
                ],
                answerIndex: 1,
                explanation: "The holdout is the honest estimate of how the router will do on tickets it has never seen.",
              },
            },
          ],
          submission: {
            kinds: ["github", "text"],
            instructions:
              "Push the eval script, the labeled set and the router to your repository. In the text box, paste the README table with keyword baseline and router accuracy per queue.",
          },
          rubricHints: {
            understanding: "Meeting expectations means you can explain why the holdout exists and why the baseline comes first.",
            quality: "Meeting expectations means the eval script runs from one command and the labeled set is versioned and readable.",
            communication: "Meeting expectations means the README states the accuracy per queue in a table a manager can scan in a minute.",
            independence: "Meeting expectations means you defined the queues yourself and raised questions only where the scope was unclear.",
          },
          xp: 150,
        },
        {
          id: "ai-eng-ticket-triage-s2",
          order: 2,
          title: "Add safe tools and the policy gate",
          summary: "Give the agent three low-risk tools and put a deterministic gate in front of every call.",
          estMinutes: 40,
          kind: "work",
          requirements: [
            "Three tools: order status lookup, shipping label reissue and payout schedule fetch",
            "Policy gate in code blocks any tool call outside the category allowlist",
            "Auto-resolve only for payout timing, label reprints and tax form lookups",
            "Tool failures return a structured error the agent reports to the merchant, not an exception",
          ],
          planOpener:
            "Good, the router is in. Now the agent gets hands. I want three tools, and I want the gate written as plain code so nobody has to trust a prompt. Which tool would you build first, and what would you do if the reissue call times out?",
          learn: [
            {
              id: "ai-eng-ticket-triage-s2-l1",
              title: "Tool calls behind a policy gate",
              minutes: 5,
              body: `The model proposes an action. Your code decides whether that action runs. Keep that split clear, and you can reason about safety without reading every prompt.

**Allowlist by category.** Each ticket category maps to the tools it may use. Anything outside the list is refused in code:

\`\`\`python
ALLOWED = {
    "payouts": {"get_payout_schedule"},
    "shipping": {"get_order_status", "reissue_label"},
    "tax": {"get_tax_form_status"},
}

def gate(category: str, tool: str, merchant: Merchant) -> bool:
    if tool not in ALLOWED.get(category, set()):
        return False
    if tool == "reissue_label" and merchant.tier == "suspended":
        return False
    return True
\`\`\`

**Structured failures.** When a tool times out or returns an error, send the model a small JSON object such as \`{"ok": false, "error": "timeout", "retryable": true}\`. The agent can then tell the merchant the truth instead of guessing.

**Log the decision.** Record the tool name, the arguments, the gate result and the reason. When a merchant disputes an action, this log is your evidence.

**Test the gate directly.** Write unit tests that call \`gate\` with blocked combinations. These tests do not need a model, and they run in milliseconds on every pull request.`,
              check: {
                question: "Where should the decision to allow a tool call live?",
                options: [
                  "Inside the system prompt, so the model decides",
                  "In deterministic code between the model and the tool",
                  "Only in the user interface",
                  "In the logs, reviewed once a week",
                ],
                answerIndex: 1,
                explanation: "A prompt can be talked around, but code between the model and the tool is predictable and testable.",
              },
            },
          ],
          submission: {
            kinds: ["github", "url"],
            instructions:
              "Share the repository link and a link to a sandbox run log showing one allowed and one blocked tool call. The gate tests must pass in CI.",
          },
          rubricHints: {
            understanding: "Meeting expectations means you can explain why the gate is code rather than prompt text.",
            quality: "Meeting expectations means the gate has unit tests for blocked combinations and tool errors return structured results.",
            communication: "Meeting expectations means your run log makes it obvious which call was allowed, blocked and why.",
            independence: "Meeting expectations means you chose the tool set and handled the timeout case without being told how.",
          },
          xp: 180,
        },
        {
          id: "ai-eng-ticket-triage-s3",
          order: 3,
          title: "Hand off risky tickets with summaries",
          summary: "Send bank changes, payout holds and fraud signals to a human queue with a summary a specialist can act on.",
          estMinutes: 35,
          kind: "work",
          requirements: [
            "Handoff triggered for any bank detail change, payout hold or fraud signal",
            "Summary of at most 120 words covering merchant ID, history, what was tried and a suggested next step",
            "Human queue simulated by a stub that records each handoff with its summary",
            "Unit tests cover at least five risky ticket examples and assert a handoff occurs",
          ],
          planOpener:
            "Now the part I care about most. Risky tickets need to reach a person with enough context that they never have to start over. Propose the fields your summary will have. How will you prove a bank change never gets resolved by the agent?",
          learn: [
            {
              id: "ai-eng-ticket-triage-s3-l1",
              title: "Handing off risky tickets well",
              minutes: 4,
              body: `A handoff is a product feature, not an error path. The specialist who receives it should be able to act within a minute, without asking the merchant to repeat themselves.

**Fixed fields.** Every summary uses the same schema, so specialists build a reading habit:

\`\`\`json
{
  "merchant_id": "m-88213",
  "queue": "fraud_review",
  "reason": "Bank detail change requested through chat",
  "history": ["3 payouts in the last 30 days", "Password reset two days ago"],
  "attempted": ["Read payout schedule (no changes made)"],
  "suggested_next_step": "Verify identity by phone before any change"
}
\`\`\`

**Facts, not feelings.** Write what happened and what the system saw. Avoid speculation such as "the merchant seems upset".

**Say what was not done.** The "attempted" field should make clear that no money moved and no account changed. That single line saves a specialist from checking the logs.

**Length.** Keep the total under 120 words. Longer summaries get skimmed, and skimmed summaries hide the one fact that matters.

**Trigger in code.** The handoff rule should be a function over the ticket category and the signals, so it is testable. Do not rely on the model choosing to escalate.`,
              check: {
                question: "Which ticket type must always go to a human rather than being resolved automatically?",
                options: [
                  "A shipping label reprint",
                  "A bank detail change",
                  "A tax form lookup",
                  "An order status question",
                ],
                answerIndex: 1,
                explanation: "Changing bank details moves money to a new destination, so it is high risk and always needs a person.",
              },
            },
          ],
          submission: {
            kinds: ["github", "text"],
            instructions:
              "Share the repository link and paste three example handoff summaries in the text box, one each for a bank change, a payout hold and a fraud signal.",
          },
          rubricHints: {
            understanding: "Meeting expectations means you can name every trigger for a handoff and explain why the trigger lives in code.",
            quality: "Meeting expectations means summaries follow the fixed schema, stay under 120 words and the tests assert the handoff.",
            communication: "Meeting expectations means a specialist could act on each summary in under a minute without extra questions.",
            independence: "Meeting expectations means you designed the summary fields and the stub queue without a checklist from the manager.",
          },
          xp: 200,
        },
        {
          id: "ai-eng-ticket-triage-s4",
          order: 4,
          title: "Present the triage agent to Ines",
          summary: "Demo one auto-resolved ticket and one handoff, then defend your numbers and your gate.",
          estMinutes: 30,
          kind: "presentation",
          requirements: [
            "Recorded demo of six minutes or less showing one auto-resolved ticket and one handoff",
            "Results table: routing accuracy, auto-resolve rate and count of wrong payout actions",
            "Name two failure modes you saw and what you would build next",
            "Answer Ines's questions about the policy gate live",
          ],
          planOpener:
            "Let's plan the walkthrough. Lead with the numbers, then show one ticket the agent resolved and one it handed off. I want to hear your two worst failure modes before I ask about them. What will you put on screen first?",
          learn: [
            {
              id: "ai-eng-ticket-triage-s4-l1",
              title: "Presenting results to a manager",
              minutes: 3,
              body: `Ines will decide whether this system goes live. Make that decision easy by putting the answer first and the evidence right after it.

**Open with the result.** Say the routing accuracy, the auto-resolve rate and the number of wrong payout actions in the first thirty seconds. Ines will ask about the gate later, but she wants the numbers first.

**Show one of each.** Demonstrate one ticket the agent resolved from start to finish, then one handoff and its summary. Pause on the summary and read it aloud. That shows the specialist experience, which is the part she cares about.

**Name your failures.** Choose the two worst cases from your holdout. For each, say what went wrong, how often it happened and what you would change. A presenter who names failures is trusted more than one who hides them.

**Defend the gate.** Be ready to explain every allowed tool and every blocked case. If you cannot say why a tool is allowed, it probably should not be.

**Stay inside six minutes.** Cut setup and background. The recording is a demo, not a tour of the repository.`,
              check: {
                question: "What should open a short demo to a manager who will decide whether to ship?",
                options: [
                  "The history of the project",
                  "The repository folder structure",
                  "The key results with their numbers",
                  "A list of tools installed on your laptop",
                ],
                answerIndex: 2,
                explanation: "Decision makers want the outcome first, with the evidence that supports it.",
              },
            },
          ],
          submission: {
            kinds: ["recording"],
            instructions:
              "Record a screen walkthrough of six minutes or less. Show the eval table, one auto-resolved ticket and one handoff summary, and mention your two worst failure modes.",
          },
          rubricHints: {
            understanding: "Meeting expectations means you explain how the router, gate and handoff fit together without reading from notes.",
            quality: "Meeting expectations means the demo runs on the sandbox and the numbers on screen match the README.",
            communication: "Meeting expectations means the presentation leads with results, names failure modes and stays within six minutes.",
            independence: "Meeting expectations means you answer Ines's questions with reasoning you own rather than deferring to the manager.",
          },
          xp: 220,
        },
      ],
      map: { x: 18, y: 34 },
    },

    // ───────────────────────── Scenario 2: manual RAG (intermediate) ─────────────────────────
    {
      id: "ai-eng-manual-rag",
      careerId: "ai-engineer",
      companyId: "maplewood-toys",
      npcId: "npc-tomas-lindqvist",
      order: 2,
      title: "Build a Cited Assistant for Maplewood Toy Works",
      coverWord: "CITE MANUALS",
      problemStatement:
        "Maplewood Toy Works has about 2,300 pages of product manuals and safety bulletins across 140 products. Parents and retail support staff ask questions about battery charging, age grading and assembly, and last quarter a sampled audit found that 7 percent of the current chatbot's replies stated a specification that appears in no manual. Build a retrieval-augmented assistant that answers only from the documents, cites the exact page for every factual claim and refuses questions the documents do not cover.",
      userRole: "AI engineer on the Customer Knowledge team",
      projectType: "Retrieval-augmented assistant with citations and refusals",
      difficulty: "intermediate",
      estMinutes: 170,
      maxXp: 1400,
      tools: ["Python 3.12", "Postgres with pgvector", "PDF text extraction library", "An LLM API", "An embedding model API", "pytest"],
      workflows: [
        "Parse and chunk manuals while keeping warning boxes intact",
        "Retrieve, rerank and ground each answer in the retrieved passages",
        "Check every cited claim against its passage before replying",
        "Refuse out-of-scope questions and route injury questions to a human",
      ],
      skills: ["Retrieval-augmented generation", "Chunking strategy", "Citation design", "Refusal policy", "Evaluation", "Safety communication"],
      deliverables: [
        {
          title: "Cited assistant repository",
          description: "Ingestion pipeline, retrieval code, citation check and refusal rules, with an evaluation report on the 200-question set.",
          kind: "github",
        },
        {
          title: "Demo recording",
          description: "Screen recording that shows one cited answer, one refusal and one injury handoff.",
          kind: "recording",
        },
      ],
      kickoff: {
        segments: [
          {
            id: "ai-eng-manual-rag-k1",
            title: "The problem",
            noteSection: "problem",
            slides: [
              {
                heading: "Confident answers that are wrong",
                bullets: [
                  "Sampled audit found replies that cite specifications absent from every manual",
                  "Some of those errors concern battery charging and age grading",
                ],
                visual: "metric",
                metric: { label: "Replies with unsupported specs", value: "7 percent" },
              },
              {
                heading: "A safety problem, not a tone problem",
                bullets: [
                  "A wrong charging instruction can damage a device or start a fire",
                  "Support staff repeat whatever the bot says to parents",
                ],
                visual: "quote",
                quote: {
                  text: "We told a parent the wrong battery spec, and nobody caught it for a week.",
                  author: "Hana Brandt, Consumer Support Lead",
                },
              },
              {
                heading: "Where the questions come from",
                bullets: [
                  "Battery and charging questions lead the queue",
                  "Age grading and assembly follow closely behind",
                ],
                visual: "chart",
                chart: [
                  { label: "Battery and charging", value: 34 },
                  { label: "Assembly", value: 27 },
                  { label: "Age grading", value: 21 },
                  { label: "Returns", value: 18 },
                ],
              },
            ],
            transcript:
              "Let me give you the situation. We ship about 140 product manuals and 38 safety bulletins, roughly 2,300 pages in total. Parents and retail support staff ask questions every day about battery charging, age grading, small parts, and assembly. Last quarter, a sample audit found that 7 percent of replies from our current chatbot stated a specification that did not appear in any manual. That is a safety problem, not a tone problem. A wrong charging instruction can damage a device or hurt a child. The product team wants answers that cite the exact page they came from, and a clear refusal when the manuals do not cover the question. Your job is to build that pipeline. Before you write code, describe in your note what can go wrong and why it matters.",
            rubricPoints: [
              "Quantifies the 7 percent unsupported-answer rate from the audit",
              "Explains why an invented safety specification is a serious risk",
              "States the need for page-level citations",
              "Mentions refusal when the manuals do not cover a question",
            ],
            checkpointPrompt: "Write the core problem and the specific failure you are designing against.",
          },
          {
            id: "ai-eng-manual-rag-k2",
            title: "The outcome",
            noteSection: "outcome",
            slides: [
              {
                heading: "Citations that check out",
                bullets: [
                  "Every factual answer names the document and page it came from",
                  "A hand-checked sample confirms the cited page supports the claim",
                ],
                visual: "metric",
                metric: { label: "Cited pages that support the claim", value: "95 percent" },
              },
              {
                heading: "Show me the page, or do not answer",
                bullets: [
                  "Refuse when the corpus does not cover the question",
                  "Send anything involving possible injury to a human agent",
                ],
                visual: "quote",
                quote: {
                  text: "Show me the page, or do not answer.",
                  author: "Tomas Lindqvist, Principal Applied Scientist",
                },
              },
              {
                heading: "Do not overcorrect into silence",
                bullets: [
                  "Refusal rate on in-scope questions must stay under 5 percent",
                  "A timid assistant is as useless to support staff as a confident wrong one",
                ],
              },
            ],
            transcript:
              "Here is what done looks like. First, every factual answer includes at least one citation to a manual or bulletin, with the document name and page number. We check that automatically, and we want 95 percent of cited pages to actually contain the claimed fact on a hand-checked set of 200 questions. Second, the assistant refuses questions the corpus does not answer, and sends anything involving a possible injury to a human agent. Third, the refusal rate on in-scope questions should stay under 5 percent, because a timid assistant is useless to staff. Our old bot was too confident. We do not want to swing into silence. In your note, put numbers on all three.",
            rubricPoints: [
              "Requires a citation with document name and page on every factual answer",
              "Sets a 95 percent cited-page accuracy target on the 200-question set",
              "Requires refusal when the corpus does not cover the question",
              "Keeps the in-scope refusal rate under 5 percent",
            ],
            checkpointPrompt: "Write three measurable outcomes and say which one you would trade off last.",
          },
          {
            id: "ai-eng-manual-rag-k3",
            title: "The process",
            noteSection: "process",
            slides: [
              {
                heading: "Five stages, one path",
                bullets: [
                  "Every question moves through the same pipeline and is checked before it is answered",
                ],
                visual: "flow",
                flow: ["Parse and chunk", "Embed and index", "Retrieve top passages", "Ground the answer", "Cite or refuse"],
              },
              {
                heading: "Where the effort goes",
                bullets: [
                  "Retrieval tuning takes the largest share of the build",
                  "Chunking and metadata decide how well everything else works",
                ],
                visual: "chart",
                chart: [
                  { label: "Chunking and metadata", value: 25 },
                  { label: "Retrieval tuning", value: 30 },
                  { label: "Citation check", value: 25 },
                  { label: "Refusal policy", value: 20 },
                ],
              },
              {
                heading: "Record your choices",
                bullets: [
                  "Note chunk size, top-k values and the refusal rule in the write-up",
                  "Explain each choice with a measurement, not a guess",
                ],
              },
            ],
            transcript:
              "Here is the process I would like you to follow. Start with chunking. Manuals have tables, warning boxes, and diagrams, so split on section headings, keep each warning box whole, and store the document name, revision date, and page number as metadata. Then embed the chunks and index them in Postgres with pgvector, so we can filter by product line and revision. For retrieval, pull the top eight passages, rerank them, and pass only the best four to the model. Ground the answer strictly in those passages. The citation check runs after generation. If a claimed fact does not appear in a cited passage, the answer gets rewritten or refused. Document your chunk size, your top-k choices, and the refusal rule, because I will ask about them.",
            rubricPoints: [
              "Chunking respects headings and warning boxes and stores metadata",
              "Retrieval is followed by reranking and a grounded prompt",
              "A citation check runs after generation and before the reply",
              "States an explicit refusal rule for out-of-scope questions",
            ],
            checkpointPrompt: "Describe how a question moves through the pipeline and where a bad answer gets caught.",
          },
        ],
      },
      pou: [
        {
          id: "ai-eng-manual-rag-q1",
          prompt:
            "A parent asks how to charge the Harbor Bot's battery. What should the assistant reply, and what does the reply need to show?",
          rubricPoints: [
            "The answer comes from a retrieved manual passage",
            "The reply includes a citation with document name and page",
            "Warnings in the passage are kept in the answer",
          ],
          followUp: "What if the manual has two revisions with different charging times?",
        },
        {
          id: "ai-eng-manual-rag-q2",
          prompt: "Why do you keep warning boxes as whole chunks instead of splitting them with the surrounding text?",
          rubricPoints: [
            "Preserves the complete safety instruction",
            "Stops a warning from being separated from its context",
            "Keeps the citation pointing at the right page",
          ],
          followUp: "What trade-off does a larger chunk size introduce?",
        },
        {
          id: "ai-eng-manual-rag-q3",
          prompt:
            "A user asks whether the Harbor Bot is safe for a three-year-old, and the manuals say nothing about that age. What happens?",
          rubricPoints: [
            "The assistant refuses or says the documents do not cover it",
            "No age grading is guessed or inferred",
            "The reply points to the age grading page or a human agent",
          ],
          followUp: "How do you measure whether the refusal rule is too strict?",
        },
      ],
      stages: [
        {
          id: "ai-eng-manual-rag-s1",
          order: 1,
          title: "Chunk and index the manuals",
          summary: "Turn 140 manuals and 38 bulletins into searchable chunks that keep warnings whole and carry citation metadata.",
          estMinutes: 40,
          kind: "work",
          requirements: [
            "Parse at least 140 manuals and 38 bulletins without dropping tables or warning boxes",
            "Chunks split on section headings, with warning boxes kept as single chunks",
            "Each chunk stores document name, revision, page number and product line",
            "Embeddings stored in Postgres with pgvector and filterable by product line",
          ],
          planOpener:
            "Let's start with the corpus, because everything downstream depends on it. I want every warning box intact and every chunk traceable to a page. What chunk size are you planning to start with, and how will you test that the tables survived extraction?",
          learn: [
            {
              id: "ai-eng-manual-rag-s1-l1",
              title: "Chunking manuals without breaking warnings",
              minutes: 5,
              body: `Manuals are not plain prose. They contain numbered steps, tables, diagrams with captions, and warning boxes. A chunker that ignores that structure will return fragments that look right and mean the wrong thing.

**Split on structure first.** Use section headings as the outer boundary. Only split inside a section when it is longer than the token limit.

**Keep warnings whole.** A warning box is a single unit. If its text is separated from the step it protects, a retrieved passage can read as harmless. Mark those boxes during extraction and never split them:

\`\`\`python
def chunk_manual(pages, max_tokens=450):
    for section in split_on_headings(pages):
        if section.has_warning_box:
            yield Chunk(text=section.text, keep_whole=True, meta=section.meta)
            continue
        yield from split_by_tokens(section.text, max_tokens, overlap=50)
\`\`\`

**Carry metadata.** Each chunk stores the document name, revision date, page number and product line. Without the page number you cannot cite, and without the revision you cannot tell two charging instructions apart.

**Check extraction.** Pick ten pages with tables and read the extracted text yourself. Tables that flatten into one line of numbers will mislead the model.

Keep the chunk size as a named setting. You will tune it later, and you want that change to be one line in one file.`,
              check: {
                question: "Why should a warning box stay as one chunk?",
                options: [
                  "It makes the embedding file smaller",
                  "Splitting it can separate the warning from the step it protects",
                  "Warnings are never retrieved by the search index",
                  "It removes the need for page metadata",
                ],
                answerIndex: 1,
                explanation: "A warning split from its context can be retrieved and presented as if it were harmless.",
              },
            },
          ],
          submission: {
            kinds: ["github", "text"],
            instructions:
              "Share the repository link. In the text box, paste the extraction check you ran on ten table-heavy pages and the chunk count per product line.",
          },
          rubricHints: {
            understanding: "Meeting expectations means you can explain why warning boxes and metadata matter for citations.",
            quality: "Meeting expectations means the ingestion runs from one command, and extraction was checked on table-heavy pages.",
            communication: "Meeting expectations means your write-up states the chunk size and metadata fields clearly enough for another engineer to reuse them.",
            independence: "Meeting expectations means you made the chunking decisions and verified them yourself before asking for review.",
          },
          xp: 170,
        },
        {
          id: "ai-eng-manual-rag-s2",
          order: 2,
          title: "Retrieve with page-level citations",
          summary: "Build top-k retrieval with reranking and a response schema where every claim carries a page reference.",
          estMinutes: 40,
          kind: "work",
          requirements: [
            "Top-k retrieval followed by a reranker, passing at most four passages to the model",
            "Answers cite document name and page for each factual claim",
            "Response schema includes answer, citations and a confidence field",
            "Retrieval recall reported on the 200-question set",
          ],
          planOpener:
            "The corpus is indexed. Now I want answers that point to a page, and I want to see recall before I see any prose. How many passages will you retrieve, and how will you decide which four reach the model?",
          learn: [
            {
              id: "ai-eng-manual-rag-s2-l1",
              title: "Citations you can verify",
              minutes: 5,
              body: `A citation is a promise that a support agent can check. If the page does not say what the answer says, the citation makes the error look trustworthy, which is worse than having no citation at all.

**Ground the prompt.** Give the model only the passages you retrieved, each with an ID. Instruct it to answer from those passages alone and to cite passage IDs, not memory.

**Use a fixed response schema.** Structured output lets your code check the answer before any person sees it:

\`\`\`json
{
  "answer": "Charge the Harbor Bot for 3 hours using the included cable.",
  "citations": [{"doc": "Harbor Bot Manual rev C", "page": 14, "passage_id": "p-0391"}],
  "confidence": "high"
}
\`\`\`

**Retrieve, then rerank.** Pull eight passages with vector search, then rerank them and keep four. Vector search finds topical matches; the reranker finds the passage that actually answers the question.

**Measure recall.** For each question in your labeled set, check whether the correct page appears in the top eight. If recall is low, no prompt will rescue the answer.

**Prefer the newest revision.** When two revisions disagree, filter to the current revision by default and say which revision you used in the citation.`,
              check: {
                question: "What does a citation promise a support agent?",
                options: [
                  "That the model was trained on the manual",
                  "That the cited page supports the stated claim",
                  "That the answer was approved by a lawyer",
                  "That the question was asked before",
                ],
                answerIndex: 1,
                explanation: "A citation is only useful if the agent can open the page and find the claim there.",
              },
            },
          ],
          submission: {
            kinds: ["github", "url"],
            instructions:
              "Share the repository link and a link to the evaluation report showing recall at eight and citation accuracy on the 200-question set.",
          },
          rubricHints: {
            understanding: "Meeting expectations means you can explain why retrieval recall is measured before answer quality.",
            quality: "Meeting expectations means the response schema is validated in code and citations always include document, revision and page.",
            communication: "Meeting expectations means the evaluation report shows recall and citation accuracy in a clear table.",
            independence: "Meeting expectations means you chose the top-k and rerank settings and justified them with your own measurements.",
          },
          xp: 200,
        },
        {
          id: "ai-eng-manual-rag-s3",
          order: 3,
          title: "Refuse out-of-scope and unsafe questions",
          summary: "Add a citation check that rejects unsupported claims, plus refusal and injury handoff paths.",
          estMinutes: 40,
          kind: "work",
          requirements: [
            "Citation check rejects any claim not found in the text of the cited passage",
            "Out-of-scope questions get a refusal with a suggested next step",
            "Questions about possible injury route to a human agent with a standard handoff message",
            "In-scope refusal rate measured on the 200-question set and reported, target under 5 percent",
          ],
          planOpener:
            "This is where we earn trust. The assistant has to say no sometimes, and it has to be right about when. How does your citation check decide a claim is unsupported, and what does the injury handoff say to a parent?",
          learn: [
            {
              id: "ai-eng-manual-rag-s3-l1",
              title: "Refusing well",
              minutes: 5,
              body: `A good refusal is specific. It says what the documents do not cover, and it points the person to the next useful step. A vague refusal frustrates a parent and teaches support staff to ignore the bot.

**Check every claim after generation.** Split the answer into claims. For each claim, confirm that the cited passage contains the supporting text. A simple version uses normalized string matching for numbers and units, and a model-based check for paraphrase:

\`\`\`python
def citation_check(answer, passages):
    for claim in split_claims(answer.answer):
        cited = passages[claim.passage_id]
        if not supports(claim.text, cited.text):
            return Refuse(reason="unsupported_claim", claim=claim.text)
    return Allow(answer)
\`\`\`

**Separate two refusals.** "Not covered by the manuals" is one case. "Possible injury" is another. The second one must always go to a human, with the standard handoff message, even when the documents do mention the product.

**Measure the cost of refusing.** Track how often in-scope questions are refused. If that rate passes 5 percent, your threshold or your retrieval is too strict, and the fix is not to remove the check.

**Write the refusal text once.** Keep the wording in a single template so tone stays consistent and can be reviewed by the product team.`,
              check: {
                question: "What should happen to a question about a possible injury, even if the manual mentions the product?",
                options: [
                  "The assistant answers from the manual with a citation",
                  "The assistant routes it to a human agent with a standard handoff message",
                  "The assistant guesses the safest answer",
                  "The assistant ignores the question",
                ],
                answerIndex: 1,
                explanation: "Injury questions carry too much risk for an automated answer, so they always go to a person.",
              },
            },
          ],
          submission: {
            kinds: ["github", "text"],
            instructions:
              "Share the repository link. In the text box, paste the refusal rate on in-scope questions and three example refusals, one each for out of scope, unsupported claim and injury.",
          },
          rubricHints: {
            understanding: "Meeting expectations means you can distinguish an uncovered question from an injury question and explain why they route differently.",
            quality: "Meeting expectations means the citation check is tested with supported and unsupported examples and refusal text comes from one template.",
            communication: "Meeting expectations means refusals name what is missing and give a clear next step a parent or staff member can follow.",
            independence: "Meeting expectations means you set the citation check threshold and refusal rules yourself and reported their trade-offs.",
          },
          xp: 220,
        },
        {
          id: "ai-eng-manual-rag-s4",
          order: 4,
          title: "Present the assistant to Tomas",
          summary: "Demonstrate a cited answer, a refusal and an injury handoff, then defend your measurements.",
          estMinutes: 35,
          kind: "presentation",
          requirements: [
            "Recorded demo of seven minutes or less covering one cited answer, one refusal and one injury handoff",
            "Results: cited-page accuracy, retrieval recall at eight and in-scope refusal rate",
            "Explain your chunk size and top-k choices and the measurements behind them",
            "Answer Tomas's questions about the citation check live",
          ],
          planOpener:
            "Let's plan the walkthrough. I want to see a cited answer first, then a refusal, then the injury handoff. Which of your three numbers are you least sure about? That is where I will look.",
          learn: [
            {
              id: "ai-eng-manual-rag-s4-l1",
              title: "Demoing a grounded assistant",
              minutes: 3,
              body: `A grounded assistant is hard to demo well, because the most important behavior is what it refuses to say. Plan the demo around that.

**Lead with a cited answer.** Pick a question a parent would really ask. Show the answer, the citation and the page, then open the page on screen so the audience can confirm the claim.

**Show a refusal on purpose.** Ask about a product age range the manuals do not cover. Show the refusal text and the suggested next step. Explain why the assistant did not guess.

**Show the injury path.** Ask a question that mentions a possible injury. Show the handoff message and the record that a human will see.

**Bring three numbers.** Cited-page accuracy, recall at eight and in-scope refusal rate. For each, say how you measured it and how many questions were in the sample.

**Be honest about the gap.** If citation accuracy sits at 91 percent against a 95 percent target, say so, and say what you would change first. Tomas trusts a presenter who knows where the system is weak.`,
              check: {
                question: "Which demo choice best shows that the assistant is trustworthy?",
                options: [
                  "Showing only questions it answers perfectly",
                  "Showing a deliberate refusal and opening the cited page",
                  "Hiding the citation to keep the answer short",
                  "Skipping the injury case because it is rare",
                ],
                answerIndex: 1,
                explanation: "A deliberate refusal and a checkable citation show the system knows its limits and can be verified.",
              },
            },
          ],
          submission: {
            kinds: ["recording"],
            instructions:
              "Record a screen walkthrough of seven minutes or less. Show one cited answer with its source page, one refusal and one injury handoff, then state your three numbers.",
          },
          rubricHints: {
            understanding: "Meeting expectations means you explain how retrieval, the citation check and refusals work together without reading from notes.",
            quality: "Meeting expectations means the demo runs against the real index and the numbers on screen match your evaluation report.",
            communication: "Meeting expectations means the presentation leads with a verifiable answer and names where the system is still weak.",
            independence: "Meeting expectations means you answer Tomas's questions with your own reasoning about thresholds and trade-offs.",
          },
          xp: 260,
        },
      ],
      map: { x: 40, y: 26 },
    },

    // ───────────────────────── Scenario 3: booking evals (advanced) ─────────────────────────
    {
      id: "ai-eng-booking-evals",
      careerId: "ai-engineer",
      companyId: "larkspur-travel",
      npcId: "npc-dana-whitfield",
      order: 3,
      title: "Gate Every Change to the Larkspur Booking Assistant",
      coverWord: "GATE BOOKINGS",
      problemStatement:
        "Larkspur Travel's booking assistant handles about 860,000 conversations a month, covering flight changes, hotel holds and refund policy questions. A prompt edit last month made the assistant describe the cancellation window wrongly, and it stayed wrong for three days until a customer emailed. A later security review also found full passport numbers echoed into a chat transcript that reached the analytics store. Build an evaluation harness with a golden set, an LLM-as-judge scored against a rubric, PII and refusal checks, and regression gates that block a pull request in CI.",
      userRole: "AI engineer on the Trust and Quality team",
      projectType: "Evaluation harness with LLM-as-judge, guardrail checks and CI gates",
      difficulty: "advanced",
      estMinutes: 200,
      maxXp: 1530,
      tools: ["Python 3.12", "GitHub Actions", "An LLM API for the judge", "JSONL datasets", "A PII pattern library", "pytest"],
      workflows: [
        "Curate a golden set of conversations with policy-owner labels",
        "Calibrate an LLM judge against human grades before trusting it",
        "Run deterministic PII and refusal checks independent of the judge",
        "Block pull requests in CI when a gate threshold fails",
      ],
      skills: ["LLM evaluation", "Rubric design", "LLM-as-judge calibration", "Privacy and PII handling", "CI for ML systems", "Risk communication"],
      deliverables: [
        {
          title: "Evaluation harness repository",
          description: "Golden set, judge with calibration report, PII and refusal checks, and the CI gate workflow with documented thresholds.",
          kind: "github",
        },
        {
          title: "Harness walkthrough recording",
          description: "Screen recording that shows one blocked regression, one passing change and the calibration numbers.",
          kind: "recording",
        },
      ],
      kickoff: {
        segments: [
          {
            id: "ai-eng-booking-evals-k1",
            title: "The problem",
            noteSection: "problem",
            slides: [
              {
                heading: "We found the last regression from an email",
                bullets: [
                  "A wrong description of the 24-hour cancellation window ran for three days",
                  "No automated test judged the quality of answers",
                ],
                visual: "metric",
                metric: { label: "Days to catch the last regression", value: "3 days" },
              },
              {
                heading: "Personal data in logs",
                bullets: [
                  "Full passport numbers appeared in a transcript that reached analytics",
                  "Nothing checks for personal data before a release",
                ],
                visual: "quote",
                quote: {
                  text: "We shipped a refund answer that was wrong for three days, and a customer found it.",
                  author: "Dana Whitfield, Engineering Manager",
                },
              },
              {
                heading: "What travelers ask about",
                bullets: [
                  "Booking changes are the largest share of conversations",
                  "Refund policy questions carry the most financial risk",
                ],
                visual: "chart",
                chart: [
                  { label: "Booking changes", value: 38 },
                  { label: "Refund policy", value: 24 },
                  { label: "Itinerary questions", value: 22 },
                  { label: "Other", value: 16 },
                ],
              },
            ],
            transcript:
              "Let me be direct. We run a booking assistant that touches about 860,000 conversations a month. It rebooks flights, places hotel holds, and explains our refund policy. Last month a prompt edit changed how the assistant described the 24-hour cancellation window, and it stayed wrong for three days. We found it from a customer email, not from our own tests, because we have no tests that judge answers. Worse, during a security review we found full passport numbers echoed back in a transcript that landed in our analytics store. Nothing in our pipeline checks for personal data before a release. That is the problem I want you to solve. Every prompt change ships on faith right now. Write up what a regression means for us in your note, and include the privacy risk.",
            rubricPoints: [
              "Quantifies the three-day regression and that a customer found it",
              "Identifies the missing automated judgment of answer quality",
              "Names passport numbers in logs as a privacy risk",
              "Explains that prompt changes currently ship without checks",
            ],
            checkpointPrompt: "Write what a regression means for Larkspur, and why privacy leakage belongs in the same harness.",
          },
          {
            id: "ai-eng-booking-evals-k2",
            title: "The outcome",
            noteSection: "outcome",
            slides: [
              {
                heading: "A golden set people trust",
                bullets: [
                  "400 conversations with expected answers written by a policy owner",
                  "The same cases run on every prompt and model change",
                ],
                visual: "metric",
                metric: { label: "Golden set size", value: "400 cases" },
              },
              {
                heading: "Hard gates, not dashboards",
                bullets: [
                  "Policy accuracy may not drop more than 2 points against main",
                  "Any PII finding or out-of-window refund offer blocks the merge",
                ],
                visual: "quote",
                quote: {
                  text: "A red build is cheaper than a wrong refund.",
                  author: "Dana Whitfield, Engineering Manager",
                },
              },
              {
                heading: "Judge only once it is calibrated",
                bullets: [
                  "The judge must agree with human graders at least 85 percent of the time",
                  "Calibration uses a sample of 50 human-graded examples",
                ],
              },
            ],
            transcript:
              "Here is what success looks like. We want a golden set of 400 conversations with expected answers, each labeled by a travel policy owner, so every prompt or model change runs against the same cases. A judge model scores each answer against a four-point rubric covering policy accuracy, completeness, tone, and whether the assistant took a permitted action. We trust the judge only after it agrees with human graders at least 85 percent of the time on a sample of 50. Then the gates. A pull request that drops policy accuracy by more than 2 points against main fails CI. Zero passport numbers in logged output, and zero refund offers outside the published window. Refusals matter too. An assistant that refuses a valid rebooking is also a regression. Put these gates in your note, with their thresholds.",
            rubricPoints: [
              "Describes a golden set of 400 cases labeled by a policy owner",
              "Requires judge agreement of at least 85 percent with human graders",
              "Sets a CI gate that fails on a drop of more than 2 points",
              "Treats zero PII leaks and zero out-of-window refunds as hard gates",
            ],
            checkpointPrompt: "List the gates and thresholds you would commit to, and say which one blocks a release outright.",
          },
          {
            id: "ai-eng-booking-evals-k3",
            title: "The process",
            noteSection: "process",
            slides: [
              {
                heading: "Four steps, in order",
                bullets: [
                  "Each step has a clear exit check before the next one starts",
                ],
                visual: "flow",
                flow: ["Curate golden set", "Calibrate judge", "Add PII and refusal checks", "Gate the pull request"],
              },
              {
                heading: "Effort split",
                bullets: [
                  "Golden set and judge calibration take the most careful work",
                  "Deterministic checks are small but must never depend on the judge",
                ],
                visual: "chart",
                chart: [
                  { label: "Golden set curation", value: 30 },
                  { label: "Judge calibration", value: 30 },
                  { label: "PII and refusal checks", value: 20 },
                  { label: "CI integration", value: 20 },
                ],
              },
              {
                heading: "Freeze what you measure with",
                bullets: [
                  "Pin the judge prompt to a version so scores stay comparable",
                  "Version the golden set and record every change in the README",
                ],
              },
            ],
            transcript:
              "Here is the order I would like. Start with the golden set. Pull 400 real conversations, strip personal data first, and have a policy owner write the expected answer for each one. Next, calibrate the judge. Run it on the 50 human-graded examples and tune the rubric prompt until agreement reaches our 85 percent bar. Then freeze that prompt version so scores stay comparable over time. After that, add two checks that do not depend on the judge. A PII scanner that flags passport, card, and booking reference patterns in every output, and a refusal check that compares refusals against the cases marked should-refuse. Finally, wire the whole suite into CI with a regression gate. Explain the order and the reason for it in your write-up. I care more about your reasoning than the exact tooling.",
            rubricPoints: [
              "Strips personal data from the golden set before labeling",
              "Calibrates and freezes the judge before trusting its scores",
              "Uses deterministic PII and refusal checks independent of the judge",
              "Wires a regression gate into CI with explicit thresholds",
            ],
            checkpointPrompt: "Describe the build order and why the judge is calibrated before it is trusted.",
          },
        ],
      },
      pou: [
        {
          id: "ai-eng-booking-evals-q1",
          prompt: "Why not have a second model grade the answers, and what do you do about its mistakes?",
          rubricPoints: [
            "Explains that a judge suits nuanced rubric axes such as tone and completeness",
            "Says the judge must be calibrated against human grades",
            "Notes that deterministic checks catch cases a judge can miss",
          ],
          followUp: "How would you detect that the judge itself has drifted?",
        },
        {
          id: "ai-eng-booking-evals-q2",
          prompt: "What should block a pull request, and what should not?",
          rubricPoints: [
            "Blocks when policy accuracy drops by more than 2 points",
            "Blocks on any PII finding or out-of-window refund offer",
            "Does not block on small noise in the tone score",
          ],
          followUp: "How do you stop the golden set from going stale as policies change?",
        },
        {
          id: "ai-eng-booking-evals-q3",
          prompt:
            "A refund answer passes the judge, but the PII scanner flags a booking reference in its output. What do you tell the team?",
          rubricPoints: [
            "The release is blocked because the PII check is independent of the judge",
            "A passing judge score does not clear a privacy failure",
            "Suggests redacting the output before it is logged",
          ],
          followUp: "Where in the pipeline would you redact, and why there?",
        },
      ],
      stages: [
        {
          id: "ai-eng-booking-evals-s1",
          order: 1,
          title: "Build the golden set and rubric",
          summary: "Create a versioned set of 400 labeled conversations and a four-point rubric the whole team can read.",
          estMinutes: 40,
          kind: "work",
          requirements: [
            "400 cases in a versioned JSONL file with input, expected outcome and policy tags",
            "Personal data removed from every case by a documented redaction step before labeling",
            "Four-point rubric covering policy accuracy, completeness, tone and permitted actions",
            "Each case labeled by a policy owner, with the labeler recorded in the file",
          ],
          planOpener:
            "Good to have you on this one. The golden set is the foundation, so let's agree on what is in it. I want 400 cases with policy tags and no personal data. How will you pick the cases, and how will you make sure the refund window cases are well represented?",
          learn: [
            {
              id: "ai-eng-booking-evals-s1-l1",
              title: "Golden sets that stay honest",
              minutes: 6,
              body: `A golden set is a contract. It says these conversations matter, and these are the answers a correct system must give. If the set is sloppy, every score built on it is sloppy too.

**Pick cases on purpose.** Sample from real traffic, then add cases for every policy that carries money or personal data risk. The refund window, passport handling and rebooking rules should each have dozens of cases, not three.

**Redact first.** Strip names, passport numbers, card numbers and booking references before a human sees the case. Record that the redaction ran, so a later audit can confirm it.

**Store cases as data.** One case per line keeps diffs readable and lets you version the set:

\`\`\`json
{"id": "gs-0212", "input": "Can I cancel my hotel hold 20 hours before check-in?", "expected": "Refund offered under the 24-hour window", "policy_tags": ["refund", "cancellation"], "labeled_by": "policy_team_02", "version": "2026.11"}
\`\`\`

**Write the rubric as questions.** Each axis should have a yes or no question a labeler could answer. "Does the answer state the cancellation window exactly?" is useful. "Is the answer good?" is not.

**Freeze the set per release.** Changing a case to match a new output is cheating. Add new cases in a new version and keep the old ones.`,
              check: {
                question: "Why should a golden case be changed only in a new version of the set?",
                options: [
                  "To keep the file size small",
                  "So scores stay comparable and changes to match outputs are visible",
                  "Because the judge cannot read edited cases",
                  "To remove the need for policy tags",
                ],
                answerIndex: 1,
                explanation: "Quietly editing cases to match new outputs hides regressions and makes past scores meaningless.",
              },
            },
          ],
          submission: {
            kinds: ["github", "text"],
            instructions:
              "Share the repository link. In the text box, paste the case count per policy tag and the four rubric questions exactly as labelers will see them.",
          },
          rubricHints: {
            understanding: "Meeting expectations means you can explain why redaction comes before labeling and why cases are versioned.",
            quality: "Meeting expectations means the set has 400 cases with policy tags, a redaction record and rubric questions a labeler can answer yes or no.",
            communication: "Meeting expectations means the rubric is written so a policy owner who has never seen the harness can use it.",
            independence: "Meeting expectations means you chose the case mix yourself and explained the coverage of high-risk policies.",
          },
          xp: 200,
        },
        {
          id: "ai-eng-booking-evals-s2",
          order: 2,
          title: "Add LLM-as-judge scoring",
          summary: "Build a pinned judge, calibrate it against human grades and report per-axis scores for two model versions.",
          estMinutes: 40,
          kind: "work",
          requirements: [
            "Judge prompt pinned to a version string and returns JSON with a score and rationale for each axis",
            "Agreement with 50 human-graded examples reported, with a target of at least 85 percent",
            "Judge disagreements logged with the case ID for review",
            "Harness outputs a per-axis score table for the main branch and for a candidate change",
          ],
          planOpener:
            "The set is in place, so now we need a judge we can trust. Before you show me any scores, I want to see calibration. Which 50 cases will you hand-grade, and what will you do if the judge agrees only 78 percent of the time?",
          learn: [
            {
              id: "ai-eng-booking-evals-s2-l1",
              title: "LLM as judge, calibrated",
              minutes: 6,
              body: `A judge model is useful for subtle axes such as tone or completeness, where string matching fails. It is also a model, so it can be wrong in consistent ways. Calibration is how you find out where.

**Pin the judge.** Give the judge prompt a version string and store it with every score. If you change one word, bump the version, so old and new scores are never compared as if they were the same measure.

**Ask for structured output.** The judge returns a score and a short rationale for each axis, in JSON that your code can validate:

\`\`\`json
{"judge_version": "v3.2", "policy_accuracy": {"score": 1, "rationale": "States the 24-hour window correctly."}, "tone": {"score": 1, "rationale": "Polite and clear."}}
\`\`\`

**Calibrate against humans.** Hand-grade 50 cases yourself or with a policy owner. Compare judge and human scores axis by axis. Agreement of 85 percent or more is the bar; below that, the judge is not ready.

**Read the disagreements.** Most calibration errors cluster in one axis or one policy. Find the pattern, adjust the rubric wording, and re-run the calibration with a new version.

**Keep the judge out of the gate's blind spots.** The judge should never be the only check on privacy or on refund windows. Those belong to deterministic checks, covered in the next stage.`,
              check: {
                question: "Why must the judge prompt carry a version string?",
                options: [
                  "So the judge runs faster on the CI server",
                  "So scores from different judge prompts are not compared as the same measure",
                  "Because the API requires it for every call",
                  "So the judge can read the golden set",
                ],
                answerIndex: 1,
                explanation: "A changed judge prompt is a changed instrument, so its scores need their own version label.",
              },
            },
          ],
          submission: {
            kinds: ["github", "url"],
            instructions:
              "Share the repository link and a link to the calibration report with the agreement rate, the disagreement log and the per-axis score table.",
          },
          rubricHints: {
            understanding: "Meeting expectations means you can explain why a judge must be calibrated before its scores are trusted.",
            quality: "Meeting expectations means the judge output is validated JSON, the prompt is pinned and the calibration report is reproducible.",
            communication: "Meeting expectations means the calibration report states the agreement rate and the main disagreement pattern in plain language.",
            independence: "Meeting expectations means you investigated disagreements and revised the rubric yourself rather than accepting the first agreement number.",
          },
          xp: 230,
        },
        {
          id: "ai-eng-booking-evals-s3",
          order: 3,
          title: "Wire regression gates, PII and refusal checks",
          summary: "Add deterministic PII and refusal checks and a CI gate that blocks merges on regressions or leaks.",
          estMinutes: 40,
          kind: "work",
          requirements: [
            "PII scanner flags passport, card and booking reference patterns in every assistant output",
            "Refusal check compares refusals against cases marked should-refuse and reports both error types",
            "CI blocks merges when policy accuracy drops more than 2 points or any PII is found",
            "Gate results posted as a summary comment on the pull request",
          ],
          planOpener:
            "Now we make the gate real. I want the PII and refusal checks to run without the judge, because a privacy failure should never depend on a model's opinion. What does a blocked pull request look like to the engineer who opened it?",
          learn: [
            {
              id: "ai-eng-booking-evals-s3-l1",
              title: "CI gates for model changes",
              minutes: 5,
              body: `A gate is only useful if it runs on every change and fails loudly. For model work, that means treating the eval suite like a test suite, with thresholds that a reviewer can read in the workflow file.

**Deterministic checks first.** Patterns for passport numbers, card numbers and booking references can be checked with regular expressions and checksums. They are fast, cheap and independent of the judge. Run them on every output, not a sample.

**Two kinds of refusal error.** A refusal check should count false refusals, where a valid request was refused, and missed refusals, where a should-refuse case was answered. Report both. Optimizing only one will push the system toward the other failure.

**Gate on the difference.** Compare the candidate against main, not against a fixed number alone. A drop of more than 2 points in policy accuracy fails the build:

\`\`\`yaml
- name: Run eval gate
  run: python -m evals.gate --baseline main --max-drop 2.0 --pii-block --refusal-report
\`\`\`

**Make the failure readable.** Post a summary to the pull request: which gate failed, the old and new numbers, and the example cases that changed. An engineer should know what to fix without reading logs.

**Never let a bypass stay quiet.** If someone needs to override a gate, require a named approver and log the reason in the repository.`,
              check: {
                question: "Why should the PII check run independently of the judge?",
                options: [
                  "Judges are too slow to run on every output",
                  "A privacy failure should not depend on a model's opinion",
                  "The judge cannot read passport patterns",
                  "PII checks are only required for the demo",
                ],
                answerIndex: 1,
                explanation: "Deterministic checks give a reliable answer for privacy, which a probabilistic judge cannot guarantee.",
              },
            },
          ],
          submission: {
            kinds: ["github", "url"],
            instructions:
              "Share the repository link and a link to a pull request where the CI gate blocked a deliberate regression, with the summary comment visible.",
          },
          rubricHints: {
            understanding: "Meeting expectations means you can explain why PII and refusal checks are deterministic and why refusals have two error types.",
            quality: "Meeting expectations means the gate has tests for each check and the workflow fails on the thresholds in one readable place.",
            communication: "Meeting expectations means the pull request summary tells an engineer which gate failed, by how much and which cases changed.",
            independence: "Meeting expectations means you designed the gate thresholds and the bypass rule yourself and explained the trade-offs.",
          },
          xp: 250,
        },
        {
          id: "ai-eng-booking-evals-s4",
          order: 4,
          title: "Present the harness to Dana",
          summary: "Walk through one blocked regression and one passing change, then defend the thresholds and the blind spots.",
          estMinutes: 40,
          kind: "presentation",
          requirements: [
            "Recorded walkthrough of eight minutes or less showing one blocked regression and one passing change",
            "Report judge agreement rate, gate thresholds and the false positive rate you observed",
            "Explain what the harness does not catch and how you would close that gap",
            "Answer Dana's questions about threshold choices live",
          ],
          planOpener:
            "Let's plan the walkthrough. Show me one change the gate blocks and one it lets through, with the reason in the summary comment. I also want your honest list of what the harness cannot catch. What will you say about the judge's agreement rate?",
          learn: [
            {
              id: "ai-eng-booking-evals-s4-l1",
              title: "Presenting a harness to a manager",
              minutes: 4,
              body: `Dana does not need to know every metric. She needs to know whether the harness protects travelers, what it costs in speed, and where it can still fail. Build the presentation around those three questions.

**Protection first.** Open with the two hard gates, PII and out-of-window refunds, and show that a deliberately bad change fails on them. This is the evidence that the harness does its job.

**Cost second.** Report how long the suite takes and how often a good change was blocked by mistake. That second number is the false positive rate, and a manager should hear it from you before she asks.

**Calibration third.** State the judge's agreement with human grades and the axes where it is weakest. A judge that agrees 88 percent of the time on policy and 71 percent on tone is useful, but only if you say so.

**Name the blind spots.** The harness will not catch a policy that changed and was never added to the golden set, or a failure only seen with real users. Say that, then say how you would close it, such as a weekly sample from production.

**Keep it under eight minutes.** Cut the repository tour. The recording should show the gate, the numbers and the gaps.`,
              check: {
                question: "What belongs in a manager presentation about an evaluation harness?",
                options: [
                  "Every metric the harness logs",
                  "The protection it gives, its cost in false blocks, and its blind spots",
                  "The list of Python packages used",
                  "Only the best score the harness ever produced",
                ],
                answerIndex: 1,
                explanation: "A manager needs to know what is protected, what it costs and where it can still fail.",
              },
            },
          ],
          submission: {
            kinds: ["recording"],
            instructions:
              "Record a screen walkthrough of eight minutes or less. Show one blocked regression, one passing change, the calibration numbers and the blind spots you found.",
          },
          rubricHints: {
            understanding: "Meeting expectations means you explain how the judge, deterministic checks and CI gate fit together and where each can fail.",
            quality: "Meeting expectations means the demo runs on real pull requests and the numbers on screen match the calibration report.",
            communication: "Meeting expectations means the presentation states false positives and blind spots plainly rather than emphasizing only the wins.",
            independence: "Meeting expectations means you defend your threshold choices with your own reasoning when Dana challenges them.",
          },
          xp: 300,
        },
      ],
      map: { x: 58, y: 40 },
    },
  ],
};

export default pack;
