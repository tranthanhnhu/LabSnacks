# Kawaii Lab Snacks — Monorepo

Full-stack **MVC (API)** + **Next.js (View)** + **MySQL** + **Observer** (low-stock alerts) + **Factory** (notification payloads).

## Structure

- `apps/api` — Express + Prisma + MySQL
- `apps/web` — Next.js (App Router) + Tailwind CSS v4 + TanStack Query

## Prerequisites

1. **Node.js 20+** and **MySQL 8**.
2. Create a database (e.g. `kawaii_lab`).

## Environment

```bash
copy apps\api\.env.example apps\api\.env
```

Set `DATABASE_URL`, `JWT_SECRET` (≥ 16 characters), and `CORS_ORIGIN` (default allows `http://localhost:3000` and common fallback ports like 3001/3002).

Optional for the web app:

```bash
copy apps\web\.env.local.example apps\web\.env.local
```

## Install & database

From the repo root `CODE`:

```bash
copy apps\api\.env.example apps\api\.env
# edit apps\api\.env (DATABASE_URL, JWT_SECRET, ...)

npm install
npm run setup
```

(`db:push` is fine for quick local dev; use `db:migrate` for production.)

### Windows note (Prisma EPERM)

If you see `EPERM: operation not permitted, rename ... query_engine-windows.dll.node`, it usually means the Prisma engine is locked by a running Node process (API/dev server) or antivirus scanning.

Fix:

1) Stop dev servers (make sure nothing is listening on `:4000`)
2) Delete `node_modules/.prisma`
3) Re-run:

```bash
npm install
npm run db:generate
```

## Development

```bash
npm run dev
```

- API: `http://localhost:4000` (health: `/health`)
- Web: `http://localhost:3000`

Run separately if needed:

```bash
npm run dev:api
npm run dev:web
```

If you want API hot reload:

```bash
npm run dev:watch -w apps/api
```

## Seed accounts (password `demo123`)

| Email               | Role    |
|---------------------|---------|
| admin@kawaii.lab    | ADMIN   |
| manager@kawaii.lab  | MANAGER |
| staff@kawaii.lab    | STAFF   |

## Patterns (summary)

- **MVC (server):** HTTP wiring in `routes/v1.ts`, business logic in `services/`, data access via Prisma.
- **Observer:** `StockSubject` + `LowStockObserver` — when stock crosses below threshold, notify Admin/Manager.
- **Factory:** `NotificationFactory` — builds notification content (low-stock, restock, …).

## UI reference

Mock HTML and design tokens: `DOC/`.
