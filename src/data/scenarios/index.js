import airbnb from './airbnb.js';
import couleePower from './coulee-power.js';
import shopify from './shopify.js';

export const playable = [airbnb, shopify, couleePower];

export function getScenario(id) {
  return playable.find((scenario) => scenario.id === id) ?? null;
}

/** The hand-written scenario that opens a plan: the first whose `fits` lists the role's section. */
export function warmupFor(section) {
  return playable.find((scenario) => scenario.fits?.includes(section)) ?? airbnb;
}
