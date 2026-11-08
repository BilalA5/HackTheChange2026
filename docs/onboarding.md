# Onboarding

Four screens that turn a learner's goal into a plan, served at `/onboarding/:step`. Source:
`src/features/onboarding/`.

| #   | Step             | Screen                                              |
| --- | ---------------- | --------------------------------------------------- |
| 1   | `role`           | What do you want to be? Pick a role or type one     |
| 2   | `starting-point` | Where you're starting from                          |
| 3   | `pace`           | Hours a week, with the plan length it gives         |
| 4   | `plan`           | The plan, phase by phase, then Start my plan → /app |

## Moving through it

- Continue, or the right arrow key, moves on once the question is answered. Back and the left arrow go back.
- Start my plan saves the plan, marks the learner as onboarded and lands on `/app`.
- "Change my goal" in the account menu reopens `role` with the current answers filled in.

## How it is built

- **Canvas:** every screen draws on a fixed 1600 x 840 canvas, scaled to fit the window (`components/Stage.jsx`).
- **Navigation:** `OnboardingPage.jsx` reads the step from the URL and shares `next`, `prev`, `finish` and the
  answers through `TourContext` (`tour.js`).
- **Questions:** `components/Question.jsx` is the frame the three questions share; the options live in
  `src/features/plan/questions.js`.
- **Styles:** colours, type and the raised key buttons are Tailwind tokens (`tailwind.config.js`) and classes in
  `onboarding.css`, scoped to the route.
