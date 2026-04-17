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

Set `DATABASE_URL`, `JWT_SECRET` (≥ 16 characters), and `CORS_ORIGIN` (default `http://localhost:3000`).

Optional for the web app:

```bash
copy apps\web\.env.local.example apps\web\.env.local
```

## Install & database

From the repo root `CODE`:

```bash
npm install
npm run db:generate -w apps/api
npm run db:push -w apps/api
npm run db:seed -w apps/api
```

(`db:push` is fine for quick local dev; use `db:migrate` for production.)

## Development

```bash
npm run dev
```

- API: `http://localhost:4000` (health: `/health`)
- Web: `http://localhost:3000`

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
