# AKG ALGO

Institutional Algorithmic Trading Systems & Membership Platform.

## Architecture & Layout
```
apps/web        Next.js 16 app (user panel + admin panel)
apps/worker     background jobs (pg-boss)
packages/core   business rules as pure, tested functions (access control, money)
packages/db     Drizzle schema, migrations, seed
docs/  plans/   specs and phase task lists
```

## Quickstart

### Prerequisites
- Node.js LTS (>= 22)
- pnpm (>= 11.3.0)
- Docker & Docker Compose (or Podman)

### Setup & Run
```bash
# 1. Install workspace dependencies
pnpm install

# 2. Setup environment variables
cp .env.example .env

# 3. Start local Postgres
docker compose up -d db

# 4. Run migrations & seed base data
pnpm db:migrate
pnpm db:seed

# 5. Start development servers
pnpm dev         # Web app on http://localhost:3000
pnpm dev:worker  # Worker process
```

## Verification & Commands
```bash
pnpm typecheck   # TypeScript strict verification
pnpm lint        # ESLint
pnpm test        # Vitest suite
pnpm test:e2e    # Playwright E2E tests
pnpm build       # Full production build
pnpm db:generate # Generate Drizzle migration
pnpm db:migrate  # Run pending migrations
pnpm db:seed     # Load seed dataset
```

For operational runbooks and disaster recovery procedures, see [docs/RUNBOOK.md](docs/RUNBOOK.md).
