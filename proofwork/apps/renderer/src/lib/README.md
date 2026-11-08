# Renderer library guide

For feature agents. Everything here is typed from `@pw/shared`. Feature files live in `src/features/` (see `src/features/README.md`).

## 1. Call the API

```ts
import { api, useApi, invalidate, ApiError, uploadFile } from "@/lib/api";

// One-off (mutations, actions). Route keys come from ApiRoutes, so the body and response are typed.
const obj = await api("POST /objectives", { body: { scenarioId } });
await api("POST /objectives/:id/time", { params: { id }, body: { seconds: 30 } });

// Hook for reads. Pass null as opts to stay idle. Extra deps refetch.
const { data, error, loading, reload, mutate } = useApi("GET /scenarios", { query: { careerId } }, [careerId]);
const scenario = useApi("GET /scenarios/:id", { params: { id } });

// Refetch every mounted useApi whose key starts with the prefix. Keys look like "GET /objectives/abc?x=1".
invalidate("GET /objectives");

// Errors: ApiError has .status, .code ("locked", "insufficient_credits", "conflict"...), .message and .data.
// A 409 from /onboarding carries the authoritative view in err.data. A 401 clears the session automatically.
try { await api("POST /credits/topup", { body: { amount: 500 } }); } catch (e) { if (e instanceof ApiError && e.code === "insufficient_credits") {} }

const upload = await uploadFile(file); // POST /api/uploads, returns UploadResult
```

`useApi` refetches on window focus, at most every 15 s. The cache is in memory only.

## 2. Session, progress and credits

```ts
import { useSession } from "@/stores/session";   // { user, token, hydrated, login, logout, refreshUser, setUser }
import { useProgress } from "@/stores/progress"; // { data: Progress | null, refresh() }   level, xp, completedScenarios
import { useCredits } from "@/stores/credits";   // { data: CreditsSummary | null, refresh(), setBalance() }

const user = useSession((s) => s.user);
const level = useProgress((s) => s.data?.level ?? 0);
await useProgress.getState().refresh();          // also invalidates useApi("GET /progress")
```

Notifications: `useNotifications` (`items`, `unread`, `markRead(id)`, `markAll()`) handles pushed frames. Pushes show a toast.

## 3. Panels and toasts

```ts
import { useUi } from "@/stores/ui";
useUi.getState().openPanel("xp");                 // name: settings | credits | notifications | bug | support | coach | xp | vision
useUi.getState().openPanel("settings", { initialTab: "voice" });
import { toast } from "@/components/ui/Toaster";  // toast({ title, body?, tone?: "neutral"|"success"|"xp"|"warning"|"danger" })
```

Titlebar: `useTitlebar` (web) and `pw.window.setTitlebar({...})` (Electron) are fed by GlobalEffects from the route. Feature screens do not need to set them.

## 4. Desktop bridge (`pw`)

```ts
import { pw } from "@/lib/bridge";   // always this, never window.pw
pw.isElectron; pw.surface;           // "main" | "pip" | "hud" | "island" | "cowork" | "recordbar" | "camera" | "region"
await pw.app.openExternal(url);
pw.notifications.show({ title, body, route });
const shot = await pw.capture.screenshot({ maxWidth: 1280 }); // rejects in the web build
```

Overlays. In Electron, `pw.overlay.open(kind, payload)` opens a real window. In the web build it mounts an `<iframe src="/?surface=kind">` in `OverlayHost` (see the limits at the top of `web-bridge.ts`):

```ts
await pw.overlay.open("pip", { objectiveId, stageId });   // host side
const payload = await pw.overlay.getPayload();           // surface side, on mount
await pw.overlay.setPayload("pip", next);                // updates a running overlay
pw.overlay.broadcast("coach:tip", data);                 // every other window
const off = pw.overlay.onMessage((m) => {});             // { from, channel, data }
```

Shortcuts: `pw.shortcuts.onShortcut((name, phase) => ...)`. Web: ⌘/Ctrl+Shift+B gives "bug-report".

## 5. Realtime: sockets, cowork, voice

