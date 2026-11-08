import airbnb from './airbnb.js';
import shopify from './shopify.js';

const upcoming = [
  {
    id: 'doordash-delivery-times',
    company: 'DoorDash',
    logo: '/assets/onboarding/sc-logo-doordash.svg',
    shortTitle: 'Cutting Late Deliveries',
    summary: 'Find where dinner-rush deliveries lose the most time.',
    unlockLevel: 2,
    map: { x: 56.4, y: 27.8 },
  },
  {
    id: 'netflix-offline-recommendations',
    company: 'Netflix',
    logo: '/assets/onboarding/sc-logo-netflix.svg',
    shortTitle: 'Offline Recommendations',
    summary: 'Prototype recommendations that work without a connection.',
    unlockLevel: 3,
    map: { x: 65.5, y: 42.2 },
  },
  {
    id: 'spotify-podcast-retention',
    company: 'Spotify',
    logo: '/assets/onboarding/logo-spotify.svg',
    shortTitle: 'Podcast Retention',
    summary: 'Work out why new listeners stop after one episode.',
    unlockLevel: 5,
    map: { x: 66.3, y: 58.9 },
  },
];

export const playable = [airbnb, shopify];

export const scenarios = [...playable, ...upcoming.map((scenario) => ({ ...scenario, comingSoon: true }))];

export function getScenario(id) {
  return playable.find((scenario) => scenario.id === id) ?? null;
}
