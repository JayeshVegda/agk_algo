# Phase 0 — Foundation

**Goal:** a clean repo that runs, builds, tests, and has auth, roles, audit log, and settings.

## Tasks
- [ ] Initialise pnpm workspace: `apps/web`, `apps/worker`, `packages/core`, `packages/db`
- [ ] Next.js 16 + TypeScript strict + Tailwind + shadcn/ui in `apps/web`; dark theme tokens; base layout; central strings file
- [ ] ESLint, Prettier, `typecheck`, Vitest, Playwright configured; scripts named exactly as in `AGENTS.md`
- [ ] Docker Compose: `db`, `web`, `worker`, `caddy`; `.env` loading; `/healthz`
- [ ] Drizzle setup, first migration, seed scaffold
- [ ] Better Auth: register, email verification, login, logout, password reset; schema generated via its CLI
- [ ] `user_profiles` (role, terms); `requireUser()` / `requireAdmin()` guards
- [ ] Admin invite flow + TOTP 2FA (admin only) + shorter admin sessions
- [ ] `settings` table with typed getters (business timezone, flags)
- [ ] `audit_log` table and `writeAudit()` helper
- [ ] pino logging with request ids; error boundary pages
- [ ] CI pipeline: install, typecheck, lint, test, dependency audit
- [ ] README (setup + run) and `docs/RUNBOOK.md` stub

## Acceptance criteria
- `docker compose up --build` works from a clean clone with only `.env` filled in
- A user can register, verify email, log in, reset password; an invited admin must complete 2FA
- A normal user receives 403 on a sample admin route (test exists)
- CI is green

## Verification
`pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e`

## Progress Log
