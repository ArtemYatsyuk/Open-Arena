<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="frontend/public/OpenArena-Black.png" />
    <source media="(prefers-color-scheme: light)" srcset="OpenArena-Rounded.png" />
    <img src="OpenArena-Rounded.png" alt="Open Arena — self-hosted multi-model AI chat platform" width="480">
  </picture>
</p>

<p align="center">
  <em>Self-hosted multi-model AI chat platform</em>
</p>

<p align="center">
  <a href="#features">Features</a> ·
  <a href="#quick-start">Quick Start</a> ·
  <a href="#tech-stack">Tech Stack</a> ·
  <a href="#configuration">Configuration</a> ·
  <a href="#environment-variables">Environment</a> ·
  <a href="#admin-panel">Admin Panel</a> ·
  <a href="#deployment">Deployment</a>
</p>

<p align="center">
  <a href="https://github.com/ArtemYatsyuk/Open-Arena/releases">
    <img src="https://img.shields.io/github/v/release/ArtemYatsyuk/Open-Arena?style=for-the-badge&label=Version&color=18181b&logo=github" alt="Version">
  </a>
  <a href="https://github.com/ArtemYatsyuk/Open-Arena/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-555?style=for-the-badge&logo=open-source-initiative" alt="License">
  </a>
  <a href="https://nodejs.org">
    <img src="https://img.shields.io/badge/Node-≥20.10-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node">
  </a>
  <a href="https://pnpm.io">
    <img src="https://img.shields.io/badge/pnpm-≥10-F69220?style=for-the-badge&logo=pnpm&logoColor=white" alt="pnpm">
  </a>
  <a href="https://github.com/ArtemYatsyuk/Open-Arena/pulls">
    <img src="https://img.shields.io/badge/PRs-Welcome-28a745?style=for-the-badge&logo=gitpullrequest&logoColor=white" alt="PRs Welcome">
  </a>
  <a href="https://github.com/ArtemYatsyuk/Open-Arena/stargazers">
    <img src="https://img.shields.io/github/stars/ArtemYatsyuk/Open-Arena?style=for-the-badge&label=Stars&color=18181b&logo=github" alt="Stars">
  </a>
</p>

<p align="center">
  <code>pnpm install && pnpm --filter @open-arena/backend db:generate db:push db:seed && pnpm dev</code>
</p>

---

<details>
  <summary><b>📑 Table of Contents</b></summary>
  <ol>
    <li><a href="#features">Features</a></li>
    <li><a href="#tech-stack">Tech Stack</a></li>
    <li><a href="#quick-start">Quick Start</a></li>
    <li><a href="#star-history">Star History</a></li>
    <li><a href="#project-structure">Project Structure</a></li>
    <li><a href="#configuration">Configuration</a></li>
    <li><a href="#environment-variables">Environment Variables</a></li>
    <li><a href="#development">Development</a></li>
    <li><a href="#admin-panel">Admin Panel</a></li>
    <li><a href="#deployment">Deployment</a></li>
    <li><a href="#security">Security</a></li>
    <li><a href="#license">License</a></li>
  </ol>
</details>

## ✨ Features

<table>
  <tr>
    <td width="50%">
      <h3>🤖 Multi-Model</h3>
      <p>OpenAI-compatible, Anthropic Claude, NVIDIA NIM, OpenRouter — any endpoint via <code>config.json</code>. Provider-adapter pattern auto-selects the right API format.</p>
    </td>
    <td width="50%">
      <h3>⚡ SSE Streaming</h3>
      <p>Real-time token streaming with reasoning visibility (chain-of-thought) and message version history (regenerate + navigate alternatives).</p>
    </td>
  </tr>
  <tr>
    <td>
      <h3>🔍 Web Search</h3>
      <p>SearXNG integration with inline citations. Sources appear as clickable <code>[N]</code> links in every response.</p>
    </td>
    <td>
      <h3>🛡️ Sandboxed Filters</h3>
      <p>JavaScript hooks that transform messages in-flight — inlet/outlet pattern running in <code>node:vm</code> sandbox with timeout.</p>
    </td>
  </tr>
  <tr>
    <td>
      <h3>📎 File Uploads</h3>
      <p>Images render inline; documents display as downloadable cards. 20 MB limit, MIME whitelist, auth-protected storage.</p>
    </td>
    <td>
      <h3>👑 Admin Panel</h3>
      <p>Dashboard stats, user management (ban, role), config editor (auto-backup), conversations browser, filters, announcements, audit log, model health checks.</p>
    </td>
  </tr>
  <tr>
    <td>
      <h3>🔐 OAuth/SSO</h3>
      <p>Google, GitHub, Discord authentication. Email verification + password reset (SMTP or mock transport).</p>
    </td>
    <td>
      <h3>📱 Mobile-Responsive</h3>
      <p>Sheet-based sidebar on small screens. shadcn/ui monochrome design with dark mode support.</p>
    </td>
  </tr>
</table>

---

## 🏗️ Tech Stack

