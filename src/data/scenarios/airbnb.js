export default {
  id: 'airbnb-host-cancellations',
  company: 'Airbnb',
  logo: '/assets/onboarding/logo-airbnb.svg',
  art: '/assets/onboarding/airbnb-art.webp',
  title: 'Reducing Host Cancellations at Airbnb',
  shortTitle: 'Reducing Host Cancellations',
  task: 'Find why hosts cancel',
  summary: 'Host cancellations are at 14% and cost $3 million a year. Find the root cause and price the fix.',
  category: 'Cost reduction',
  duration: '3 hr 15 min',
  role: 'Product Analyst',
  skills: ['Root cause analysis', 'Trend analysis', 'Financial modelling', 'Presenting to a team'],
  tools: ['Claude', 'Google Sheets', 'ChatGPT'],

  manager: {
    name: 'Rowan',
    role: 'Manager',
    photo: '/assets/onboarding/guide-face.jpg',
    opening: [
      'Hey. First up: find out why hosts cancel.',
      'The data is in your resources. Send me a draft when ready.',
    ],
    script: [
      {
        say: 'Where should I start?',
        reply: 'Open the cancellations file. Sort it by reason. The biggest one is your answer.',
      },
      {
        say: 'Calendar conflicts are the top reason, at 46% of cancellations.',
        reply: "That's bigger than I expected. What's driving the conflicts? Hosts double booking on other sites?",
      },
      {
        say: 'Mostly double bookings. Hosts list on two sites and their calendars drift out of sync.',
        reply: 'Makes sense. So what would you change, and how much would it move the number?',
      },
      {
        say: 'Sync host calendars automatically. I estimate that takes cancellations from 14% to 10%.',
        reply: 'Good. Now the question the panel will ask first: what would the fix cost, and what does it save us?',
      },
      {
        say: 'Each point of cancellations costs about $210k a year, so 4 points saves roughly $850k against a build cost near $300k.',
        reply:
          "That's a story I can take upstairs. Put it on one slide: the 46%, the fix, the cost and the saving. Then hit Submit for review.",
      },
    ],
    replies: [
      {
        keywords: ['data', 'file', 'csv', 'resource'],
        text: 'Everything you need is in Cancellations by reason.csv on the left. Sort before you chart.',
      },
      {
        keywords: ['cost', 'money', 'saving', 'price'],
        text: 'Every cancellation costs us a refund, a rebooking and a guest who may not come back. Put a number on one of those and you have a model.',
      },
      {
        keywords: ['slide', 'present', 'presentation', 'panel'],
        text: 'One slide. Lead with the finding, then the fix, then the money. The panel will interrupt you, so lead with the number.',
      },
      {
        keywords: ['chart', 'graph', 'visual'],
        text: 'A sorted bar chart of reasons is all you need. Highlight the top bar, grey out the rest.',
      },
    ],
    fallbacks: [
      'Keep going. What does the data say?',
      "I'd rather see a rough number than a perfect paragraph. What's your estimate?",
      'Say that again in one sentence, like you would to the panel.',
    ],
  },

  coach: {
    name: 'Ian',
    role: 'Coach',
    style: 'Motivational',
    photo: '/assets/cast/coach-ian.webp',
    opening: [
      "I'm Ian, your coach. You've got this. I'll keep you moving when it gets fuzzy.",
      'Root cause work is detective work: follow the biggest number first.',
    ],
    script: [
      {
        say: "I don't know how to price the problem.",
        reply:
          'Start from one cancellation. What does it cost: a refund, a rebooking, maybe a lost guest? Put a rough number on each, add them up, then multiply by how many cancellations there are. Rough is fine.',
      },
      {
        say: 'How do I make my recommendation convincing?',
        reply:
          'Show the before and after in one line: 14% to 10%. Then the money. People remember a number that moves.',
      },
      {
        say: 'Am I ready to submit?',
        reply:
          "Check three things: did you name the top reason, back it with the data, and say what the fix costs? If yes, you're ready. Go for it!",
      },
    ],
    replies: [
      {
        keywords: ['stuck', 'lost', 'help', 'confused'],
        text: "Let's shrink it. Which of the three requirements are you on right now? Just that one.",
      },
      {
        keywords: ['tired', 'hard', 'difficult', 'overwhelmed'],
        text: "Hard means you're learning. Take five, then come back and do the smallest next thing.",
      },
      {
        keywords: ['panel', 'question', 'nervous'],
        text: "The panel wants you to win. Expect 'what would it cost' and have that number ready.",
      },
    ],
    fallbacks: [
      "Nice. What's the very next step you can take in ten minutes?",
      'Write that down as a sentence for Rowan. Clear beats clever.',
      "You're closer than you think. What's missing?",
    ],
  },

  requirements: [
    {
      title: 'Name the top reason hosts cancel',
      steps: ['Group the cancellations by reason with Claude', 'Sort the reasons and find the biggest share'],
    },
    {
      title: 'Back it with the data',
      steps: [
        'Chart the reasons as a sorted bar chart in Google Sheets',
        'Quote the share of the top reason in one sentence',
      ],
    },
    {
      title: 'Say what the fix will cost',
      steps: [
        'Price one cancellation, then the whole problem per year',
        'Estimate the cost of the fix and what it saves',
        'Pressure test your plan with ChatGPT',
      ],
    },
  ],

  resources: ['Cancellations by reason.csv'],

  notes: [
    {
      heading: 'Problem',
      items: [
        'Host cancellations are at 14% of bookings',
        'They cost Airbnb about $3 million a year in refunds, rebookings and lost guests',
        'Guests who are cancelled on are far less likely to book again',
      ],
    },
    {
      heading: 'Outcome',
      items: [
        'Bring cancellations down to 10%',
        'A clear root cause the team can act on this quarter',
      ],
    },
    {
      heading: 'Deliverable',
      items: ['Host Cancellation Reduction Proposal (PDF)', 'One slide for the final presentation'],
    },
  ],

  review: {
    summary:
      'Strong work. You found the 46% quickly and priced the fix in a way the panel can repeat. Next time, show your cost assumptions on the slide so nobody has to ask.',
    scores: { insight: 0.9, quality: 0.8, communication: 0.85, reliability: 0.75 },
    xp: 150,
  },
};
