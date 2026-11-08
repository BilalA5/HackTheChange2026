# Landing page

The Flint landing page, served at `/`. One page, no sub-pages: the header links jump to sections on it, and every
call to action goes to `/login`. Source: `src/features/landing/`.

## Sections

1. **Hero:** "Learn a job by doing it" over the sky, with Start a project. The product frame shows the campus board
   with Avery's brief on top of it.
2. **How Flint works on every project** (`#how`): the manager briefs you on the AESO pool price drop; the coach
   steps in when you're stuck.
3. **A review on every project:** a reviewed project with what went well, what to fix and the four scores.
4. **Built for Alberta's next jobs:** your team, a draft-versus-review slider and your pace, then the tools.
5. **Pick the job you want** (`#roles`): the popular roles from `src/data/roles.js` with their first projects and
   tools.
6. **Work that counts:** a manager chat and three numbers, sourced from AESO Annual Market Statistics.
7. **FAQ** (`#faq`): questions from `faq.js`.
8. **Closing call to action and footer.**

## Files

- `LandingPage.jsx`: the sections.
- `parts.jsx`: icons, the Flint mark, and `Stage`, which draws a fixed-size mock and scales it to fit.
- `landing.css`: colour tokens, buttons and card surfaces, scoped to the route.
- `faq.js`: questions and answers.
- Images: `public/assets/landing/` and the campus at `public/assets/board/campus.jpg`.
