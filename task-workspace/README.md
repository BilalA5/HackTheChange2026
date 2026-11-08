# Task workspace: React recreation

A local React + Tailwind recreation of a dark three-column task workspace
(`reference/reference.png`): the task brief on the left, a chat with the
manager in the middle and the meeting notes viewer on the right. It is matched
at a 1710x1074 viewport.

## Run

```sh
pnpm install
pnpm dev
```

Open http://127.0.0.1:5180. Build for production with `pnpm build`.

## How it was made

The local screenshot-to-code backend could not generate this page: its Codex
subscription returned a usage-limit error until Nov 18, 2026. `src/` was written
by hand instead, in the same layout as the other screen2code outputs.

To try the generator after the limit resets, run
`~/Desktop/screen2code/.runtime/generate-workspace.py` from
`screen2code/screenshot-to-code/backend` with `poetry run python`. It writes
`generated.html` and does not change `src/`.

`~/Desktop/screen2code/.runtime/compare-workspace.py` renders the page at 2x
and stacks crops of the screenshot over the render.

## Files

- `src/App.jsx`: all components, content and interactions.
- `src/index.css`: Tailwind directives, colour tokens, fades and list bullets.
- `public/images/`: the Shopify logo and two avatars, cut from the screenshot
  by `.runtime/extract-workspace-assets.py`.
- `reference/`: the screenshot at 1x and 2x, for comparison only.

## What works

- Requirement rows open and close.
- "Meeting notes" under Project resources reopens the notes panel, and the
  panel's back arrow closes it.
- The notes viewer zooms from 50% to 200%, resets, and downloads the notes as
  Markdown.
- The time options are selectable, and the GitHub link opens in a new tab.
- The chat opens at the same scroll position as the screenshot, and you can
  scroll up and down.

## Approximations and placeholders

- Fonts: Google Sans and Geist Mono from Google Fonts. Text sizes were tuned
  against the screenshot. Most lines wrap where the original's do, but a few
  wrap one word differently.
- Icons are hand-drawn SVGs.
- The screenshot only shows these parts, so they are placeholder copy written
  from the rest of the page:
  - the bullets inside the three closed requirements
  - the start of Erik's first message, and the question above it
  - the full names behind the two truncated resources
  - the hidden "Stack" section at the bottom of the notes, except its first bullet
- Below 1280px the three columns stack. That layout is my own, since the
  screenshot shows only one width.

The page uses Shopify's logo and two people's photos. Treat it as a private
study and replace them before any public use.
