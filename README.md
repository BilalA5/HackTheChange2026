# Flint

Learn a job by doing it. Flint is a Vite + React app with three parts:

| Route                        | What it is                                                           | Docs                                     |
| ---------------------------- | -------------------------------------------------------------------- | ---------------------------------------- |
| `/`                          | The landing page                                                     | [docs/landing.md](docs/landing.md)       |
| `/login`                     | Log in with a name and email                                         | [docs/app.md](docs/app.md)               |
| `/onboarding/:step`          | "How Flint works", the tour a new learner sees after logging in      | [docs/onboarding.md](docs/onboarding.md) |
| `/app`                       | The world: every scenario on a map, with its manager and coach       | [docs/app.md](docs/app.md)               |
| `/app/scenarios/:scenarioId` | The workspace: brief, chat with the manager and coach, meeting notes | [docs/workspace.md](docs/workspace.md)   |
| `/app/portfolio`             | Reviewed projects and skill scores                                   | [docs/app.md](docs/app.md)               |

Landing → login → tour (first time only) → app. Everything after login is stored in the browser for now; see
[docs/app.md](docs/app.md) for where the backend plugs in.

## Run

```sh
pnpm install
pnpm dev
```

Open http://localhost:3000.

| Script         | Does                               |
| -------------- | ---------------------------------- |
| `pnpm dev`     | Starts the dev server on port 3000 |
| `pnpm build`   | Builds to `dist/`                  |
| `pnpm preview` | Serves the build on port 3000      |
| `pnpm lint`    | Runs ESLint                        |
| `pnpm format`  | Formats with Prettier              |

## Layout

```
src/
  main.jsx              entry
  router.jsx            routes, each loaded on demand
  pages/NotFound.jsx
  shared/useAppTheme.js scopes each app's page styles to its route
  styles/               Tailwind base and font faces
  features/
    app/          world, portfolio and the app layout
    auth/         login, session and the signed-in guard
    landing/
    onboarding/
    workspace/    the scenario workspace
  data/scenarios/       scenarios, with their manager and coach
  services/             auth, chat, progress and conversations (the backend seam)
public/assets/          images, fonts, films and voice clips
docs/                   notes per feature and reference screenshots
```

Each feature tags `<html data-app="…">` while it is mounted, so its page-level styles (background, fonts,
scrolling) do not leak into the others.

## Stack

React 19, React Router 7, Vite 7, Tailwind CSS 3, ESLint 9 and Prettier 3.
