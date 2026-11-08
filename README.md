# Flint

Learn a job by doing it. Flint is a Vite + React app with three parts:

| Route               | What it is                                                           | Docs                                     |
| ------------------- | -------------------------------------------------------------------- | ---------------------------------------- |
| `/`                 | The landing page                                                     | [docs/landing.md](docs/landing.md)       |
| `/onboarding/:step` | "How Flint works", a 13-screen tour from sign-in to a first scenario | [docs/onboarding.md](docs/onboarding.md) |
| `/workspace`        | A task workspace: brief, chat with the manager and meeting notes     | [docs/workspace.md](docs/workspace.md)   |

The landing page's Start key and Enter Flint open the tour, and the tour's last screen opens the workspace.

## Run

```sh
pnpm install
pnpm dev
```

Open http://127.0.0.1:30000.

| Script         | Does                                |
| -------------- | ----------------------------------- |
| `pnpm dev`     | Starts the dev server on port 30000 |
| `pnpm build`   | Builds to `dist/`                   |
| `pnpm preview` | Serves the build on port 30000      |
| `pnpm lint`    | Runs ESLint                         |
| `pnpm format`  | Formats with Prettier               |

## Layout

```
src/
  main.jsx              entry
  router.jsx            routes, each loaded on demand
  pages/NotFound.jsx
  shared/useAppTheme.js scopes each app's page styles to its route
  styles/               Tailwind base and font faces
  features/
    landing/
    onboarding/
    workspace/
public/assets/          images, fonts, films and voice clips
docs/                   notes per feature and reference screenshots
```

Each feature tags `<html data-app="…">` while it is mounted, so its page-level styles (background, fonts,
scrolling) do not leak into the others.

## Stack

React 19, React Router 7, Vite 7, Tailwind CSS 3, ESLint 9 and Prettier 3.
