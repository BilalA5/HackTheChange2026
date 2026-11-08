// String helpers for generated copy. Generated text never contains em or en dashes (TTS reads them badly).

/**
 * Trims, collapses whitespace, replaces dashes with commas and removes braces (so user text can never
 * look like a template token). Use on every user-supplied string.
 */
export function clean(value: string | null | undefined): string {
  return (value ?? "")
    .replace(/[{}]/g, "")
    .replace(/\s*[–—]\s*/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
}

/** First `max` words of a cleaned string, without trailing punctuation. */
export function trimWords(value: string, max: number): string {
  return clean(value)
    .replace(/[.!?;:,]+$/, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, max)
    .join(" ");
}

export const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
export const lowerFirst = (s: string): string => s.charAt(0).toLowerCase() + s.slice(1);

/** Title-cases a role typed by the learner. Words that already carry capitals (UX, iOS) are kept. */
export function titleCase(value: string): string {
  const words = clean(value).split(" ").filter(Boolean);
  const letters = words.join("");
  const allCaps = letters.length > 0 && letters === letters.toUpperCase();
  return words
    .map((w) => {
      if (allCaps) return w.length <= 3 ? w : cap(w.toLowerCase());
      return /[A-Z]/.test(w.slice(1)) ? w : cap(w);
    })
    .join(" ");
}

export function commas(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

export function money(n: number): string {
  return `$${commas(n)}`;
}

/** "a" or "an" in front of a noun phrase. */
export function article(noun: string): string {
  return /^[aeiou]/i.test(noun) ? `an ${noun}` : `a ${noun}`;
}

/** "a, b and c". */
export function listOf(items: string[]): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Fills {token} placeholders. {a:token} adds an article. A capitalised token ({Metric}) capitalises the value.
 * An unknown token throws, so template typos fail loudly in tests instead of shipping "{typo}" to learners.
 */
export function fill(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(a:)?([A-Za-z][A-Za-z0-9]*)\}/g, (_m, art: string | undefined, key: string) => {
    const k = lowerFirst(key);
    const raw = vars[k];
    if (raw === undefined) throw new Error(`pathgen: unknown template token {${key}}`);
    const value = art ? article(raw) : raw;
    return key.charAt(0) !== key.charAt(0).toLowerCase() ? cap(value) : value;
  });
}
