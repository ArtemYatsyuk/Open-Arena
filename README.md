# Open Arena

Self-hosted multi-model AI chat platform with an admin panel, web search,
sandboxed message filters, file uploads, and OAuth SSO.

## Quick Start

```bash
# Prerequisites: Node ≥20.10, pnpm ≥10
pnpm install
pnpm --filter @open-arena/backend db:generate
pnpm --filter @open-arena/backend db:push
pnpm --filter @open-arena/backend db:seed
pnpm dev
```

Open `http://localhost:5173` and log in as `admin@openarena.local` / `admin123`.

## Features

- **Multi-model** — OpenAI-compatible, Anthropic, NVIDIA NIM, OpenRouter, and
  any OpenAI-compatible endpoint. Configured via `config.json`.
- **SSE streaming** — Real-time token streaming with reasoning visibility
  (chain-of-thought) and message regeneration with version history.
- **Web search** — SearXNG integration with inline citations (`[N]` →
  clickable source links).
- **Sandboxed message filters** — JavaScript hooks that transform messages
  in-flight (inlet/outlet pattern, `node:vm` sandbox with timeout).
- **File uploads** — Images render inline; documents downloadable as cards.
  20 MB limit, auth-protected storage (no public directory).
- **Admin panel** — Dashboard stats, user management (ban, role, bulk delete),
  config editor (with auto-backups), conversations browser, filters editor,
  MOTD/announcements system, audit log, model health checks.
- **OAuth/SSO** — Google, GitHub, Discord authentication.
- **Email verification** + password reset (SMTP or mock console transport).
- **Invitation management** — Restrict registration by invite token.
- **Rate limiting** — Global (200/min) and auth-specific (20/15min) with
  account lockout after 5 failed attempts.
- **Conversation folders/tags** + full-text message search.
- **Mobile-responsive** — Sheet-based sidebar on small screens, shadcn/ui
  monochrome design system.
- **Prompt library** — Store reusable prompts with `{{variable}}` interpolation.

## Folder Structure

```
open-arena/
├── backend/          # Express 4 API server
│   ├── src/
│   │   ├── routes/       # auth, chat, conversations, admin, attachments, oauth, filters, models
│   │   ├── middleware/   # isAuthenticated, isAdmin, isNotBanned, CSRF
│   │   ├── services/     # auth, chat, webSearch, filterEngine
│   │   │   └── providers/  # openai.ts, anthropic.ts, base.ts (adapter pattern)
│   │   ├── index.ts      # Express app + middleware setup
│   │   └── config.ts     # config.json watcher + Zod validation
│   ├── prisma/
│   │   └── schema.prisma # 18 models + 2 enums
│   └── seed.ts           # Admin user + sample data
├── frontend/         # React 19 + Vite 6 + shadcn/ui
│   ├── src/
│   │   ├── pages/        # Login, Register, ChatLayout, AdminPanel, BannedPage
│   │   ├── components/   # chat/, sidebar/, admin/, workspace/, ui/
│   │   ├── stores/       # Zustand: authStore, chatStore, uiStore
│   │   └── lib/          # apiClient.ts, utils.ts, adminHooks.ts
│   └── vite.config.ts    # Dev proxy → localhost:4000
├── shared/           # Zod schemas + TypeScript types
│   └── src/              # message, conversation, auth, config, sse, attachment, etc.
├── data/
│   ├── uploads/          # File upload storage
│   └── .gitkeep
└── config.json           # Models + app config
```

## Configuration

Edit `config.json` in the project root to add model endpoints. Each model
specifies an `apiKeyEnv` field naming the environment variable that holds its
API key — **never put secrets in config files**.

```json
{
  "models": [
    {
      "id": "my-model",
      "name": "My Model",
      "baseUrl": "https://api.example.com",
      "endpoint": "/v1/chat/completions",
      "modelId": "org/model-name",
      "apiKeyEnv": "MY_API_KEY",
      "streaming": true,
      "contextWindow": 32768,
      "description": ""
    }
  ],
  "defaultModelId": "my-model",
  "app": {
    "name": "Open Arena",
    "logoUrl": "/logo.svg",
    "allowRegistration": true,
    "maxConversationsPerUser": 200
  },
  "webSearch": {
    "enabled": true,
    "provider": "searxng",
    "searxngUrl": "http://192.168.1.100:8080/"
  }
}
```

### Provider Adapters

| Provider          | Adapter        | Endpoint format        |
| ----------------- | -------------- | ---------------------- |
| OpenAI-compatible | `openai.ts`    | `/v1/chat/completions` |
| Anthropic         | `anthropic.ts` | `/v1/messages`         |

The adapter is selected automatically based on the `baseUrl`:

- `*anthropic.com*` → Claude adapter (uses `messages` API, `thinking` blocks)
- Everything else → OpenAI-compatible adapter (uses `chat/completions`, optional `reasoning_content`)

## Environment Variables

