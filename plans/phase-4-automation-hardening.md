# Phase 4 — Automation and hardening

**Goal:** production-ready.

## Tasks
- [ ] BTCPay provider behind `PAYMENTS_BTCPAY_ENABLED`; webhook signature verification; idempotent events
- [ ] Prove each wanted USDT network on test infrastructure; write results in `docs/PAYMENTS-NETWORKS.md` (do not enable in production without sign-off — BLOCKING)
- [ ] Payment re-check and expired-invoice jobs
- [ ] Optional license-validation endpoint (rate-limited, returns valid/invalid only)
- [ ] Rate limits on all sensitive endpoints; lockouts
- [ ] CSP and security headers verified by e2e (scenario 8); admin 2FA e2e (scenario 7)
- [ ] Nightly `pg_dump` backup job, off-server copy, **restore drill** documented in `docs/RUNBOOK.md`
- [ ] Performance pass (indexes verified with `EXPLAIN`, image sizes, bundle size)
- [ ] Accessibility pass (keyboard, contrast, labels)
- [ ] Dependency audit clean; lockfile committed

## Acceptance criteria
- Restore drill succeeds from a backup
- All e2e scenarios 1–8 pass
- No known high-severity dependency vulnerabilities

## Verification
Full CI + manual production-like run via Compose.

## Progress Log
