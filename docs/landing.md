# Landing page

The Flint landing page, served at `/`. Source: `src/features/landing/`.

## Sections

- **Hero** (`Hero.jsx`): the Flint wordmark and a Log in link, the Alberta headline with Start a project and See the
  roles, and the Energy Analyst brief: AESO average pool prices for 2023 to 2025 as bars that grow in. Below it,
  the province's industries as chips.
- **Roles** (`Roles.jsx`):
  - The row of cards holds still and scrolls sideways as you scroll down.
  - The field tabs filter the roles. Popular leads with the roles in demand in Alberta, starting with Energy Analyst.
  - A role with a `chart` draws its card from the data instead of a poster.
  - Clicking a card turns it over to show what you ship and the tools.
- **Learn by doing the work** (`Learn.jsx`):
  - The title stays at the top while four steps pass under it.
  - Its words change colour from grey to green to ink as you scroll.
  - A line is drawn down a rail beside each step's title.
  - The manager, coach and portfolio windows are screenshots of the Flint app running the Coulee Power brief.
- **Ready for your first offer.** (`End.jsx`): the same colour wave, with an offer letter that opens between
  "first" and "offer." and is signed at the end.
- **Footer** (`End.jsx`): Flint World. Colour spreads out from the centre as it scrolls in, and Enter Flint
  opens the app.
- **Dock** (`Dock.jsx`): fixed at the bottom of the screen.
  - Start opens the app.
  - The menu has Home and Log in.
  - "?" opens Ask Flint, which answers typed questions from `faq.js` by keyword.

## Data

- `src/data/roles.js`: the role catalogue (fields, posters or charts, projects and tools).
- `faq.js`: the Ask Flint questions, answers and the keywords that match them.
- The Energy Analyst figures come from the AESO Annual Market Statistics reports for 2024 and 2025.

## Notes

- The footer colour spread is a growing radial mask.
- The workspace and portfolio windows (`public/assets/protos/`) are screenshots of the app. Retake them if the
  workspace or portfolio layout changes.
- Scrolling is native; the scroll-driven effects use the hooks in `hooks.js`.
