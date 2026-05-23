# v1.1.0 — Visual Redesign, File Uploads & Bug Fixes

## 🎨 Visual Overhaul (shadcn/ui)

- Initialized shadcn/ui with monochrome HSL design system (light + dark mode)
- Geist font, Tailwind animations (slide-up, fade-in)
- 14+ shadcn components installed: Button, Input, Card, Badge, Avatar, Separator, Sheet, ScrollArea, Skeleton, Switch, Tabs, Textarea, Select, Dialog, Tooltip, DropdownMenu
- Redesigned Login, Register, BannedPage with Card + shadcn components
- ChatLayout: Sheet-based mobile sidebar, workspace hidden on small screens
- Sidebar: Avatar, Button, ScrollArea — mobile-responsive with Sheet drawer
- ChatArea: ScrollArea wrapper, streaming skeleton indicator
- MessageBubble: shadcn Button toolbar, collapsible reasoning, version navigation
- ChatInput: Textarea, Button toggles for web search / reasoning
- ModelSelector, Workspace, AdminPanel — all redesigned with shadcn components

## 📎 File Uploads & Attachments

- New `attachments.ts` route: POST upload (multer v2), GET download, GET listing, DELETE
- 20 MB limit, MIME type whitelist, UUID-based storage in `data/uploads/`
- File-only messages supported (empty content with attachments)
- Images render inline; documents as downloadable cards with icon/size
- Chat input: file picker button, upload progress state, pending file chips with remove

## 🐛 Bug Fixes

- **Message role case** — frontend now uses `USER`/`ASSISTANT` (uppercase) matching backend Prisma enum; fixes message rendering on reload and regeneration
- **SSE field name mismatch** — `content` → `delta`, `id` → `conversationId`, `count` → `sources.length` in chat store stream parsing
- **Alternative event parsing** — `regenerateMessage` now reads `parsed.alternative.content` instead of `parsed.content`
- **`done` event messageId** — regeneration now sends correct target message ID instead of empty string
- **`JSON.parse` crash** — conversations route now wraps `webSearchSources` parse in try/catch
- **CSRF first-request block** — token generated + validation skipped on first request (no cookie yet)
- **CSRF token cleared on logout** — removed, token persists across sessions
- **Multer error handlers** — dead catch blocks replaced with Express error middleware for proper file size / type error messages
- **Admin API shape mismatch** — users/conversations endpoints now return `{ items, pagination }` matching frontend hooks
- **Ban/unban mutations** — `useBanUser` sends `{ ban: true, reason }`; `useUnbanUser` sends PATCH `{ ban: false }` instead of DELETE
- **Filename header injection** — Content-Disposition now strips `"`, `\`, CR, LF from filename
- **Email/username not trimmed** — Login and Register now trim inputs
- **Username regex mismatch** — backend now permits `-` to match shared schema
- **`authResponseSchema`** — removed from shared package (matched no endpoint)

## 🧹 Cleanup

- Deleted 10 dead source files: unused shadcn scaffolds, `sseClient.ts`, `AddUser.tsx`, `ToastContainer.tsx`, `smoke.test.ts`
- Removed 11 unused npm dependencies: `uuid`, `openid-client`, `katex`, `react-katex`, `mermaid`, `recharts`, `shadcn`, `tw-animate-css`, `zod`, `@radix-ui/react-dialog`, `@types/react-katex`
- Extracted `formatFileSize` to shared `lib/utils.ts`, removed duplicates
- Removed leftover runtime logs and config backups

## 🧰 Technical

- Monorepo: pnpm workspaces with `backend/`, `frontend/`, `shared/` packages
- Backend: Express 4 + Prisma 6 + SQLite + Zod validation
- Frontend: React 19 + Vite 6 + shadcn/ui + Tailwind 3 + Zustand
- Authentication: JWT (access + refresh), httpOnly cookies, bcrypt, CSRF protection
- File uploads: multer v2, auth-protected download URLs, MIME whitelist
- SSE streaming with reasoning visibility and message version history
- All typechecks pass, production build succeeds (3803 modules, ~14s)