| Layer          | Technology                                         |
| -------------- | -------------------------------------------------- |
| **Runtime**    | Node.js 20+                                        |
| **Backend**    | Express 4 + Prisma 6 (SQLite) + Zod + Helmet + JWT |
| **Frontend**   | React 19 + Vite 6 + shadcn/ui + Tailwind 3         |
| **State**      | Zustand + TanStack React Query                     |
| **Streaming**  | Server-Sent Events via fetch ReadableStream        |
| **Auth**       | JWT (access + refresh), httpOnly cookies, bcrypt   |
| **Validation** | Zod — shared schemas across the whole stack        |
| **Monorepo**   | pnpm workspaces                                    |

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed design decisions.

---

## 🚀 Quick Start

```bash
# Prerequisites: Node ≥20.10, pnpm ≥10
pnpm install
pnpm --filter @open-arena/backend db:generate
pnpm --filter @open-arena/backend db:push
pnpm --filter @open-arena/backend db:seed
pnpm dev
```

Open **http://localhost:5173** and log in as `admin@openarena.local` / `admin123`.

## ⭐ Star History

<p align="center">
  <a href="https://star-history.com/#ArtemYatsyuk/Open-Arena&Date">
    <img src="https://img.shields.io/github/stars/ArtemYatsyuk/Open-Arena?style=for-the-badge&label=Stars&color=18181b&logo=github" alt="Stars">
  </a>
</p>

Track growth on <a href="https://star-history.com/#ArtemYatsyuk/Open-Arena&Date">star-history.com</a>.

---

## 📂 Project Structure

```
open-arena/
├── backend/              # Express 4 API server
│   ├── src/
│   │   ├── routes/           # auth, chat, conversations, admin, attachments, oauth, filters, models
│   │   ├── middleware/       # isAuthenticated, isAdmin, isNotBanned, CSRF
│   │   ├── services/         # auth, chat, webSearch, filterEngine
│   │   │   └── providers/     # openai.ts, anthropic.ts, base.ts (adapter pattern)
│   │   ├── index.ts          # Express app + middleware setup
│   │   └── config.ts         # config.json watcher + Zod validation
│   ├── prisma/
│   │   └── schema.prisma     # 18 models + 2 enums
│   └── seed.ts               # Admin user + sample data
├── frontend/             # React 19 + Vite 6
│   ├── src/
│   │   ├── pages/            # Login, Register, ChatLayout, AdminPanel, BannedPage
│   │   ├── components/       # chat/, sidebar/, admin/, workspace/, ui/
│   │   ├── stores/           # Zustand: authStore, chatStore, uiStore
│   │   └── lib/              # apiClient.ts, utils.ts, adminHooks.ts
│   └── vite.config.ts        # Dev proxy → localhost:4000
├── shared/               # Zod schemas + TypeScript types (shared across packages)
│   └── src/                  # message, conversation, auth, config, sse, attachment, etc.
├── data/
│   └── uploads/              # File upload storage
└── config.json               # Models + app configuration
```

---

## ⚙️ Configuration

Edit `config.json` in the project root to add model endpoints.

