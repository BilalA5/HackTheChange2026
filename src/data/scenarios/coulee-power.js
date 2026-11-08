import { videos } from '@/data/videos.js';

export default {
  id: 'coulee-power-price-drop',
  company: 'Coulee Power',
  logo: '/assets/scenarios/coulee-power.svg',
  title: 'Explaining the Alberta Power Price Drop at Coulee Power',
  shortTitle: 'Why Power Prices Halved',
  task: 'Explain why Alberta’s pool price fell by half',
  summary:
    'Alberta’s average pool price fell from $133.63/MWh in 2023 to $62.78 in 2024. Work out why from AESO data and set a fixed rate for 2026.',
  category: 'Market analysis',
  duration: '2 hr 45 min',
  role: 'Energy Analyst',
  fits: ['energy', 'data', 'finance'],
  modelReview: true,
  skills: ['Time series analysis', 'Supply and demand', 'Pricing strategy', 'Presenting to a team'],
  tools: ['Python', 'Google Sheets', 'Claude'],

  manager: {
    name: 'Avery',
    role: 'Manager',
    style: 'Detail-minded',
    photo: '/assets/onboarding/cast-avery.jpg',
    opening: [
      'Welcome to Coulee Power. We sell electricity to homes and small businesses across Alberta.',
      'We set our 2026 fixed-rate plans next month, and the wholesale price has moved a lot. I need to know why before we pick a number. The AESO data is in your resources.',
    ],
    script: [
      {
        say: 'Where should I start?',
        reply:
          'Open the AESO annual market statistics. Pull the average pool price for 2023, 2024 and 2025 and put them side by side.',
      },
      {
        say: 'The average pool price fell from $133.63/MWh in 2023 to $62.78 in 2024. That’s a 53% drop.',
        reply: 'That’s the headline. Demand didn’t fall, though. So what changed?',
      },
      {
        say: 'Average demand rose 2.6% to 10,112 MW, but installed capacity grew 11.3% to 23,122 MW.',
        reply:
          'There it is. Supply grew more than four times faster than demand. What does that mean for the rate we lock in for 2026?',
      },
      {
        say: '2025 averaged $43.68, so I’d anchor our 2026 fixed rate there, with a buffer for a cold snap or a big outage.',
        reply:
          'Good instinct on the buffer. Peak demand still set seasonal records in 2024, so the risk is real. Put the three prices, the supply story and your rate on one slide, then hit Submit for review.',
      },
    ],
    replies: [
      {
        keywords: ['data', 'aeso', 'csv', 'file', 'resource', 'source'],
        text: 'Everything is in the AESO annual market statistics in your resources. Quote the report when you use a number.',
      },
      {
        keywords: ['pool price', 'price', 'mwh'],
        text: 'Use the annual average pool price. It’s the cleanest number for a year-on-year story. Monthly is a bonus.',
      },
      {
        keywords: ['demand', 'load', 'ail'],
        text: 'Use average Alberta Internal Load. That’s the province’s demand, before exports.',
      },
      {
        keywords: ['supply', 'capacity', 'generation', 'wind', 'solar', 'gas'],
        text: 'Compare installed capacity year on year. Then ask which kinds of generation were added.',
      },
      {
        keywords: ['rate', 'fixed', 'plan', 'customers', 'hedge'],
        text: 'Our fixed rate has to beat the regulated rate and still cover us in a bad month. Anchor it on recent prices, then add a buffer you can explain.',
      },
      {
        keywords: ['cold', 'winter', 'peak', 'spike', 'outage', 'risk'],
        text: 'Annual averages hide spikes. A cold week with low wind can push hourly prices to the cap. Name that risk on your slide.',
      },
      {
        keywords: ['chart', 'graph', 'visual', 'slide'],
        text: 'One slide: a bar chart of the three annual prices, one line on supply against demand, and your rate.',
      },
    ],
    fallbacks: [
      'Keep going. What does the AESO data say?',
      'Give me the number first, then the reason.',
      'How would that change the rate we charge in 2026?',
    ],
  },

  coach: {
    name: 'Jenna',
    role: 'Coach',
    style: 'Patient',
    photo: '/assets/cast/coach-jenna.webp',
    opening: [
      'Hi, I’m Jenna, your coach for this one. Energy markets sound hard, but this brief is really about supply and demand.',
      'Tip: give Avery a number in every message. Analysts who lead with data get trusted fast.',
    ],
    script: [
      {
        say: 'I don’t know what a pool price is.',
        reply:
          'It’s the wholesale price of electricity in Alberta, set every hour by the AESO’s market. Generators offer power, the cheapest offers that cover demand are used, and the last one needed sets the price. More cheap supply means a lower price.',
      },
      {
        say: 'How do I explain supply and demand simply?',
        reply:
          'Two numbers: demand grew 2.6% and capacity grew 11.3%. When supply grows four times faster than demand, the price falls. Say exactly that.',
      },
      {
        say: 'Am I ready to submit?',
        reply:
          'Check three things: did you quote the price drop with its source, compare supply with demand, and give a 2026 rate with a reason for the buffer? If yes, you’re ready.',
      },
    ],
    replies: [
      {
        keywords: ['stuck', 'lost', 'help', 'confused'],
        text: 'Let’s shrink it. Which requirement are you on? Do only that one next.',
      },
      {
        keywords: ['python', 'pandas', 'code'],
        text: 'Keep the code small: load the numbers into a DataFrame, compute the percent change, and plot one bar chart.',
      },
      {
        keywords: ['percent', 'percentage', 'change', 'calculate'],
        text: 'Percent change is new minus old, divided by old. For 2023 to 2024: (62.78 − 133.63) ÷ 133.63 ≈ −53%.',
      },
      {
        keywords: ['nervous', 'hard', 'overwhelmed', 'tired'],
        text: 'You only need three prices and two growth rates. That’s five numbers. You can do five numbers.',
      },
    ],
    fallbacks: [
      'Nice. What’s the very next step you can finish in ten minutes?',
      'Turn that into one sentence for Avery, with a number in it.',
      'You’re close. Which requirement is still open?',
    ],
  },

  requirements: [
    {
      title: 'Show how far the price fell',
      steps: [
        'Chart the average pool price for 2023, 2024 and 2025 from the AESO statistics',
        'Quote the 2023 to 2024 drop in one sentence, with its source',
      ],
    },
    {
      title: 'Explain it with supply and demand',
      steps: [
        'Put average Alberta Internal Load next to installed capacity for 2023 and 2024',
        'Work out which grew faster, and by how much',
      ],
    },
    {
      title: 'Recommend a 2026 fixed rate',
      steps: [
        'Anchor the rate on recent prices',
        'Name one risk that could push prices back up and size a buffer for it',
        'Pressure test your recommendation with Claude',
      ],
    },
  ],

  videos: [videos.couleePowerKickoff, videos.poolPrice],

  resources: ['AESO market statistics 2024', 'AESO market statistics 2025'],

  notes: [
    {
      heading: 'Problem',
      items: [
        'Coulee Power sets its 2026 fixed-rate plans next month',
        'Alberta’s wholesale power price fell by more than half in a year',
        'Price too high and customers leave for the regulated rate. Price too low and a cold winter wipes out the margin',
      ],
    },
    {
      heading: 'Data (AESO Annual Market Statistics)',
      items: [
        'Average pool price: $133.63/MWh in 2023, $62.78 in 2024, $43.68 in 2025',
        'Average Alberta Internal Load: 9,851 MW in 2023, 10,112 MW in 2024 (+2.6%)',
        'Installed capacity: 20,777 MW in 2023, 23,122 MW in 2024 (+11.3%)',
        'Summer peak demand: 12,221 MW in 2024, up 6.1% on 2023',
      ],
    },
    {
      heading: 'Outcome',
      items: [
        'A clear reason for the price drop the pricing team can repeat',
        'A 2026 fixed rate with a buffer you can defend',
      ],
    },
    {
      heading: 'Deliverable',
      items: [
        'One slide: the three prices, supply against demand, and your rate',
        'A short note on the risk behind your buffer',
      ],
    },
  ],

  review: {
    summary:
      'Clear and well sourced. You led with the 53% drop, tied it to capacity growing four times faster than demand, and your 2026 rate has a buffer you can defend. Next time, add monthly prices: an annual average hides the spikes that hurt a retailer.',
    scores: { insight: 0.85, quality: 0.8, communication: 0.85, reliability: 0.8 },
    xp: 150,
  },
};
