# Phase 1 — Core product

**Goal:** paying users see signals during the right cycles. This phase decides the product's correctness; review it carefully.

## Tasks
- [x] Tables + constraints: `plans`, `cycles`, `cycle_plan_prices`, `enrolments`, `payment_networks`, `payments`, `payment_events`, `signals`, `signal_outcomes`, `files`, `terms_versions`, `terms_acceptances`
- [x] `packages/core`: cycle validation (dates, overlap rule, status transitions, renewal window/audience)
- [x] `hasSignalAccess` with the full truth table from `docs/07-TESTING.md` (tests first)
- [x] `requireSignalAccess()` guard used by signals pages/APIs
- [x] Payment state machine + `confirmPayment()` transaction (idempotent) with tests
- [x] `manual_txid` provider: invoice page, TXID submission, unique TXID, admin approve/reject queue, networks config screen
- [x] Admin: Cycles screen (create/edit/pause, renewal window, prices), Enrolments, Payments, Settings
- [x] Admin: Signals table/form with image upload, publish/cancel, outcome entry
- [x] User: dashboard (cycle banner, today's signals), signal detail, archive by month with computed monthly summary
- [x] User: subscribe/renew flow, my payments
- [x] Terms acceptance at registration + re-acceptance on new version
- [x] Landing and pricing pages with risk disclaimer (no fake stats)
- [x] Seed script from `docs/07-TESTING.md`
- [x] E2E scenarios 1–4 from `docs/07-TESTING.md`

## Acceptance criteria
- The worked example in `docs/02-BUSINESS-RULES.md` passes as an automated test, day by day
- Duplicate TXID and double approval grant access once
- A user without entitlement cannot read signals via page or API
- Monthly summary numbers match fixtures

## Verification
Full test suite + e2e 1–4 + manual walkthrough with seed data.

## Progress Log
- 2026-10-24: Implemented all core product tables with Drizzle migration 0002.
- 2026-10-24: Tested cycle validation, overlap checking, and status transitions in @akg/core.
- 2026-10-24: Created manual TXID flow: invoice page, TXID submission, and atomic payment confirmation.
- 2026-10-24: Built Trader Dashboard, live signals display, monthly archive with computed statistical win-rate summary.
- 2026-10-24: Built Admin control center: Cycles management, Payments queue, Signals publisher & outcome recorder.
