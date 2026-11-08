import { createContext, use } from 'react';

export const TourContext = createContext(null);

export function useTour() {
  const tour = use(TourContext);
  if (!tour) throw new Error('useTour must be used inside the onboarding tour');
  return tour;
}
