export const project = {
  title: 'Building a Black Friday Price Recommender at Shopify',
  task: 'Draft the merchant-ready price recommender spec',
  repo: 'https://github.com/BilalA5/Shopify-Black-Friday-Price-Recommender',
};

export const manager = { name: 'Erik Vogt', role: 'Manager', photo: '/assets/workspace/avatar-erik.png' };

export const badges = [
  { glyph: 'bulb', progress: 0.3, label: 'Insight' },
  { glyph: 'star', progress: 0.45, label: 'Quality' },
  { glyph: 'chat', progress: 0.3, label: 'Communication' },
  { glyph: 'shield', progress: 0.5, label: 'Reliability' },
];

export const requirements = [
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
];

export const durations = ['30 minutes', '45 minutes', '1 hour', '2 hours'];

export const notes = [
  {
    heading: 'Problem',
    items: [
      'Merchants pick prices by gut feel or copy by competitors',
      'Two ways to lose : priced too low (sold out), priced too high (buy competitors)',
      'No Merchant Intelligence based on sales history of customers',
      'Cost to Shopify: merchants sell less, gross merchandise volume drops, and unhappy merchants leave.',
    ],
  },
  {
    heading: 'Outcome',
    items: [
      'Recommended Price XGBoost Demand Model',
      'Units sold at any price and revenue at 3 prices',
      'Model makes smaller mistakes than simply guessing',
      'Train on earlier weeks and test on later ones',
      'Must beat last week on every slice and 100% of products priced no blanks, Every price inside its past range',
      'Black Friday price recommender app: a Streamlit app suggesting a price for each product.',
    ],
  },
  {
    heading: 'Deliverable',
    items: [
      'Recommended, Expected and Last PRice',
      'Fallback status when a model cant product a price',
      'Revenue at 3 prices',
      'Price Sweep Graph',
      'Black Friday price recommender app: a Streamlit app suggesting a price for each product.',
      'Tests model on unseen weeks and compares prediction error against baseline to prove model value.',
    ],
  },
  {
    heading: 'Stack',
    items: [
      'Python and pandas for units sold and week price ber product',
      'XGBoost for the demand model',
      'Streamlit for the merchant app',
    ],
  },
];
