# RUNBOOK — AKG ALGO Operations

## 1. Local Development Quickstart

### Prerequisites
- Node.js LTS (>= 22)
- pnpm (>= 11.3.0)
- Docker & Docker Compose (or Podman Compose)

### Setup Steps
```bash
# 1. Clone repository and install dependencies
pnpm install

# 2. Configure environment
cp .env.example .env

# 3. Start local PostgreSQL
docker compose up -d db

# 4. Apply schema migrations
pnpm db:migrate

# 5. Seed initial data
pnpm db:seed

# 6. Start development servers
pnpm dev         # Web application on http://localhost:3000
pnpm dev:worker  # Background worker (separate terminal)
```

## 2. Verification Commands
- `pnpm typecheck` — TypeScript checks across all workspace packages
- `pnpm lint` — ESLint validation
- `pnpm test` — Unit & integration tests (Vitest)
- `pnpm test:e2e` — Playwright end-to-end tests

## 3. Production Deployment (Docker Compose)
```bash
docker compose up --build -d
```
All services (`web`, `worker`, `db`, `caddy`) will launch with auto-restart. Health checks are monitored via `/healthz`.

## 4. Database Operations
- **Create migration:** `pnpm db:generate`
- **Apply migration:** `pnpm db:migrate`
- **Nightly backup:** (Detailed in Phase 4) `pg_dump -Fc -U postgres akg_algo > backups/backup_$(date +%Y%m%d).dump`
