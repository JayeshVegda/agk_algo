# 01 — Architecture

## Shape
Modular monolith, self-hosted with Docker Compose. One web app (user + admin), one worker, one Postgres. Business rules live in `packages/core` as pure functions so they can be tested without a server.

```
Browser ──HTTPS──> Caddy ──> web (Next.js 16)  ──> Postgres
                              │  ^ SSE (admin broadcast)
                              └──> storage volume (images, PDFs, bot files)
worker (pg-boss) ────────────────> Postgres (same DB, own schema)
BTCPay Server (optional profile) ─webhooks─> web
```

## Services (Docker Compose)
| Service | Notes |
|---|---|
| `web` | Next.js 16 App Router, TypeScript. Server components and server actions/route handlers |
| `worker` | Runs scheduled and queued jobs |
| `db` | PostgreSQL, volume-backed, nightly backup job |
| `caddy` | Automatic HTTPS, reverse proxy, security headers |
| `btcpay` (+ its node/db) | Optional compose profile, enabled only when `PAYMENTS_BTCPAY_ENABLED=true` |

## Layers
1. **Route/action layer** (`apps/web`): parse input (Zod), authenticate, authorize, call core, return result. No business rules here.
2. **Core** (`packages/core`): access control, cycles, enrolments, payment state transitions, signal summaries, message audiences. Pure where possible; takes a DB handle or repository interface for persistence.
3. **DB** (`packages/db`): Drizzle schema, migrations, seed, query helpers.
4. **Worker** (`apps/worker`): thin job handlers that call core.

## Cross-cutting
- **Auth:** Better Auth with email+password, email verification, password reset; admin 2FA (TOTP). Role stored on the user. Session cookies httpOnly, secure, sameSite.
- **Authorization helpers:** `requireUser()`, `requireAdmin()`, `requireSignalAccess(plan)` — used by every route/action.
- **Realtime:** Server-Sent Events endpoint streams new broadcast messages to logged-in users; polling fallback every 30 s.
- **Storage:** `StorageProvider` interface (local volume now, S3-compatible later). Private files served only through authenticated, short-lived signed URLs.
- **Jobs:** cycle status changes, renewal reminders, payment re-checks, expired-invoice cleanup, backups trigger. Jobs are conveniences; request-time checks remain authoritative.
- **Config:** all settings from environment (`.env.example`) or the `settings` table (admin-editable).
- **Observability:** structured JSON logs (pino), request id on every log line, `/healthz` endpoint.

## Deployment
- `docker compose up --build` must work from a clean clone with only `.env` filled in.
- Nightly `pg_dump` to a backup directory plus an off-server copy; restore procedure documented in `docs/RUNBOOK.md` (create in Phase 4).
- Zero secrets in images or repo.
