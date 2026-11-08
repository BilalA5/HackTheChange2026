// Name pools for people, internal systems and company colours. Diverse by design: no single culture dominates.

export const FIRST_NAMES = [
  "Amara", "Tomas", "Mei-Lin", "Ravi", "Ingrid", "Kwame", "Sofia", "Hiro", "Fatima", "Lucas",
  "Nadia", "Diego", "Aisha", "Owen", "Yara", "Samuel", "Chloe", "Jun", "Priyanka", "Marcus",
  "Leila", "Tobias", "Ngozi", "Mateo", "Hannah", "Arjun", "Elena", "Kofi", "Sana", "Dmitri",
  "Rosa", "Ethan", "Mariam", "Lars", "Yuki", "Grace", "Felix", "Ana Paula", "Ibrahim", "Hana",
  "Noah", "Ruby", "Tariq", "Camila", "Sven", "Ifeoma", "Wei", "Beatriz", "Patrick", "Anjali",
];

export const LAST_NAMES = [
  "Okafor", "Herrera", "Chen", "Sundaram", "Lund", "Mensah", "Benali", "Tanaka", "Al-Sayed", "Brandt",
  "Petrova", "Morales", "Rahman", "Gallagher", "Haddad", "Adeyemi", "Dubois", "Park", "Nair", "Webb",
  "Karimi", "Keller", "Eze", "Ruiz", "Levy", "Mehta", "Rossi", "Asante", "Qureshi", "Volkov",
  "Delgado", "Brooks", "Diallo", "Nygaard", "Sato", "Oyelaran", "Moreau", "Souza", "Yusuf", "Kim",
  "Fischer", "Thompson", "Osman", "Vargas", "Holm", "Obi", "Zhang", "Lima", "Doyle", "Desai",
];

/** Internal system codenames, combined with a family noun such as "events warehouse". */
export const SYSTEM_NAMES = [
  "Beacon", "Quarry", "Tidewater", "Sextant", "Ledger", "Orbit", "Keystone",
  "Meridian", "Lantern", "Cinder", "Anchor", "Compass", "Summit", "Atlas",
];

export const COMPANY_COLORS = ["#E4572E", "#17A398", "#5B5FC7", "#C2185B", "#8D6E63", "#3949AB", "#00897B", "#F4511E"];

export const BUILDINGS = ["tower", "campus", "dome", "loft", "hangar", "spire"] as const;

export const TRAITS = [
  "warm but exacting",
  "dry and direct",
  "patient and precise",
  "brisk and practical",
  "funny and deliberate",
  "calm under pressure",
  "curious and blunt",
  "generous with time and strict on detail",
];

export const CARES = [
  "whether a number survives a skeptical reviewer",
  "the people who will live with the change",
  "the risk nobody has written down yet",
  "the deadline the business actually cares about",
  "clean reasoning more than clever shortcuts",
  "the customers who are hardest to serve",
];

export const PUSHBACK = [
  "someone skips the definition",
  "a plan has no owner",
  "the caveats are buried at the bottom",
  "a team claims a win without a baseline",
  "a fix is proposed before the cause is known",
];
