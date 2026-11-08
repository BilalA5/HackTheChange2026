# Feature map

Every file below is a **stub** from the foundation. Feature agents replace the file body and keep the
default export name and props. Routes and panels already point at these paths, so nothing else needs wiring.
Shared APIs are documented in `src/lib/README.md`.

## Pages (`app/router.tsx`)

| Route | File | Default export | Layout |
|---|---|---|---|
| `/` | `home/HomePage.tsx` | `HomePage` | AppShell |
| `/training`, `/training/:kind` | `career/TrainingPage.tsx` | `TrainingPage` | AppShell |
| `/portfolio` | `career/PortfolioPage.tsx` | `PortfolioPage` | AppShell |
| `/jobs` | `career/JobsPage.tsx` | `JobsPage` | AppShell |
| `/onboarding` | `onboarding/OnboardingPage.tsx` | `OnboardingPage` | FocusLayout |
| `/objective/:objectiveId` | `objective/ObjectivePage.tsx` | `ObjectivePage` | FocusLayout |
| `/objective/:objectiveId/review` | `stage/ReviewPage.tsx` | `ReviewPage` | FocusLayout |
| `/objective/:objectiveId/feedback` | `presentation/PresentationFeedbackPage.tsx` | `PresentationFeedbackPage` | FocusLayout |
| `/objective/:objectiveId/stage/:stageId` | `stage/StagePage.tsx` | `StagePage` | FocusLayout |
| `/objective/:objectiveId/stage/:stageId/present` | `presentation/PresentationPage.tsx` | `PresentationPage` | FocusLayout |

Public: `/login` (`features/auth/LoginPage.tsx`, already built) and `/__kit` (component gallery, `app/KitPage.tsx`).
Route params come from `useParams()` in react-router.

## Panels (`stores/ui.ts` → `app/panels.ts`)

Opened with `useUi.getState().openPanel(name, props?)`. Each receives `PanelProps` = `{ onClose } & Record<string, unknown>`.

| Panel name | File | Default export | Extra props |
|---|---|---|---|
| `settings` | `account/SettingsModal.tsx` | `SettingsModal` | `initialTab?: string` |
| `credits` | `account/CreditsPopover.tsx` | `CreditsPopover` | |
| `notifications` | `account/NotificationsPanel.tsx` | `NotificationsPanel` | |
| `bug` | `account/BugReporter.tsx` | `BugReporter` | |
| `support` | `account/SupportPanel.tsx` | `SupportPanel` | |
| `coach` | `account/CoachPanel.tsx` | `CoachPanel` | |
| `xp` | `home/XpPopover.tsx` | `XpPopover` | |
| `vision` | `home/VisionBoardPanel.tsx` | `VisionBoardPanel` | |

## Overlay surfaces (`?surface=` → `app/surfaces.ts`)

Read the payload with `pw.overlay.getPayload()` on mount. Props: none.

| Surface | File | Default export | Anchor (OVERLAY_DEFAULTS) |
|---|---|---|---|
| `pip` | `overlays/PipSurface.tsx` | `PipSurface` | bottom-right, 360×520 |
| `hud` | `overlays/HudSurface.tsx` | `HudSurface` | top-center, 420×72, click-through |
| `island` | `overlays/IslandSurface.tsx` | `IslandSurface` | top-center, 460×120, click-through |
| `cowork` | `overlays/CoworkSurface.tsx` | `CoworkSurface` | fullscreen, click-through |
| `region` | `overlays/RegionSurface.tsx` | `RegionSurface` | fullscreen |
| `camera` | `presentation/CameraSurface.tsx` | `CameraSurface` | bottom-right, 240×240 |
| `recordbar` | `presentation/RecordBarSurface.tsx` | `RecordBarSurface` | bottom-center, 380×64 |

## Rules for feature agents

- Replace a stub in place. Keep the default export name, so the lazy import keeps working.
- Build from `components/ui` and `components/domain`. Use tokens (`bg-accent`, `text-fg-muted`, `font-mono`), never raw hex.
- Call the server only through `api()` / `useApi()` (`lib/api.ts`). Call desktop features only through `pw` (`lib/bridge.ts`).
- Do not edit `lib/`, `stores/` or `components/ui` for a feature. If you need a change there, add the smallest API and note it in your report.
- Each feature folder may add its own sub-files and tests.
