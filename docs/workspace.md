# Task workspace

The scenario workspace, served at `/app/scenarios/:scenarioId`: the brief on the left, the chat with the manager
and the coach in the middle, and the meeting notes on the right. Its content comes from the scenario's file in
`src/data/scenarios/`. `docs/reference/workspace/` has the original target screenshot.

## Files

- `ScenarioPage.jsx`: loads the scenario, holds both conversations and runs Submit for review.
- `TopBar.jsx`: back button, level and the four skill badges, filled in after a review.
- `Sidebar.jsx`: the task, its requirements, the resources and Submit for review.
- `ChatPanel.jsx`: manager and coach tabs, messages, typing, "Try saying" lines and the composer.
- `ReviewCard.jsx`: the manager's review with skill scores.
- `useConversation.js`: one saved conversation with a persona.
- `NotesViewer.jsx`: the meeting notes with zoom, reset and download.
- `icons.jsx`: the line icons.
- `workspace.css`: colour tokens, fades and list bullets, scoped to the route.
