# Proofwork

Proofwork is a desktop app where you learn a job by doing it. You pick a career and work through realistic projects at fictional companies, with an AI manager who briefs you, checks your understanding, plans with you, works beside you on your screen and grades what you ship.

It is a **clean-room rebuild** of a commercial AI job-simulation desktop app, re-implemented from our own behavioural notes on how that app works. It keeps the same essence and changes the look. No code, art, copy, fonts or brand from the original app were used, and every company in it is fictional.

![Home](docs/screenshots/06-home-map.png)

## What you can do in it

| Step | What happens | Screens |
|---|---|---|
| Sign in | Local email sign-in, or browser sign-in that returns through a `proofwork://` deep link | `01` |
| Onboarding | Server-driven steps: draw your dream job → chat (fills a vision board) → career match → roadmap → why → claim 10,000 credits | `02–05` |
| World map | A stylised isometric coastal district with one building per company, a project card carousel and a timeline dock ending in the job portal | `06`, `24` |
| Brief | Problem, role, tools, stages with time estimates, deliverables, and your AI manager | `07` |
| Kickoff meeting | Narrated slides with captions and speed control. After each part you write a Problem, Outcome or Process note; an AI note checker grades it, and accepted notes earn **held XP**. You can also ask the manager questions. | `08–10` |
| Proof of understanding | The manager asks questions as voice notes. You hold Space to answer, or type, and follow-ups come when your answer is partial. Passing releases the held XP. | `11` |
| Stages | **Plan** (agree scope and an estimate with the manager), **Do** (work in your own tools with the AI co-worker), **Learn** (micro-lessons, quiz, tutor) | `12–15` |
| Evaluation | Four-axis rubric (Understanding, Quality, Communication, Independence), each rated Below, Meeting or Exceeding with a one-line rationale, plus XP | `16` |
| Presentation | Camera with a lighting and framing check, slide outline, recording to disk, live on-device transcript, then graded feedback | `17–18` |
| Progress | XP and levels (L1 at 750 … L10 at 33,000), streaks, portfolio, and a job portal with a human-in-the-loop application drafter | `21–23` |
| Desktop layer | Transparent, always-on-top, capture-protected overlays: the co-worker **island**, a **highlight** layer that points at your screen, a **PiP** companion, an "I'm lost" region picker, a HUD, a record bar and a camera bubble | `14`, `25` |
| Account | 13-tab settings, credits popover and usage, plans (simulated), notifications, bug reporter (⌘⇧B), support chat, career coach | `19–20` |

All screenshots are in [`docs/screenshots`](docs/screenshots). They were taken from the running app during QA.

## Quick start

Requirements: macOS, Node 22.13+ (for `node:sqlite`) and npm. Xcode Command Line Tools are only needed for the speech helper.

```bash
npm install
```

```bash
npm run stt:build
```

```bash
npm run dev
```

`npm run dev` starts three processes:

- **server**: the API and websockets on `127.0.0.1:8787`, with data in `apps/server/data/`.
- **web**: Vite on `127.0.0.1:5173`.
- **desktop**: Electron, once both are up.

Sign in with any email; there is no password in this build.

To run it in a browser without Electron, start `npm run dev:server` and `npm run dev:web`, then open http://127.0.0.1:5173. The overlays appear as in-page frames.

### Real AI vs practice mode

Without credentials, the server runs in **practice mode**. A deterministic engine grades notes, answers, plans, submissions and presentations against the authored rubric points, so the whole loop works offline.

To use Claude, copy `.env.example` to `.env` and set `ANTHROPIC_API_KEY`. The models are:

- **Quality** (`PW_MODEL_QUALITY`, default `claude-opus-5-5`): graders and planning. It uses the server-side refusal fallback.
- **Fast** (`PW_MODEL_FAST`, default `claude-haiku-5-5`): the note checker, the PoU judge, the co-worker, the tutor and chat.

Graders use structured JSON output. The co-worker streams text and uses one-shot tools (`set_todos`, `highlight`, `share_resource`, `award_xp`) with screenshots as vision input. Any API error falls back to practice mode for that call. `GET /api/health` reports which mode is active.

## Architecture

