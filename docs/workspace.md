# Task workspace

A dark three-column task workspace, served at `/workspace`: the task brief on the left, a chat with the manager
in the middle and the meeting notes viewer on the right. It is laid out for a 1710 x 1074 viewport;
`docs/reference/workspace/` has the target screenshot.

## Files

- `WorkspacePage.jsx`: the three-column layout and the notes panel toggle.
- `TopBar.jsx`: back button, level chip and the four progress badges.
- `Sidebar.jsx`: the project, its requirements and the resources.
- `Chat.jsx`: the conversation with the manager and the time options.
- `NotesViewer.jsx`: the meeting notes document with zoom, reset and download.
- `content.js`: all copy and data.
- `icons.jsx`: the line icons.
- `workspace.css`: colour tokens, fades and list bullets, scoped to the route.

## What works

- Requirement rows open and close.
- "Meeting notes" under Project resources reopens the notes panel, and the panel's back arrow closes it.
- The notes viewer zooms from 50% to 200%, resets, and downloads the notes as Markdown.
- The time options are selectable, and the GitHub link opens in a new tab.
- The chat opens scrolled to the write-up card.
- The back button returns to the landing page.

## Approximations

- Fonts: Google Sans, DM Sans and Geist Mono from Google Fonts.
- Below 1280px the three columns stack.
- A few pieces are placeholder copy: the bullets inside the three closed requirements, and the hidden "Stack"
  section at the bottom of the notes.