> [!WARNING]
> Never put API keys directly in `config.json`. Use environment variables referenced
> via `apiKeyEnv` — see the [Environment Variables](#environment-variables) section.

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

| Provider          | Adapter        | Endpoint Format        |
| ----------------- | -------------- | ---------------------- |
| OpenAI-compatible | `openai.ts`    | `/v1/chat/completions` |
| Anthropic Claude  | `anthropic.ts` | `/v1/messages`         |

The adapter is selected automatically based on `baseUrl`:

- `*anthropic.com*` → Claude adapter (`messages` API, `thinking` blocks)
- Everything else → OpenAI-compatible adapter (`chat/completions`, optional `reasoning_content`)

---

## 🌐 Environment Variables

<!-- Start Required -->
<details>
<summary><b>Required</b> — <code>JWT_ACCESS_SECRET</code>, <code>JWT_REFRESH_SECRET</code></summary>

| Variable             | Default | Notes                                 |
| -------------------- | ------- | ------------------------------------- |
| `JWT_ACCESS_SECRET`  | —       | Random string, at least 32 characters |
| `JWT_REFRESH_SECRET` | —       | Must be different from access secret  |

</details>
<!-- End Required -->

<!-- Start Server -->
<details>
<summary><b>Server</b> — <code>DATABASE_URL</code>, <code>PORT</code>, <code>NODE_ENV</code></summary>

| Variable         | Default                 | Notes                                 |
| ---------------- | ----------------------- | ------------------------------------- |
| `DATABASE_URL`   | `file:./data.db`        | SQLite file path                      |
| `PORT`           | `4000`                  | Backend listens on this port          |
| `NODE_ENV`       | `development`           | Set `production` for deployment       |
| `CORS_ORIGIN`    | `http://localhost:5173` | Frontend origin for CORS              |
| `SECURE_COOKIES` | `false`                 | Set `true` behind HTTPS reverse proxy |

</details>
<!-- End Server -->

<!-- Start Model API Keys -->
<details>
<summary><b>Model API Keys</b> — <code>NVIDIA_API_KEY</code>, <code>ANTHROPIC_API_KEY</code>, <code>OPENAI_API_KEY</code></summary>

| Variable            | For                         |
| ------------------- | --------------------------- |
| `NVIDIA_API_KEY`    | NVIDIA NIM models           |
| `ANTHROPIC_API_KEY` | Claude models               |
| `OPENAI_API_KEY`    | OpenAI-compatible endpoints |

</details>
<!-- End Model API Keys -->

<!-- Start Email (SMTP) -->
<details>
<summary><b>Email (SMTP)</b> — <code>SMTP_HOST</code>, <code>SMTP_PORT</code>, <code>SMTP_USER</code>, <code>SMTP_PASS</code>, <code>SMTP_FROM</code></summary>

| Variable    | Default | Notes                           |
| ----------- | ------- | ------------------------------- |
| `SMTP_HOST` | —       | SMTP server hostname            |
| `SMTP_PORT` | `587`   | SMTP port                       |
| `SMTP_USER` | —       | SMTP username                   |
| `SMTP_PASS` | —       | SMTP password                   |
| `SMTP_FROM` | —       | From-address for outgoing email |

</details>
<!-- End Email (SMTP) -->

<!-- Start OAuth -->
<details>
<summary><b>OAuth</b> — <code>GOOGLE_CLIENT_ID</code>, <code>GOOGLE_CLIENT_SECRET</code>, <code>GITHUB_CLIENT_ID</code>, <code>GITHUB_CLIENT_SECRET</code>, <code>DISCORD_CLIENT_ID</code>, <code>DISCORD_CLIENT_SECRET</code></summary>

| Variable                                      | Provider |
| --------------------------------------------- | -------- |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`   | Google   |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET`   | GitHub   |
| `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET` | Discord  |

</details>
<!-- End OAuth -->

---

## 🛠️ Development

```bash
# Install dependencies
pnpm install

# Generate Prisma client + create database + seed
pnpm --filter @open-arena/backend db:generate
pnpm --filter @open-arena/backend db:push
pnpm --filter @open-arena/backend db:seed

# Start dev servers (backend :4000, frontend :5173)
pnpm dev
```

### Useful Commands

| Command                                        | Purpose                                 |
| ---------------------------------------------- | --------------------------------------- |
| `pnpm dev`                                     | Start backend + frontend concurrently   |
| `pnpm build`                                   | Build frontend for production           |
| `pnpm start`                                   | Run production server                   |
| `pnpm test`                                    | Run all tests across packages           |
| `pnpm lint`                                    | ESLint across all packages              |
| `pnpm format`                                  | Prettier format                         |
| `pnpm typecheck`                               | TypeScript check across all packages    |
| `pnpm --filter @open-arena/backend db:studio`  | Open Prisma Studio (database GUI)       |
| `pnpm --filter @open-arena/backend db:migrate` | Create a migration after schema changes |

---

## 👑 Admin Panel

Access at **/admin** (requires ADMIN role). The seeded admin user is:

```
Email:    admin@openarena.local
Password: admin123
```

### Admin Features

- **Dashboard** — Active users, conversation counts, message volume charts (7d/30d/1y), top users
- **Users** — Search, paginated list, set role, ban/unban with reason, delete
- **Config** — Edit `config.json` in-browser with validation and auto-backup
- **Conversations** — Browse all conversations, search, delete
- **Filters** — Create/edit/delete sandboxed message transformation hooks
- **Announcements** — MOTD with Markdown, severity levels, scheduling
- **Audit log** — All admin actions with actor, target, and timestamp
- **Models** — Health check pings for all configured endpoints

---

## 🚢 Deployment

```bash
# Build frontend
pnpm build

# Start production server
NODE_ENV=production \
  JWT_ACCESS_SECRET="..." \
  JWT_REFRESH_SECRET="..." \
  DATABASE_URL="file:./data.db" \
  pnpm start
```

> [!TIP]
> We recommend running behind a reverse proxy (nginx, Caddy) that handles TLS
> termination. Set `SECURE_COOKIES=true` when behind HTTPS.

---

## 🔒 Security

- **CSRF** — Double-submit cookie pattern (exempts `/api/chat` and `/api/auth`)
- **Rate limiting** — Global 200 req/min, auth endpoints 20 req/15min
- **Account lockout** — 5 failed attempts → 15 minute lockout
- **CSP** — Tight Content-Security-Policy via Helmet
- **File uploads** — MIME whitelist, 20 MB limit, auth-protected downloads
- **No secrets in config** — API keys from env vars, referenced by name
- **Filter sandbox** — User-defined JS filters run in `node:vm` with timeout

<p align="center">
  <a href="#">⬆️ Back to top</a>
</p>

<p align="center">
  Built with ❤️ using TypeScript, React, and Express &middot;
  <a href="CONTRIBUTING.md">Contributing guide</a> &middot;
  <a href="ARCHITECTURE.md">Architecture docs</a>
</p>

<p align="center">
  <sub>MIT &mdash; see <a href="LICENSE">LICENSE</a> for details.</sub>
</p>
