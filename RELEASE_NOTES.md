## Open Arena v1.0.0

### Features
- **AI Chat** - SSE streaming with OpenRouter (Owl Alpha model)
- **Three-Panel Layout** - Sidebar, chat area, and workspace panel
- **Admin Panel** - User management, dashboard with charts, conversation browser, config viewer
- **Settings** - Theme toggle, font size, avatar color, compact mode
- **Auth** - JWT with httpOnly cookies, registration, login
- **Dark/Light Mode** - System preference with manual toggle
- **Markdown** - Syntax-highlighted code blocks, tables, blockquotes

### Tech Stack
- Frontend: React 19 + Vite + TypeScript + Tailwind CSS + Zustand
- Backend: Express + TypeScript + Prisma + SQLite
- Streaming: Server-Sent Events (SSE) proxy to OpenRouter

### Setup
1. Copy `.env.example` to `.env` and configure API keys
2. `cd backend && npx prisma db push && npx tsx seed.ts`
3. `cd backend && npx tsx src/index.ts`
4. `cd frontend && npm run dev`

### Default Admin
- Email: `admin@openarena.local`
- Password: `admin123`
