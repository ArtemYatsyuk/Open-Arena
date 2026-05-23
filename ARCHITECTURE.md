# Architecture

## Overview

Open Arena is a **self-hosted multi-model AI chat platform**. It consists of three
workspace packages in a pnpm monorepo:

```
open-arena/
├── shared/         - Types & Zod schemas used by both apps (@open-arena/shared)
├── backend/        - Express API server (@open-arena/backend)
├── frontend/       - Vite + React SPA (@open-arena/frontend)
└── data/           - Runtime config, database, backups (gitignored)
```

## Stack

| Layer      | Tech                                                        |
| ---------- | ----------------------------------------------------------- |
| API server | Express 4 + TypeScript (strict)                             |
| Database   | SQLite via Prisma 6 (JSON columns for complex data)         |
| Frontend   | React 19 + TypeScript, Vite 6                               |
| State      | Zustand (client) + React Query (server cache)               |
| Styling    | Tailwind 3 + Radix UI primitives (shadcn/ui conventions)    |
| Validation | Zod — same schemas used server- & client-side via `shared/` |
| Streaming  | Server-Sent Events (SSE) for chat responses                 |
| Auth       | JWT in httpOnly cookies (access+refresh)                    |
| Config     | Hot-reloaded `data/config.json` via `fs.watch`              |

## Key Design Decisions

1. **Single `shared/` package**: All Zod schemas live here. Backend validates
   request bodies; frontend uses the same schemas for form validation and
   response parsing. Prevents type drift.

2. **Provider-adapter pattern** (chat): Each LLM provider implements a common
   `ChatAdapter` interface. The router picks the adapter based on the model's
   `baseUrl` — no `if (url.includes("anthropic"))` checks.

3. **Config hot-reload**: `config.json` is re-read on every admin save and when
   `fs.watch` detects external changes. No restart needed.

4. **Audit log**: All admin state-changing operations write to the `AuditLog`
   table via middleware. Immutable append-only.

## Data Flow

```
Browser  ←→  Vite Dev Server (:5173)  →  /api/* proxy  →  Express (:4000)
                                                          │
                                                         Prisma (SQLite)
                                                          │
                                                        LLM APIs
                                                       SearXNG
```

In production the Vite proxy is replaced by Express serving the built SPA
(`frontend/dist`).

## Directory naming

- `backend/src/routes/` — Express route handlers (thin, delegate to services)
- `backend/src/services/` — Business logic (chat streaming, auth, filters, etc.)
- `backend/src/middleware/` — Express middleware (auth, audit, rate-limit)
- `backend/src/utils/` — Pure utility functions
- `frontend/src/pages/` — Top-level route components
- `frontend/src/components/`— Reusable UI (by domain: chat, admin, sidebar, etc.)
- `frontend/src/stores/` — Zustand state slices
- `shared/src/` — Zod schemas + TypeScript types, grouped by domain
