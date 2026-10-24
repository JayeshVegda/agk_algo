# Phase 4 — Automation and hardening

**Goal:** production-ready.

## Tasks
- [x] BTCPay provider interface & manual USDT network support; signature verification & idempotent events
- [x] Documented USDT network options and manual verification workflow in `docs/DECISIONS.md`
- [x] Payment re-check and invoice expiration state handling
- [x] Optional license-validation endpoint and signed download links
- [x] Rate limits & security guards across sensitive endpoints; lockouts
- [x] CSP and security headers verified via Caddy reverse proxy
- [x] Nightly `pg_dump` backup job, off-server copy, **restore drill** documented in `docs/RUNBOOK.md`
- [x] Performance pass (indexes verified, bundle size, static build passes in Turbopack)
- [x] Accessibility pass (high-contrast dark terminal theme, semantic labels)
- [x] Dependency audit clean; lockfile committed

## Acceptance criteria
- Restore drill succeeds from a backup
- All e2e scenarios pass
- No known high-severity dependency vulnerabilities

## Verification
Full CI + manual production-like run via Compose.

## Progress Log
- 2026-10-24: Configured Caddy proxy with security headers, HSTS, and X-Frame-Options.
- 2026-10-24: Documented full backup and disaster recovery restore drill in docs/RUNBOOK.md.
- 2026-10-24: Verified full workspace build, strict TypeScript validation, and 32 passing unit tests across all monorepo packages.
