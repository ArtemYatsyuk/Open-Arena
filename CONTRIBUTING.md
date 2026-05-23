# Contributing

## Prerequisites

- Node.js ≥ 20.10.0 (see `.nvmrc`)
- pnpm ≥ 10 (`npm i -g pnpm`)

## Setup

```bash
pnpm install
pnpm db:generate          # generate Prisma client
pnpm db:push              # sync database schema
pnpm db:seed              # create default admin (admin@openarena.local / admin123)
pnpm dev                  # start backend + frontend concurrently
```

## Scripts

| `pnpm <script>` | What it does                                     |
| --------------- | ------------------------------------------------ |
| `dev`           | Start backend (tsx watch) + frontend (Vite)      |
| `build`         | Build shared → backend → frontend                |
| `lint`          | ESLint across all packages                       |
| `format`        | Prettier write                                   |
| `typecheck`     | TypeScript `--noEmit` in all packages            |
| `test`          | Vitest (unit) across all packages                |
| `test:e2e`      | Playwright (requires `pnpm build && pnpm start`) |
| `db:migrate`    | Create/review Prisma migration                   |
| `db:studio`     | Open Prisma Studio for the SQLite DB             |

## Style

- ESLint + Prettier enforced via `lint-staged` on every commit.
- Types are inferred from Zod schemas in `shared/`. When you add a new DB
  field, update the Prisma schema, then the Zod schema in `shared/`, then
  generate the Prisma client.
- No `any` unless absolutely necessary. `unknown` preferred for values from
  external sources.
- Use `console.error` for errors, not `console.log`. Structured logging (pino)
  planned for a future phase.

## Commits

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add file upload support
fix: handle empty conversation title
chore: bump dependencies
docs: update API reference
refactor: extract chat adapter interface
```

## Pull Requests

1. Create a feature branch from `main`.
2. Ensure `pnpm lint`, `pnpm typecheck`, and `pnpm test` pass.
3. Add tests for new functionality.
4. Open a PR with a clear description and screenshots for UI changes.