| Variable                | Required        | Default                 | Notes                                   |
| ----------------------- | --------------- | ----------------------- | --------------------------------------- |
| `JWT_ACCESS_SECRET`     | ✓               | —                       | Random string, ≥32 chars                |
| `JWT_REFRESH_SECRET`    | ✓               | —                       | Different from access secret            |
| `DATABASE_URL`          |                 | `file:./data.db`        | SQLite file path                        |
| `PORT`                  |                 | `4000`                  | Backend listens on this port            |
| `NODE_ENV`              |                 | `development`           | Set `production` for deployment         |
| `CORS_ORIGIN`           |                 | `http://localhost:5173` | Frontend origin (dev default)           |
| `SECURE_COOKIES`        |                 | `false`                 | Set `true` behind HTTPS reverse proxy   |
| `NVIDIA_API_KEY`        | model-dependent | —                       | API key for NVIDIA NIM models           |
| `ANTHROPIC_API_KEY`     | model-dependent | —                       | API key for Claude models               |
| `OPENAI_API_KEY`        | model-dependent | —                       | API key for OpenAI-compatible endpoints |
| `SMTP_HOST`             | for email       | —                       | SMTP server hostname                    |
| `SMTP_PORT`             | for email       | `587`                   | SMTP port                               |
| `SMTP_USER`             | for email       | —                       | SMTP username                           |
| `SMTP_PASS`             | for email       | —                       | SMTP password                           |
| `SMTP_FROM`             | for email       | —                       | From-address for outgoing email         |
| `GOOGLE_CLIENT_ID`      | for OAuth       | —                       | Google OAuth client ID                  |
| `GOOGLE_CLIENT_SECRET`  | for OAuth       | —                       | Google OAuth client secret              |
| `GITHUB_CLIENT_ID`      | for OAuth       | —                       | GitHub OAuth client ID                  |
| `GITHUB_CLIENT_SECRET`  | for OAuth       | —                       | GitHub OAuth client secret              |
| `DISCORD_CLIENT_ID`     | for OAuth       | —                       | Discord OAuth client ID                 |
| `DISCORD_CLIENT_SECRET` | for OAuth       | —                       | Discord OAuth client secret             |

## Development

```bash
# Install dependencies
pnpm install

# Generate Prisma client + create database + seed
pnpm --filter @open-arena/backend db:generate
pnpm --filter @open-arena/backend db:push
pnpm --filter @open-arena/backend db:seed

# Start dev servers (backend :4000, frontend :5173)
pnpm dev

# Run all typechecks
pnpm --filter @open-arena/shared typecheck
pnpm --filter @open-arena/backend typecheck
pnpm --filter @open-arena/frontend typecheck

# Run tests
pnpm test
```

### Useful Commands

```bash
# Open Prisma Studio (database GUI)
pnpm --filter @open-arena/backend db:studio

# Create a migration after schema changes
pnpm --filter @open-arena/backend db:migrate

# Push schema directly (no migration file)
pnpm --filter @open-arena/backend db:push

# Run specific package tests
pnpm --filter @open-arena/backend test
pnpm --filter @open-arena/frontend test

# Lint all packages
pnpm lint

# Format code
pnpm format
```

## Scripts

| Script           | Purpose                                     |
| ---------------- | ------------------------------------------- |
| `pnpm dev`       | Start backend + frontend concurrently       |
| `pnpm build`     | Build frontend for production               |
| `pnpm start`     | Run production backend (after `pnpm build`) |
| `pnpm test`      | Run all tests                               |
| `pnpm lint`      | ESLint across all packages                  |
| `pnpm format`    | Prettier format                             |
| `pnpm typecheck` | TypeScript check across all packages        |

## Admin Panel

Access at `/admin` (requires ADMIN role). The seeded admin user is:

- **Email:** `admin@openarena.local`
- **Password:** `admin123`

### Admin features

- **Dashboard** — Active users, conversation counts, message volume charts
  (7d/30d/1y), top users leaderboard.
- **Users** — Search, paginated list, set role, ban/unban with reason, delete.
- **Config** — Edit `config.json` in-browser with validation and auto-backup.
- **Conversations** — Browse all conversations, search, delete.
- **Filters** — Create/edit/delete sandboxed message transformation hooks.
- **Announcements** — MOTD with Markdown, severity levels, scheduling.
- **Audit log** — All admin actions with actor, target, and timestamp.
- **Models** — Health check pings for all configured model endpoints.

## Deployment

```bash
# Build frontend
pnpm build

# Set env vars and start
NODE_ENV=production \
JWT_ACCESS_SECRET="..." \
JWT_REFRESH_SECRET="..." \
DATABASE_URL="file:./data.db" \
pnpm start
```

We recommend running behind a reverse proxy (nginx, Caddy) that handles TLS
termination. Set `SECURE_COOKIES=true` when behind HTTPS.

## Security

- **CSRF** — Double-submit cookie pattern (exempts `/api/chat` and `/api/auth`
  prefixes for SSE and pre-login requests).
- **Rate limiting** — Global 200 req/min, auth endpoints 20 req/15min.
- **Account lockout** — 5 failed login attempts → 15 minute lockout.
- **CSP** — Tight Content-Security-Policy via Helmet.
- **File uploads** — MIME type whitelist, 20 MB limit, auth-protected download
  URLs (no public static directory).
- **No secrets in config** — API keys are read from environment variables,
  referenced by name in `config.json`.
- **Filter sandbox** — User-defined JS filters run in `node:vm` with timeout.

## Tech Stack

| Layer      | Technology                                              |
| ---------- | ------------------------------------------------------- |
| Backend    | Express 4 + Prisma 6 (SQLite) + Zod                     |
| Frontend   | React 19 + Vite 6 + shadcn/ui + Tailwind 3              |
| State      | Zustand + TanStack React Query                          |
| Streaming  | Server-Sent Events (SSE) via fetch ReadableStream       |
| Auth       | JWT (access + refresh tokens), httpOnly cookies, bcrypt |
| Validation | Zod — shared schemas across frontend and backend        |
| Monorepo   | pnpm workspaces                                         |

See [ARCHITECTURE.md](ARCHITECTURE.md) for details.

## License

MIT