```
packages/shared    Contracts: domain types, REST route map (ApiRoutes), websocket protocols, desktop bridge (PwBridge + IPC channels), constants
packages/content   Authored content: 3 careers × 3 projects (kickoffs, PoU questions, 4 stages each), 18 trainings, 15 jobs + validator
apps/server        Fastify 5 + node:sqlite + jose. src/core = REST, DB, XP, credits; src/ai = Claude/practice engine + /ws/cowork
apps/desktop       Electron 45 shell: frameless window + 44px titlebar (shell.html) + WebContentsView, overlay factory, prod server,
                   deep links, safeStorage session, offline cache (node:sqlite), STT bridge, screen capture + diff, notifications socket,
                   global shortcuts, local-video:// recordings, OTA check, smoke test
apps/renderer      React 19 + Tailwind v4 + zustand + motion. One index.html; ?surface= picks main app or an overlay
native/stt-helper  Swift STTStreamHelper.app: SFSpeechRecognizer, stdin commands, 16 kHz Float32 PCM on fd 3, PARTIAL/FINAL lines
```

Key design points:

- **One renderer, many windows.** Every overlay window loads the same bundle with `?surface=pip|hud|island|cowork|recordbar|camera|region`. Overlays are transparent, `type: "panel"`, always on top, click-through where needed, and use `setContentProtection(true)` so they never appear in screenshots the AI takes. They talk through `pw.overlay.broadcast`; the channel names are in `apps/renderer/src/lib/overlayChannels.ts`.
- **Reliable sockets.** The co-worker and notification sockets authenticate in their first frame and give every frame an `event_key`. They keep a localStorage outbox that replays on reconnect (max 3 tries), with ping/pong, stale detection and back-off. The server de-duplicates by `event_key`.
- **Server-driven state.** Onboarding is a step machine on the server (a 409 returns the authoritative view). Objectives hold the whole run: notes, verdicts, PoU turns, stage progress and evaluations. XP from kickoff notes is held until the Proof of Understanding is passed.
- **Credits.** Every AI action debits a ledger by category: evaluation, training, AI manager, coaching or other. Plans and top-ups are simulated.

## Testing

| Command | What it covers |
|---|---|
| `npm run typecheck` | All 5 packages (TypeScript 7) |
| `npm test` | 283 tests: content validator (3), server core and AI (55, including the full learning loop against SQLite and the websocket protocols), renderer (225, including ReliableSocket, API client, cowork client and feature helpers) |
| `npm run e2e:api` | Walks a new learner through the entire loop against a running server, using the real content |
| `npm run smoke` | Boots Electron with hidden windows and checks the bridge in all 9 windows, the cache, encrypted session storage, capture permission, STT helper status and the renderer server |
| `bash native/stt-helper/test.sh` | The speech helper protocol in fake mode (`PW_STT_FAKE=1`) |
| `scripts/qa/harness.cjs` + `scripts/qa/q` | An invisible offscreen browser (Electron) for scripted UI QA and 1280×800 screenshots |
| `scripts/qa/cdp` | Drives a desktop build started with `--remote-debugging-port=9333` |

## Packaging

```bash
npm run dist
```

This builds the renderer and runs `electron-builder --mac --dir` (`apps/desktop/electron-builder.yml`). The app bundles the renderer (served from `127.0.0.1:31470`) and the speech helper, registers `proofwork://`, enables the hardened runtime and declares the camera, microphone, speech and screen usage strings. Code signing and notarisation need your Apple Developer identity.

## What is simulated or left out

- **Payments**: plan changes and top-ups only change the local ledger.
- **Speech**: on-device recognition needs you to grant Speech Recognition permission (macOS asks on first use); until then the app offers typed answers. Text-to-speech uses the system voices.
- **Camera recording**: needs camera and microphone permission. Framing is a lighting and centre check, not face detection.
- **Not included**: cloud voice (LiveKit, Deepgram, ElevenLabs), real job boards and browser automation. The assist-apply flow drafts answers for you to review and never submits anything.
- **Practice mode**: grading is keyword- and evidence-based. It is good for demos and offline use, but not a substitute for the live model.

## How it was built

A supervising agent wrote the contracts in `packages/shared` and the server's `contracts.ts`, then split the work across 18 Claude Haiku agents, each owning one folder:

- **Content (4)**: three careers, plus trainings and jobs.
- **Backend (2)**: server core, and the AI engine with the co-worker socket.
- **Desktop and native (2)**: the Electron shell and the Swift speech helper.
- **Renderer (10)**: foundation and UI kit, onboarding, home map, brief/kickoff/PoU, stage workspace, presentation, account panels, career pages, overlays, and a map polish pass.

The supervisor reviewed every hand-off, typechecked, tested and ran the app end to end. It fixed integration bugs in shared code: CORS for PATCH and DELETE, nested theme tokens, overlay sessions, drawing coordinates, kickoff resume, checklist duplication and grader wording.
