# Onboarding tour

"How Flint works": thirteen screens from sign-in to the first scenario, served at `/onboarding/:step`.
Source: `src/features/onboarding/`.

## Screens

| #   | Step             | Screen                                                        |
| --- | ---------------- | ------------------------------------------------------------- |
| 1   | `sign-in`        | The city, drifting clouds and the glass sign-in card          |
| 2   | `welcome`        | The guide and the microphone, camera and screen keys          |
| 3   | `draw`           | Draw a circle to enter                                        |
| 4   | `your-world`     | The world map with scenario pins                              |
| 5   | `brief`          | Project brief; the tabs scroll to their sections              |
| 6   | `kickoff`        | The kickoff call card                                         |
| 7   | `understanding`  | Proof of understanding: voice notes and "Try saying this"     |
| 8   | `workspace`      | Stage panel and chat with the manager                         |
| 9   | `feedback`       | The draft attached, ready to submit                           |
| 10  | `presentation`   | Final presentation call with the panel                        |
| 11  | `portfolio`      | The learner's portfolio                                       |
| 12  | `get-hired`      | The job board                                                 |
| 13  | `first-scenario` | Back in the world: Airbnb is ready, and it opens `/workspace` |

## Moving through it

- The arrow keys and the step bar's arrows move between screens. The close button returns to `/`.
- The call to action on each screen moves on: Sign in, Start, Join Now, Submit.
- On `draw`, drawing a closed loop enters.
- On `understanding`, holding Space for about a second answers.

## How it is built

- **Canvas:** every screen draws on a fixed 1600 x 840 canvas, scaled to fit the window (`components/Stage.jsx`).
  Full-screen backgrounds use `.bleed` to reach the window edges.
- **Player:** in-scenario screens sit inside `components/Player.jsx`, which draws the glass frame, the caption or
  "Your turn" prompt, the skill points and the step bar.
- **Navigation:** `OnboardingPage.jsx` reads the step from the URL and shares `next`, `prev` and `exit` through
  `TourContext` (`tour.js`).
- **Content:** copy, the guide, the learner and the Airbnb case study are in `content.js`; the job board rows are
  in `jobs.js`.
- **Styles:** colours, type and the raised key buttons are Tailwind tokens (`tailwind.config.js`) and classes in
  `onboarding.css`, scoped to the route.

Voice-over and the timed animations between steps are not included.
