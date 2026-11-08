// Deterministic keyword utilities. Used by the mock engine (offline practice mode) and by the
// live engine's fallbacks. No model calls happen here.

const STOPWORDS = new Set(
  (
    "the and for are but not you your yours with this that these those from have has had was were " +
    "will would should could can cannot into onto about over under then than there their they them " +
    "what when where which who whom whose why how our ours its it's also just more most some any all " +
    "each such very only own same too out off via per may might must shall let let's etc one two " +
    "use using used make made get got here we're they're i'm i've don't doesn't isn't aren't his her " +
    "she him he been being while because so if or nor yet"
  ).split(/\s+/),
);

/** Lowercase alphanumeric words of 3+ characters, minus stopwords. */
export function tokenise(text: string): string[] {
  const words = text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return words.filter((w) => w.length >= 3 && !STOPWORDS.has(w));
}

/** Crude suffix stripper. Applied identically to text and phrases, so matching stays consistent. */
export function stem(word: string): string {
  let s = word;
  if (s.length > 5 && s.endsWith("ing")) s = s.slice(0, -3);
  else if (s.length > 4 && s.endsWith("ed")) s = s.slice(0, -2);
  else if (s.length > 4 && s.endsWith("ly")) s = s.slice(0, -2);
  else if (s.length > 3 && s.endsWith("s") && !s.endsWith("ss")) s = s.slice(0, -1);
  if (s.length > 4 && s.endsWith("e")) s = s.slice(0, -1);
  return s;
}

/** Unique stemmed keywords of a phrase. */
export function keywordsOf(phrase: string): string[] {
  return [...new Set(tokenise(phrase).map(stem))];
}

export function stemSet(text: string): Set<string> {
  return new Set(tokenise(text).map(stem));
}

/**
 * A rubric point is covered when at least 50% of its keywords appear in the text
 * (minimum 1; for points with 4+ keywords, at least 2).
 */
export function coverage(text: string, points: string[]): { covered: string[]; missing: string[] } {
  const present = stemSet(text);
  const covered: string[] = [];
  const missing: string[] = [];
  for (const point of points) {
    const kws = keywordsOf(point);
    if (kws.length === 0) {
      missing.push(point);
      continue;
    }
    const hits = kws.filter((k) => present.has(k)).length;
    let need = Math.max(1, Math.ceil(kws.length * 0.5));
    if (kws.length >= 4) need = Math.max(need, 2);
    (hits >= need ? covered : missing).push(point);
  }
  return { covered, missing };
}

/** Number of keywords of `query` that appear in `text`. */
export function overlap(text: string, query: string): number {
  const present = stemSet(text);
  return keywordsOf(query).filter((k) => present.has(k)).length;
}

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function sentencesOf(text: string): string[] {
  return text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Top-n items by keyword overlap with the query, returned in their original order. */
export function pickBest(items: string[], query: string, n: number): string[] {
  const scored = items
    .map((text, i) => ({ text, i, score: overlap(text, query) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .slice(0, n)
    .sort((a, b) => a.i - b.i);
  return scored.map((x) => x.text);
}

export function shortPhrase(text: string, words = 8): string {
  const parts = text.trim().replace(/[.;:!?]+$/, "").split(/\s+/);
  return parts.length <= words ? parts.join(" ") : `${parts.slice(0, words).join(" ")}…`;
}

export function lowerFirst(s: string): string {
  return s.length ? s[0].toLowerCase() + s.slice(1) : s;
}

export function capitalise(s: string): string {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

/** Split a string into word-sized chunks, keeping whitespace so concatenation reproduces the text. */
export function wordChunks(text: string): string[] {
  return text.match(/\S+\s*|\s+/g) ?? [];
}

export function plural(n: number, word: string, pluralForm = `${word}s`): string {
  return `${n} ${n === 1 ? word : pluralForm}`;
}