- `createCoworkClient({ objectiveId, stageId, mode, learnerName })` (`lib/realtime/cowork.ts`). Then `client.connect()`, `sendText(text, ctx?)`, `sendEvent(kind, ctx?)`, `imLost(q, ctx?)`, `requestHighlight(q, ctx?)`, `completeTodo(id, done)`, `end()`, `close()`.
- `useCowork(client)` returns the state: `messages` (npc messages stream in via `text_delta`, learner messages are added on send), `todos`, `thinking`, `lastHighlight`, `resources`, `xpEarned`, `credits`, `ended`, `connection`.
- `captureContext()` returns `{screenshot?, focusedApp?, windowTitle?}` and `{}` when capture is unavailable.
- Typed subscriptions: `client.on("highlight", (m) => ...)`. Window bus: `onSocketMessage("cowork", "xp", cb)`.
- `ReliableSocket` is the base class. Use it for new sockets. It handles auth, the outbox, ack, ping, stale and back-off.
- TTS: `speak(text, { voice?, onStart?, onEnd? })`, `cancel()`, `isSpeaking()`, `estimateDurationSec(text)`. Settings `ttsEnabled` and `ttsRate` are respected.
- Push to talk: `usePushToTalk({ onFinal, vocabulary?, enabled? })` returns `{ state, partial, level, available, start, stop, toggle }`. Hold Space to talk. `available` is false in the web build.

## 6. UI kit (`components/ui`, import from `@/components/ui`)

- `Button` (variant primary|light|glass|ghost|danger, size sm|md|lg, `loading`, `icon`, `iconRight`), `IconButton` (required `label`).
- `GlassCard`, `PaperCard`, `Pill` (tone), `MonoLabel` (tone), `Badge`.
- `Modal` (`open`, `onClose`, `title`), `Sheet` (`side`, `width`), `Popover` (`anchorRef`, `placement`, `label`), `Tooltip` (`content`).
- `Tabs` (`tabs`, `value`, `onChange`, `label`, `orientation`).
- `Input`, `Textarea` (auto-grow), `Select` (`options`, `onValueChange`), `Switch`, `Slider`, `Checkbox`.
- `ProgressBar`, `ProgressRing`, `DotMeter`, `Spinner`, `Skeleton`, `EmptyState`, `Placeholder`, `Kbd`, `Timer` (`initialSeconds`, `running`), `ErrorBoundary`.
- `Markdown` (`source`, `tone` paper|night). Raw HTML is removed.

## 7. Domain components (`components/domain`)

- `NpcAvatar` (`name`, `seed`, `size`, `speaking`), `CompanyGlyph` (`company`, `size`), `LevelPill` (`level`, opens "xp"), `XpChip` (`amount`, `held`).
- `RubricView` (`rubric`, `variant` compact|full), `PerformanceBadge` (`level | null`), `StageModeToggle` (`value`, `onChange`).
- `VoiceBubble` (`side` npc|learner, `name`, `avatarSeed`, `text`, `voice?`, `autoPlay?`).
- `PushToTalkButton` (`onFinal`, `vocabulary?`), which falls back to a typed answer.
- `NotesCard` (`notes`, `onChange?`, `readOnly?`): the "Meeting Notes" paper card.

## 8. Styling conventions

- Tokens are in `styles/app.css` (`@theme`). Use the classes: `bg-accent`, `text-xp`, `text-success`, `bg-night`, `font-mono`, `font-serif`, `rounded-card`, `rounded-glass`.
- Theme text: `text-fg` and `text-fg-muted` follow the nearest `.theme-night` or `.theme-paper` wrapper. Use `paper` / `glass` classes for surfaces.
- Labels and metrics: `MonoLabel` (mono, 11 px, uppercase, tracked). Headings on paper: `font-serif`.
- Motion: `motion/react`, 180–260 ms ease-out. Respect `prefers-reduced-motion`.
- Layout must work from 1100×720. Scroll inside containers. Never scroll the page horizontally.
- `cn()` (`lib/cn.ts`) joins class names. There is no tailwind-merge, so do not pass conflicting utilities.
