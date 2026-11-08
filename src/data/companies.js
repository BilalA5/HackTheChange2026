const logo = (slug) => `/assets/logos/on-dark/${slug}.svg`;

/**
 * Companies with a headquarters on the city map. `map` is the building's position in percent of the
 * 1800 x 1012 city image, so pins land on the right rooftop at any window size.
 */
export const companies = {
  openai: { name: 'OpenAI', logo: logo('openai'), map: { x: 40.6, y: 60.5 } },
  netflix: { name: 'Netflix', logo: logo('netflix'), map: { x: 61.6, y: 40 } },
  stripe: { name: 'Stripe', logo: logo('stripe'), map: { x: 66.4, y: 69 } },
  airbnb: { name: 'Airbnb', logo: logo('airbnb'), map: { x: 55.8, y: 59.5 } },
  amazon: { name: 'Amazon', logo: logo('amazon'), map: { x: 38.4, y: 45.5 } },
  samsung: { name: 'Samsung', logo: logo('samsung'), map: { x: 45.6, y: 59 } },
  ibm: { name: 'IBM', logo: logo('ibm'), map: { x: 35.6, y: 54.5 } },
  adobe: { name: 'Adobe', logo: logo('adobe'), map: { x: 24.8, y: 80 } },
  uber: { name: 'Uber', logo: logo('uber'), map: { x: 52.4, y: 65.5 } },
  linkedin: { name: 'LinkedIn', logo: logo('linkedin'), map: { x: 31.2, y: 63.5 } },
  nike: { name: 'Nike', logo: logo('nike'), map: { x: 82, y: 46.5 } },
  apple: { name: 'Apple', logo: logo('apple'), map: { x: 54.6, y: 39.5 } },
  meta: { name: 'Meta', logo: logo('meta'), map: { x: 68, y: 41.5 } },
  notion: { name: 'Notion', logo: logo('notion'), map: { x: 79, y: 51 } },
  shopify: { name: 'Shopify', logo: logo('shopify'), map: { x: 43.2, y: 88 } },
};

const affinity = {
  ai: ['openai', 'meta', 'apple', 'samsung', 'notion', 'ibm'],
  technology: ['stripe', 'uber', 'apple', 'amazon', 'ibm', 'meta'],
  product: ['notion', 'airbnb', 'adobe', 'apple', 'stripe', 'uber'],
  data: ['netflix', 'uber', 'amazon', 'linkedin', 'stripe', 'meta'],
  business: ['amazon', 'nike', 'airbnb', 'ibm', 'uber', 'linkedin'],
  finance: ['stripe', 'amazon', 'ibm', 'apple', 'netflix', 'nike'],
  sales: ['linkedin', 'notion', 'stripe', 'amazon', 'meta', 'adobe'],
  games: ['samsung', 'netflix', 'apple', 'meta', 'adobe', 'amazon'],
  care: ['apple', 'ibm', 'linkedin', 'adobe', 'amazon', 'notion'],
};

/** The companies a learner in `section` meets, most relevant first, every company exactly once. */
export function companiesFor(section) {
  const preferred = affinity[section] ?? [];
  const rest = Object.keys(companies).filter((id) => !preferred.includes(id));
  return [...preferred, ...rest];
}
