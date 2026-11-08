import { videos } from '@/data/videos.js';

export default {
  id: 'shopify-price-recommender',
  company: 'Shopify',
  logo: '/assets/workspace/shopify-bag.png',
  title: 'Building a Black Friday Price Recommender at Shopify',
  shortTitle: 'Black Friday Price Recommender',
  task: 'Draft the merchant-ready price recommender spec',
  summary:
    'Merchants guess their Black Friday prices. Spec a demand model that recommends one, and prove it beats last week.',
  category: 'Machine learning',
  duration: '2 hr 30 min',
  role: 'Data Scientist',
  fits: ['ai', 'data', 'technology'],
  skills: ['Demand modelling', 'Spec writing', 'Model evaluation', 'Explaining trade-offs'],
  tools: ['Claude Code', 'Python', 'XGBoost', 'Streamlit'],

  manager: {
    name: 'Erik Vogt',
    role: 'Manager',
    photo: '/assets/workspace/avatar-erik.png',
    opening: [
      'Welcome aboard. Merchants are guessing their Black Friday prices and leaving money on the table.',
      'Your first job is the spec for our price recommender. The requirements are on the left, and the kickoff notes are open on the right. Ask me anything.',
    ],
    script: [
      {
        say: 'How do I decide which products count as sparse?',
        reply:
          'Sparse is a cutoff you choose. Count how many weeks of sales each product has, then set a minimum number of weeks, say 8, and any product with fewer weeks of data gets sparse = True. Pick the number yourself and write one sentence in the overview note on why that cutoff makes sense for a model to learn from.\n\nWhat cutoff are you going with, and what is the reason?',
      },
      {
        say: 'We need to use both Single Price AND Sparse yes?',
        reply:
          'Yes. Both flags are columns in the table, and each one is its own true or false per product. A product can be sparse, single-price, both, or neither.\n\nWhich weeks-of-history number are you going to set as the sparse cutoff?',
      },
      {
        say: "I'll set the sparse cutoff at 8 weeks, so the model sees two months of price changes.",
        reply:
          'Good. Two months covers at least one promo cycle for most merchants. Put that sentence in the overview note, then send me the repo once Rule 1 is written.',
      },
      {
        say: 'Here is the repo: https://github.com/BilalA5/Shopify-Black-Friday-Price-Recommender',
        reply:
          "Got your submission, reviewing it now. Before I look at this, tell me what you did and why, and how you got there.",
      },
      {
        say: "I flagged sparse products by weeks of history and single-price products by distinct prices seen, then swept 10 evenly spaced prices between each product's min and max.",
        reply:
          "That's clear, and the sweep is easy for a merchant to trust. When you're happy with it, hit Submit for review and I'll score it against the four requirements.",
      },
    ],
    replies: [
      {
        keywords: ['revenue', 'formula'],
        text: 'Revenue is price times the units the model predicts at that price. Show the merchant three points: last price, expected price and the recommended one.',
      },
      {
        keywords: ['baseline', 'accuracy', 'beat', 'error'],
        text: 'The bar is simple: beat last week on every slice of the test weeks, and price 100% of products with no blanks.',
      },
      {
        keywords: ['fallback', 'backup', 'odd'],
        text: 'Two backups. Sparse products fall back to the last price with a fallback status. Single-price products keep the one price we have seen.',
      },
      {
        keywords: ['step', 'steps', 'sweep', 'range'],
        text: 'Pick one step count, like 10 evenly spaced prices from min to max, and run one flagged product through it by hand.',
      },
      {
        keywords: ['xgboost', 'model', 'train'],
        text: 'XGBoost on units sold per product per week. Train on the earlier weeks and test on the later ones, never the other way round.',
      },
      {
        keywords: ['streamlit', 'app', 'merchant'],
        text: 'The merchant app can be plain Streamlit. One product picker, the price sweep graph and the three revenue points.',
      },
      {
        keywords: ['deadline', 'due', 'eod', 'end of day'],
        text: 'Aim to have the spec to me by end of day. If it slips, tell me early, not late.',
      },
    ],
    fallbacks: [
      'Say more. What part of the spec is that for?',
      'Tie it back to a requirement on the left and I can give you a straight answer.',
      "Good question. What would you do if I weren't here? Start there and I'll push back if it's off.",
    ],
  },

  coach: {
    name: 'Jenna',
    role: 'Coach',
    style: 'Warm',
    photo: '/assets/cast/coach-jenna.webp',
    opening: [
      "Hi, I'm Jenna, your coach for this one. I won't do the work for you, but I'll help you think it through.",
      'Tip: ask Erik one specific question at a time. Managers answer specific questions fast.',
    ],
    script: [
      {
        say: "I'm stuck on how to pick the price steps.",
        reply:
          "Start smaller than you think. Take one product, write its lowest and highest price, and split the gap into 10. If you can list those ten prices by hand, you've written Rule 1.",
      },
      {
        say: 'How should I explain my sparse cutoff to Erik?',
        reply:
          'Lead with the number, then the reason, in one sentence. "8 weeks, because that covers two months of price changes." Managers love a decision they can repeat to their boss.',
      },
      {
        say: 'Can you check my plan before I submit?',
        reply:
          'Read it against the four requirements, out loud. Price rule with a step count? Revenue formula and three points? Two backup rules? An accuracy bar? If any answer is "sort of", fix that one first.',
      },
    ],
    replies: [
      {
        keywords: ['stuck', 'lost', 'confused', 'help'],
        text: 'Name the one requirement you are on, and the last thing you tried. That alone usually shows the next step.',
      },
      {
        keywords: ['nervous', 'scared', 'confidence', 'worried'],
        text: "That's normal on a first project. Erik isn't grading your confidence, he's grading your reasoning. Write the reason down and you'll feel steadier.",
      },
      {
        keywords: ['start', 'begin', 'first'],
        text: 'Open the meeting notes and underline every number in them. Those numbers are the spec.',
      },
      {
        keywords: ['submit', 'done', 'finished', 'ready'],
        text: 'Before you submit, tell Erik what you did and why in three sentences. Then hit Submit for review.',
      },
    ],
    fallbacks: [
      'What would a good answer to that look like? Describe it and we can work backwards.',
      "Try asking Erik that directly, then come back and tell me what he said. I'll help you read it.",
      'Break it into the smallest next step you could finish in ten minutes.',
    ],
  },

  requirements: [
    {
      title: 'A price rule with a set step count',
      steps: [
        "Open your Stage 1 price range table with Claude Code, and note each product's min and max price",
        'Write Rule 1 in the spec file, naming one step count, like 10 evenly spaced prices from min to max',
        'Run one flagged product through the rule by hand, you should be able to list every price it tries',
      ],
    },
    {
      title: 'The revenue formula and three revenue points',
      steps: [
        'Write revenue as price times the units the model predicts at that price',
        'Name the three points the merchant sees: last price, expected price and recommended price',
        'Check the recommended point really is the highest revenue on the price sweep',
      ],
    },
    {
      title: 'Two backup rules for odd products',
      steps: [
        'Sparse products: fall back to the last price and mark the fallback status',
        'Single-price products: keep the one price seen, since there is nothing to sweep',
      ],
    },
    {
      title: 'An accuracy bar the model must clear',
      steps: [
        'Beat the last-week baseline on every slice of the test weeks',
        'Price 100% of products with no blanks, every price inside its past range',
      ],
    },
  ],

  videos: [videos.shopifyKickoff],

  resources: ['Pricing Pilot Merchant Feedback'],

  notes: [
    {
      heading: 'Problem',
      items: [
        'Merchants pick prices by gut feel or copy competitors',
        'Two ways to lose: priced too low (sold out), priced too high (buyers go to competitors)',
        'No merchant intelligence built on the sales history of customers',
        'Cost to Shopify: merchants sell less, gross merchandise volume drops, and unhappy merchants leave',
      ],
    },
    {
      heading: 'Outcome',
      items: [
        'A recommended price from an XGBoost demand model',
        'Units sold at any price and revenue at 3 prices',
        'The model makes smaller mistakes than simply guessing',
        'Train on earlier weeks and test on later ones',
        'Beat last week on every slice, price 100% of products with no blanks, every price inside its past range',
      ],
    },
    {
      heading: 'Deliverable',
      items: [
        'Recommended, expected and last price',
        "Fallback status when the model can't produce a price",
        'Revenue at 3 prices and a price sweep graph',
        'A Streamlit app suggesting a price for each product',
        'A test on unseen weeks comparing prediction error against the baseline',
      ],
    },
    {
      heading: 'Stack',
      items: [
        'Python and pandas for units sold and weekly price per product',
        'XGBoost for the demand model',
        'Streamlit for the merchant app',
      ],
    },
  ],

  review: {
    summary:
      'Solid first spec. Your price rule is concrete and the backup rules cover the odd products. Next time, show the baseline comparison as a table so I can read it in five seconds.',
    scores: { insight: 0.8, quality: 0.75, communication: 0.7, reliability: 0.85 },
    xp: 150,
  },
};
