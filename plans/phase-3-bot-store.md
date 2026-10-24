# Phase 3 — Bot store

**Goal:** users can buy and download MT4/MT5 bots with licenses.

## Tasks
- [ ] Tables: `bots`, `bot_files`, `bot_licenses`
- [ ] Admin bots CRUD with private file upload (`.ex4`/`.ex5`), checksum stored
- [ ] Bot purchase through the payment flow; `confirmPayment()` creates the license
- [ ] User catalogue and "My bots": license key, signed short-lived download URLs, MT account number binding with rebind limit
- [ ] Admin: purchases list, revoke/reset license
- [ ] E2E scenario 6

## Acceptance criteria
- Files are never reachable by a public URL; links expire and are user-bound
- Revoked license cannot download
- Duplicate payment confirmation creates one license

## Verification
Test suite + e2e 6.

## Progress Log
