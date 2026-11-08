# Proofwork design language

Proofwork is a clean-room desktop app with the same product essence as a commercial AI job-simulation app we studied: you work through realistic projects with an AI manager.
**Never copy that app's name, logo, artwork, copy, fonts or real company brands.** All companies are fictional.

## What to keep (the essence)
- Home = a **map of a city district**. Each fictional company is a building. On the right is a **glass card carousel** (`01 / 03`, prev/next) for the current career's projects. The active card shows Performance, Time spent and XP earned, plus a big **Continue** pill. Locked cards show "Earn up to N XP · ~3 hr · Intermediate".
- **Left rail**: a vertical glass pill of icon buttons (Home, Training, Jobs (locked until 1 project is done), Portfolio, Vision board) with Settings at the bottom.
- **Bottom dock**: a horizontal timeline of company nodes, ending with a Job Portal node.
- **Top right**: a level pill with a sparkle, `L0`. It opens the XP popover: level, XP into the level, XP to the next level, and held XP ("N XP waiting — prove you understood the brief to unlock them").
- **Meeting and Proof of Understanding screens** use a warm paper background. They have chat-like voice bubbles (play button, waveform, duration, a "TRANSCRIPT ⌄" toggle), a "HOLD SPACE TO TALK" mic button at the bottom, and a **Meeting Notes** card on the right with serif section headings (Problem / Outcome / Process).
- **Stage workspace**: Plan and Do modes are dark (#17181C); Learn mode is light paper.
- **Rubric**: everywhere it shows four axes (Understanding, Quality, Communication, Independence), each Below / Meeting / Exceeding with a one-line rationale.

## What changes (our own look)
- **Map**: a stylised flat-shaded isometric district drawn in SVG (no photos). It has dusk colours: deep teal water `#0E3B43`, sand `#E9D8B4`, park greens, slate roads. Each building's silhouette type and accent colour come from `Company.building` / `Company.color`. The active project gets a **violet pulse ring and a beam**, not a green light column.
- **Accent**: signal violet `#7B6CF6` (hover `#8F82FF`). XP gold `#F5C451`. Success mint `#3DD68C`. Warning amber `#F2A33A`. Danger `#F0605D`.
- **Surfaces**:
  - Dark glass: `rgba(18,20,26,0.72)`, `backdrop-filter: blur(24px) saturate(140%)`, 1px border `rgba(255,255,255,0.08)`, radius 28px.
  - Paper: `#F4F1EA`, with cards `#FFFFFF`, radius 22px, shadow `0 1px 0 rgba(0,0,0,.04), 0 12px 32px -12px rgba(30,25,10,.18)`.
  - Ink text `#1A1B1F`; muted `#6B6A66` on paper and `#9BA0AA` on dark.
- **Type**:
  - UI: Inter Variable (`@fontsource-variable/inter`).
  - Labels and metrics: JetBrains Mono Variable, UPPERCASE, 11–12px, letter-spacing .08em.
  - Editorial headings (notes, brief, meeting slides): Fraunces Variable.
- **Buttons**: pill shaped.
  - `primary`: violet fill, white text.
  - `light`: white fill, ink text. This is the big Continue.
  - `glass`: translucent. `ghost`. `danger`.
  - Sizes: sm 32px, md 40px, lg 52px.
- **Motion**: the `motion` library. Use 180–260 ms ease-out or springs (stiffness 380, damping 32). Carousel slides cross-fade with an x offset. Timeline nodes stagger in.
- **Icons**: `lucide-react`, stroke 1.75.
- **Avatars**: NPCs have no photos. Use a generated gradient disc (from `avatarSeed`) with initials.

## Layout rules
- Desktop window minimum is 1100×720. Pages must not scroll horizontally.
- The Electron shell draws a 44px title bar above the app view (traffic lights, back, title, credits pill, support, bell). In a plain browser the renderer draws the same bar (`WebTitlebar`). Pages never render their own credits pill or bell.
- Overlay surfaces (`?surface=pip|hud|island|cowork|recordbar|camera|region`) have **transparent** `html/body` backgrounds. They draw their own rounded glass containers.

## Tailwind v4 tokens
These are defined in `apps/renderer/src/styles/app.css` under `@theme`:
- Colours: `--color-accent`, `--color-accent-hover`, `--color-xp`, `--color-success`, `--color-warning`, `--color-danger`, `--color-ink`, `--color-muted`, `--color-paper`, `--color-paper-card`, `--color-night`, `--color-night-2`, `--color-glass`, `--color-line`.
- Fonts: `--font-sans`, `--font-mono`, `--font-serif`.
- Radii: `--radius-card` 22px, `--radius-glass` 28px.

Use the classes these tokens generate, e.g. `bg-accent`, `text-muted`, `font-mono`, `rounded-card`. Avoid raw hex values in components.
