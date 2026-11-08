# Zero landing page: React recreation

A React + Tailwind recreation of the learnwithzero.com landing page, built from
the full-page capture in `reference/` (3400x23922 at 2x, so 1700px wide).

## Run

```sh
pnpm install
pnpm dev
```

Open http://127.0.0.1:5182. Build for production with `pnpm build`.
`~/Desktop/screen2code/start-all.sh` also starts it, along with the other projects.

## How it was made

The local screenshot-to-code generator was unavailable: its Codex usage limit
resets on Nov 18, 2026. The page was written by hand instead.

The full-page capture could not be used as-is:

- **The fixed dock was copied over the content.** The capture tool repeated the
  Start bar about 15 times, and it covers the role cards and the step windows.
- **The scroll animations never ran.** The capture shows empty stretches where
  the hero line, the "5,000+ companies" screen and the "You learn. We match."
  stage should be.

So the artwork, copy and data come from the live site at learnwithzero.com.

- **Artwork and media:** images, the font, role posters, the films of the 7
  popular roles, and Navid's voice lines.
- **Text and data:** the role list, fields, tool icons and the Ask Zero answers,
  parsed as text from the site's script and never run.

The team and coach windows are screenshots of the live prototypes
(`/protos/team.html` and `/protos/workspace.html`), taken by
`.runtime/zero-shoot-protos.py`. Everything else is written from scratch.

Helper scripts are in `~/Desktop/screen2code/.runtime/`:

- `zero-build-data.py` regenerates `src/data.js` from a saved copy of the
  site's script.
- `zero-shots.py` screenshots each stage of the page while scrolling. Pass a
  width and height for other sizes, for example `zero-shots.py 390 844`.

## What it does

- **Hero:** the pale city with the zero mark. Scrolling zooms into the mark
  until its black fills the screen. Then "5,000+ companies hiring in our talent
  network." appears, over two rows of company wordmarks drifting in opposite
  directions.
- **Roles:**
  - The row of cards holds still and scrolls sideways as you scroll down.
  - The field tabs filter the roles.
  - Hovering a popular role plays its film, and the speaker button turns its
    sound on.
  - Clicking a card turns it over to show what you ship, the tools, and a Start
    button for that role.
- **Learn the job by doing it:**
  - The title stays at the top while four steps pass under it.
  - Its words change colour from grey to green to ink as you scroll.
  - A line is drawn down a rail beside each step's title.
- **You learn. We match.:** ten companies pop in on either side of a portfolio,
  joined to it by lines, while a Level counter rolls from 1 to 10.
- **Built to get you hired.:** the same colour wave, with an offer letter that
  opens between "you" and "hired." and is signed at the end.
- **Footer:** Zero World. Colour spreads out from the centre as it scrolls in.
- **Dock:** fixed at the bottom of the screen.
  - Start opens learnwithzero.com.
  - The menu has Home, Letters and Why Zero.
  - "?" opens Ask Zero, which answers typed questions from the site's FAQ by
    keyword.
- **Narration:** every round avatar plays Navid's voice line for that section.
  Only one plays at a time.

## Differences from the live site

- The live site draws the hero pulse and the footer colour spread with WebGL.
  Here they are CSS: a zoom with a black fade, and a growing radial mask.
- The live team and coach windows are running prototype pages. Here they are
  still screenshots, so the live coach is Jessica as she appears today, which
  is not the same coach as in your capture.
- The live site uses Lenis smooth scrolling. This page uses native scrolling.
- The links to LinkedIn, Instagram and X go to each site's home page, because
  the capture doesn't show Zero's profile addresses.
- The Start key's credits counter and the job cards on the footer map are not
  included.

The images, films, voice clips and copy belong to Zero. Keep this recreation
private unless Zero agrees to it being published.
