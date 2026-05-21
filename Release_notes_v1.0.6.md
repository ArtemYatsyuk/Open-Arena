# v1.0.6 - Web Search Citations & Admin Config Panel

## New Features

### Clickable `[1]`, `[2]` Citations
- Web search results are now numbered with clickable source links
- The model's `[N]` references are transformed into hyperlinks pointing to the original source URL
- Sources are persisted in the database alongside each message (survives page reload)

### Search Results Bubble
- A collapsible "Search results (N)" bubble appears above each AI response when web search was used
- Shows each result as: numbered badge, title (clickable link), and snippet preview
- Same expand/collapse UX as the "Thought process" reasoning section

### Admin Config Panel
- Fixed `config.json` path resolution (was pointing to wrong directory)
- Config page now correctly reads, edits, and saves models
- Backup feature creates timestamped copies

## Bug Fixes
- **Web search**: Today's date is now always injected into the system message, even when SearXNG is unreachable. The model always knows the current date.
- **SSE headers**: Fixed `res.write()` before SSE headers were set — headers now precede all writes
- **Admin conversations**: Added admin-specific messages endpoint that bypasses user-ID filter, fixing "Conversation not found" errors when admins view other users' conversations
- **Prisma schema**: Added `webSearchSources` JSON field to Message model
- **Session handling**: Server restart requires re-login (expected JWT behavior)

## Files Changed
- `backend/prisma/schema.prisma` — added `webSearchSources` field
- `backend/src/services/webSearchService.ts` — added `SearchSource` type, returns sources array
- `backend/src/routes/chat.ts` — sends sources in SSE event, saves to DB
- `backend/src/routes/admin.ts` — fixed configPath, added messages endpoint
- `frontend/src/stores/chatStore.ts` — handles websearch SSE sources, attaches to messages
- `frontend/src/components/chat/MessageBubble.tsx` — citation linking, search results collapsible
- `frontend/src/components/admin/ConfigViewer.tsx` — JSON editor, add model form, backup
- `frontend/src/components/admin/ConversationsBrowser.tsx` — copyable code blocks, admin messages endpoint
