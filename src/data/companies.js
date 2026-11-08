const logo = (slug) => `/assets/logos/on-dark/${slug}.svg`;

/**
 * Companies with a building on the campus printed in the middle of the board. `map` is the building's
 * position in percent of the 1671 x 941 campus image.
 */
export const companies = {
  openai: { name: 'OpenAI', logo: logo('openai'), map: { x: 21.4, y: 12 } },
  netflix: { name: 'Netflix', logo: logo('netflix'), map: { x: 89, y: 62 } },
  stripe: { name: 'Stripe', logo: logo('stripe'), map: { x: 82.9, y: 33 } },
  airbnb: { name: 'Airbnb', logo: logo('airbnb'), map: { x: 18, y: 32 } },
  amazon: { name: 'Amazon', logo: logo('amazon'), map: { x: 14.5, y: 69 } },
  samsung: { name: 'Samsung', logo: logo('samsung'), map: { x: 63.7, y: 39 } },
  ibm: { name: 'IBM', logo: logo('ibm'), map: { x: 35, y: 39 } },
  adobe: { name: 'Adobe', logo: logo('adobe'), map: { x: 50.3, y: 54 } },
  uber: { name: 'Uber', logo: logo('uber'), map: { x: 37.4, y: 76 } },
  linkedin: { name: 'LinkedIn', logo: logo('linkedin'), map: { x: 14.7, y: 46 } },
  nike: { name: 'Nike', logo: logo('nike'), map: { x: 59.2, y: 16 } },
  apple: { name: 'Apple', logo: logo('apple'), map: { x: 80.2, y: 16 } },
  meta: { name: 'Meta', logo: logo('meta'), map: { x: 38.6, y: 14 } },
  notion: { name: 'Notion', logo: logo('notion'), map: { x: 86.2, y: 50 } },
  shopify: { name: 'Shopify', logo: logo('shopify'), map: { x: 63.7, y: 76 } },
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
