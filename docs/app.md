# The app

Everything behind login: `/app` (the world and the scenario list), `/app/portfolio` and
`/app/scenarios/:scenarioId` (the workspace where you talk to your manager and coach).

## Flow

1. `/login` takes a name and an email. A first-time learner goes to the tour at `/onboarding`; a returning one goes
   to `/app`.
2. Finishing or leaving the tour marks the learner as onboarded and lands on `/app`.
3. `/app` shows the world map. Pick a ready scenario and press Start.
4. In the scenario, switch between the manager and the coach at the top of the chat. Type, or use the "Try saying"
   lines to run the scripted demo.
5. Submit for review. The manager replies with a review card, the learner earns XP, and the project appears in the
   portfolio.

Reset demo in the sidebar clears the learner's progress and chats, so a demo can be run again from the start.

## Scenarios

Each playable scenario is one file in `src/data/scenarios/`:

- `manager` and `coach`: name, photo, `opening` messages, a `script` of demo lines with their replies, keyword
  `replies` for free typing, and `fallbacks`.
- `requirements`, `resources` and `notes` fill the workspace sidebar and the notes viewer.
- `review` is what the manager returns on submit: a summary, four skill scores and the XP earned.
- `map` places the scenario's pin on the world map, in percent of the city image.

Add a scenario by adding a file and listing it in `src/data/scenarios/index.js`. Upcoming scenarios there show as
locked pins.

## Where the backend goes

All data access goes through `src/services/`. Each function is async and stores data in `localStorage` for now, so
a backend can replace the function bodies without touching the UI.

| Service            | Function                                               | Backend equivalent                 |
| ------------------ | ------------------------------------------------------ | ---------------------------------- |
| `auth.js`          | `getSession`, `signIn`, `updateUser`, `signOut`        | Session and user endpoints         |
| `chat.js`          | `requestReply({ scenarioId, persona, text, history })` | `POST /api/chat` (scripted or LLM) |
| `chat.js`          | `requestReview({ scenarioId })`                        | `POST /api/reviews`                |
| `progress.js`      | `getProgress`, `completeScenario`, `resetProgress`     | `GET/POST /api/progress`           |
| `conversations.js` | `loadConversation`, `saveConversation`                 | `GET/PUT /api/conversations/:id`   |

`progress.js` also notifies subscribers when progress changes; `useProgress` reads it with `useSyncExternalStore`.
With a backend, keep that cache and refresh it after each request.
