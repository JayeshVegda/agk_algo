# Phase 1 — Core product

**Goal:** paying users see signals during the right cycles. This phase decides the product's correctness; review it carefully.

## Tasks
- [ ] Tables + constraints: `plans`, `cycles`, `cycle_plan_prices`, `enrolments`, `payment_networks`, `payments`, `payment_events`, `signals`, `signal_outcomes`, `files`, `terms_versions`, `terms_acceptances`
- [ ] `packages/core`: cycle validation (dates, overlap rule, status transitions, renewal window/audience)
- [ ] `hasSignalAccess` with the full truth table from `docs/07-TESTING.md` (tests first)
- [ ] `requireSignalAccess()` guard used by signals pages/APIs
- [ ] Payment state machine + `confirmPayment()` transaction (idempotent) with tests
- [ ] `manual_txid` provider: invoice page, TXID submission, unique TXID, admin approve/reject queue, networks config screen
- [ ] Admin: Cycles screen (create/edit/pause, renewal window, prices), Enrolments, Payments, Settings
- [ ] Admin: Signals table/form with image upload, publish/cancel, outcome entry
- [ ] User: dashboard (cycle banner, today's signals), signal detail, archive by month with computed monthly summary
- [ ] User: subscribe/renew flow, my payments
- [ ] Terms acceptance at registration + re-acceptance on new version
- [ ] Landing and pricing pages with risk disclaimer (no fake stats)
- [ ] Seed script from `docs/07-TESTING.md`
- [ ] E2E scenarios 1–4 from `docs/07-TESTING.md`

## Acceptance criteria
- The worked example in `docs/02-BUSINESS-RULES.md` passes as an automated test, day by day
- Duplicate TXID and double approval grant access once
- A user without entitlement cannot read signals via page or API
- Monthly summary numbers match fixtures

## Verification
Full test suite + e2e 1–4 + manual walkthrough with seed data.

## Progress Log
