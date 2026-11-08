# Landing page

The Flint landing page, served at `/`. Source: `src/features/landing/`.

## Sections

- **Hero** (`Hero.jsx`): the pale city with the Flint mark. Scrolling zooms into the mark until its black fills
  the screen, then "5,000+ companies hiring in our talent network." appears over two rows of company wordmarks
  drifting in opposite directions.
- **Roles** (`Roles.jsx`):
  - The row of cards holds still and scrolls sideways as you scroll down.
  - The field tabs filter the roles.
  - Hovering a popular role plays its film, and the speaker button turns its sound on.
  - Clicking a card turns it over to show what you ship, the tools, and a Start button for that role.
- **Learn the job by doing it** (`Learn.jsx`):
  - The title stays at the top while four steps pass under it.
  - Its words change colour from grey to green to ink as you scroll.
  - A line is drawn down a rail beside each step's title.
- **You learn. We match.** (`Match.jsx`): ten companies pop in on either side of a portfolio, joined to it by
  lines, while a Level counter rolls from 1 to 10.
- **Built to get you hired.** (`End.jsx`): the same colour wave, with an offer letter that opens between "you"
  and "hired." and is signed at the end.
- **Footer** (`End.jsx`): Flint World. Colour spreads out from the centre as it scrolls in, and Enter Flint
  opens the onboarding tour.
- **Dock** (`Dock.jsx`): fixed at the bottom of the screen.
  - Start opens the onboarding tour.
  - The menu has Home, How Flint works and Workspace.
  - "?" opens Ask Flint, which answers typed questions from `faq.js` by keyword.
- **Narration** (`ui.jsx`): every round avatar plays the guide's voice line for that section. Only one plays at
  a time.

## Data

- `data.js`: the role catalogue (fields, posters, films and tools).
- `faq.js`: the Ask Flint questions, answers and the keywords that match them.

## Notes

- The hero pulse and the footer colour spread are CSS: a zoom with a black fade, and a growing radial mask.
- The team and coach windows are still screenshots (`public/assets/protos/`).
- Scrolling is native; the scroll-driven effects use the hooks in `hooks.js`.
