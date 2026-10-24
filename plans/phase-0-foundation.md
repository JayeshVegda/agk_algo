# Phase 0 — Foundation

**Goal:** a clean repo that runs, builds, tests, and has auth, roles, audit log, and settings.

## Tasks
- [x] Initialise pnpm workspace: `apps/web`, `apps/worker`, `packages/core`, `packages/db`
- [x] Next.js 16 + TypeScript strict + Tailwind + shadcn/ui in `apps/web`; dark theme tokens; base layout; central strings file
- [x] ESLint, Prettier, `typecheck`, Vitest, Playwright configured; scripts named exactly as in `AGENTS.md`
- [x] Docker Compose: `db`, `web`, `worker`, `caddy`; `.env` loading; `/healthz`
- [x] Drizzle setup, first migration, seed scaffold
- [x] Better Auth: register, email verification, login, logout, password reset; schema generated via its CLI
- [x] `user_profiles` (role, terms); `requireUser()` / `requireAdmin()` guards
- [x] Admin invite flow + TOTP 2FA (admin only) + shorter admin sessions
- [x] `settings` table with typed getters (business timezone, flags)
- [x] `audit_log` table and `writeAudit()` helper
- [x] pino logging with request ids; error boundary pages
- [x] CI pipeline: install, typecheck, lint, test, dependency audit
- [x] README (setup + run) and `docs/RUNBOOK.md` stub

## Acceptance criteria
- `docker compose up --build` works from a clean clone with only `.env` filled in
- A user can register, verify email, log in, reset password; an invited admin must complete 2FA
- A normal user receives 403 on a sample admin route (test exists)
- CI is green

## Verification
`pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e`

## Progress Log
- 2026-10-24: Initialized pnpm monorepo workspace (apps/web, apps/worker, packages/core, packages/db).
- 2026-10-24: Built pure business logic (hasSignalAccess, integer money) in @akg/core with 15 passing Vitest tests.
- 2026-10-24: Implemented Drizzle ORM schema with Better Auth + TwoFactor + user_profiles + settings + audit_log; generated initial migrations.
- 2026-10-24: Scaffolded Next.js 16 App Router web app with Turbopack, Tailwind CSS, dark trading terminal styling, proxy.ts middleware for request ID injection, pino logging, error boundaries, and healthz endpoint.
- 2026-10-24: Configured worker with pg-boss, Docker Compose (web, worker, db, caddy), GitHub Actions CI, and verified typecheck, lint, test, and build all pass cleanly.
