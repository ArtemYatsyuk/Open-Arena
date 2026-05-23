# Open Arena

Self-hosted multi-model AI chat platform with an admin panel, web search,
sandboxed message filters, and extensive model provider support.

## Quick Start

```bash
# Prerequisites: Node ≥20.10, pnpm ≥10
pnpm install
pnpm db:generate
pnpm db:push
pnpm db:seed
pnpm dev
```

Open `http://localhost:5173` and log in as `admin@openarena.local` / `admin123`.

## Features

- **Multi-model**: OpenAI-compatible, Anthropic, NVIDIA NIM, OpenRouter, and
  any OpenAI-compatible endpoint — configured via `data/config.json`.
- **SSE streaming** with reasoning visibility and version history (regenerate).
- **Web search** via SearXNG with inline citations (`[N]` → clickable source).
- **Sandboxed filters** — JS hooks that transform messages in-flight
  (inlet/outlet pattern, `node:vm` sandbox).
- **Admin panel**: dashboard (stats, charts), user management (ban, role, bulk),
  config editor (with backups), conversations browser, filters editor,
  announcement/MOTD system, audit log, model health checks.
- **File uploads** — drag & drop images and documents (optional S3 storage).
- **Voice** — browser speech-to-text input + high-quality TTS playback.
- **Conversation folders/tags** + full-text message search.
- **Prompt library** with `{{variable}}` interpolation.
- **OAuth/SSO** (Google, GitHub, Discord) + email verification + password reset.
- **Rate limits + token quotas** per role/user.
- **Full mobile support** + PWA installable.

## Configuration

Edit `data/config.json` (or `config.json` at install root for backward compat)
to add model endpoints. Each model specifies an `apiKeyEnv` field naming the
environment variable that holds its API key — never put secrets in config files.

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

## Environment Variables

| Variable             | Required | Default                 | Notes                                  |
| -------------------- | -------- | ----------------------- | -------------------------------------- |
| `JWT_ACCESS_SECRET`  | ✓        | —                       | Random string, at least 32 chars       |
| `JWT_REFRESH_SECRET` | ✓        | —                       | Different from access secret           |
| `DATABASE_URL`       | ✓        | `file:./data.db`        | SQLite path                            |
| `PORT`               |          | `4000`                  | Backend port                           |
| `NODE_ENV`           |          | `development`           | Set `production` for deployment        |
| `CORS_ORIGIN`        |          | `http://localhost:5173` | Frontend origin for CORS               |
| `SECURE_COOKIES`     |          | `false`                 | Set `true` behind HTTPS reverse proxy  |
| `SMTP_*`             |          | —                       | Email for verification, password reset |

## Deployment

```bash
pnpm build
NODE_ENV=production JWT_ACCESS_SECRET="..." JWT_REFRESH_SECRET="..." DATABASE_URL="file:./data.db" pnpm start
```

We recommend running behind a reverse proxy (nginx, Caddy) that handles TLS
termination.

## Tech Stack

Express 4 + React 19 + Prisma 6 (SQLite) + Vite 6 + Tailwind 3 + Radix UI + Zustand + Zod.

See [ARCHITECTURE.md](ARCHITECTURE.md) for details.

## License

MIT
