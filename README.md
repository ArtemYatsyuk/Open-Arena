# Open Arena

A modern AI chatbot platform with multi-model support, web search with citations, a filter/hooks system, and an admin panel for user management and analytics.

![GitHub Release](https://img.shields.io/github/v/release/ArtemYatsyuk/Open-Arena)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **Multi-Model AI Chat** — Switch between AI models seamlessly with a polished chat interface
- **Regenerate & Version History** — Re-generate AI responses; all versions are preserved and navigable via `‹ 1/2 ›` arrows below each response
- **Conversation URLs** — Each chat has a unique URL (`/c/:uuid`) for direct linking and browser navigation
- **Reasoning Toggle** — Enable/disable model reasoning (thinking) per-session via the Brain toggle in the input bar
- **Web Search & Citations** — Toggle web search per-message; results are cited with clickable `[1]`, `[2]` source links and a collapsible search-results panel
- **Filter System** — Admin-defined JavaScript hooks (`inlet`/`outlet`) that intercept every chat request — rate limiting, moderation, analytics, etc.
- **Markdown & Math Rendering** — Full support for Markdown, LaTeX math, and syntax-highlighted code blocks
- **Mermaid Diagrams** — Render flowcharts, sequence diagrams, and more inline
- **Admin Panel** — User management, conversation browser, analytics dashboard, config editor, and filter manager
- **In-App Docs** — Comprehensive documentation with chapter navigation in Settings → Docs
- **Role-Based Access** — User and admin roles with ban/unban functionality
- **Responsive Design** — Built with Tailwind CSS, optimized for all screen sizes

## Tech Stack

### Frontend
- React 19 + TypeScript
- Vite 6
- Tailwind CSS 3
- Zustand (state management)
- React Router 6
- Lucide React (icons)
- Recharts (analytics)
- React Markdown + KaTeX + Mermaid
- Prism syntax highlighting

### Backend
- Node.js + Express
- TypeScript
- Prisma ORM (SQLite)
- JWT authentication
- bcryptjs password hashing
- Zod validation
- VM sandbox (filter engine)

## Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- PostgreSQL (or configure your preferred database in Prisma)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ArtemYatsyuk/Open-Arena.git
   cd Open-Arena
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd frontend && npm install && cd ..
   cd backend && npm install && cd ..
   ```

3. **Configure environment**
   ```bash
   cp backend/.env.example backend/.env
   ```
   Edit `backend/.env` with your database URL, JWT secret, and API keys.

4. **Set up the database**
   ```bash
   npm run db:generate
   npm run db:push
   npm run db:seed
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:3000`

### Production Build

```bash
npm run build
npm run start:prod
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start frontend and backend in development mode |
| `npm run dev:frontend` | Start frontend only |
| `npm run dev:backend` | Start backend only |
| `npm run build` | Build both frontend and backend (run after filter changes) |
| `npm run start:prod` | Start production server |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to database |
| `npm run db:seed` | Seed database with initial data |
| `npm run db:studio` | Open Prisma Studio |

## Project Structure

```
Open-Arena/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── admin/        # Admin panel components
│   │   │   ├── chat/         # Chat interface components
│   │   │   ├── sidebar/      # Sidebar navigation
│   │   │   ├── ui/           # Reusable UI components
│   │   │   └── workspace/    # Code workspace panel
│   │   ├── pages/            # Page components
│   │   ├── stores/           # Zustand state stores
│   │   ├── utils/            # Utility functions
│   │   ├── index.css         # Global styles
│   │   └── App.tsx           # Root component
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── routes/           # Express route handlers (auth, chat, admin, filters...)
│   │   ├── services/         # Business logic (chat, auth, web search, filter engine)
│   │   ├── middleware/       # Auth and error middleware
│   │   └── index.ts          # Server entry point
│   ├── prisma/
│   │   └── schema.prisma     # Database schema
│   └── package.json
└── package.json              # Root workspace config
```

## Default Accounts

After seeding, the following accounts are available:

| Email | Password | Role |
|-------|----------|------|
| admin@openarena.com | admin123 | Admin |
| user@openarena.com | user123 | User |

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License — see LICENSE for details.
