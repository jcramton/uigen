# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup        # First-time setup: install deps, generate Prisma client, run migrations
npm run dev          # Start dev server (localhost:3000) with Turbopack
npm run build        # Production build
npm run lint         # ESLint
npm run test         # Vitest (unit + component tests)
npm run db:reset     # Force-reset SQLite migrations (destructive)
```

Run a single test file: `npx vitest run src/components/__tests__/SomeComponent.test.tsx`

Environment: copy `.env` and add `ANTHROPIC_API_KEY`. The app works without it using mock responses.

## Architecture

UIGen is an AI-powered React component generator. Users describe components in chat; Claude generates code that runs in a live iframe preview — no files are written to disk.

### Request Flow

1. User submits a prompt in the chat panel
2. `POST /api/chat` receives the message plus the serialized virtual file system state
3. Claude (model: `claude-haiku-4-5`) processes it with two tools: `str_replace_editor` (create/edit files) and `file_manager` (rename/delete)
4. Tool calls mutate a `VirtualFileSystem` instance (in-memory only)
5. The preview iframe re-compiles and renders the updated files using `@babel/standalone`
6. On completion, project state (messages + VFS) is persisted to SQLite via Prisma (for authenticated users)

### Key Modules

- **`src/app/api/chat/route.ts`** — Core AI endpoint. Streams Claude responses, executes tool calls against VFS, returns updated file system on finish. 120s timeout.
- **`src/lib/file-system.ts`** — `VirtualFileSystem` class: in-memory tree, serialized to JSON for DB storage. All generated code lives here.
- **`src/lib/tools/`** — Claude tool implementations (`str-replace.ts`, `file-manager.ts`) that wrap VFS operations.
- **`src/lib/prompts/generation.tsx`** — System prompt instructing Claude to build React components with Tailwind CSS.
- **`src/lib/provider.ts`** — Exports the Claude model instance and a `MockLanguageModel` (used when no API key is set).
- **`src/lib/contexts/`** — `FileSystemContext` and `ChatContext` hold shared state; wrap the main UI.
- **`src/components/preview/PreviewFrame`** — Iframe that compiles JSX client-side via Babel and renders the VFS output.
- **`src/actions/`** — Next.js server actions for auth (`signUp`, `signIn`, `signOut`) and project CRUD.
- **`src/middleware.ts`** — Protects `/api/projects` and `/api/filesystem` routes with JWT session checks.

### Auth & Persistence

- JWT sessions (7-day, HTTP-only cookies) via `jose`; passwords hashed with `bcrypt`
- Prisma + SQLite: two models — `User` and `Project` (stores messages + VFS as JSON blobs)
- Anonymous mode is fully supported; projects only persist for authenticated users

### UI

- Next.js 15 App Router, React 19
- Split layout with resizable panels: left = chat, right = preview/code toggle
- shadcn/ui (New York style, Tailwind v4, Lucide icons) for UI primitives
- Monaco editor for code view; `react-resizable-panels` for layout

### Database

Always reference `prisma/schema.prisma` as the source of truth for DB structure before writing queries, migrations, or reasoning about data shape.

### Node Compatibility

`node-compat.cjs` is `--require`d on startup to delete `global.localStorage` and `global.sessionStorage` — a workaround for Node 25+ breaking SSR with Web Storage APIs.
