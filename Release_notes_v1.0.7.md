# Open Arena v1.0.7

## New Features

- **Regenerate & Version History** — Click the ↻ icon below any AI response to re-generate it. All versions are preserved and navigable via `‹ 1/2 ›` arrows with left/right buttons.
- **Conversation URLs** — Each chat now has a unique URL (`/c/:uuid`). Conversations can be bookmarked, shared, and navigated with browser back/forward.
- **Reasoning Toggle** — New Brain toggle in the chat input lets you enable or disable model reasoning (thinking) per-session. When disabled, no reasoning is requested from the model.
- **In-App Documentation** — Settings → Docs now features a two-column layout with chapter sidebar navigation, covering Getting Started, Chat Basics, Web Search, Custom Models, Filters, Reasoning, Admin Panel, and Keyboard Shortcuts.
- **Discord Community Link** — Added a Discord invite (discord.gg/cDvKQkYQxu) in Settings → General → Community.

## Bug Fixes

- **`webSearchSources.map is not a function`** — Backend now properly parses `webSearchSources` from JSON string to array before sending to the frontend (fixed in both user and admin conversation endpoints).
- **400 Bad Request on regenerate** — Assistant messages now receive their real database ID via the SSE `done` event, so regenerate requests find the correct message.
- **Search results auto-open** — Web search results panel now stays collapsed after the AI finishes generating.
- **User avatar removed from sidebar** — Cleaner sidebar footer without the avatar badge.
- **Chat input padding** — Fixed text overlap when both Globe (web search) and Brain (reasoning) toggles are visible.
- **Monochrome accent** — Replaced all purple accent colors with black/white grayscale.

## Changelog

All changes are listed in the git history since v1.0.6.
