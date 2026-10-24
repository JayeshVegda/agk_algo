# Phase 3 — Bot store

**Goal:** users can buy and download MT4/MT5 bots with licenses.

## Tasks
- [x] Tables: `bots`, `bot_files`, `bot_licenses`
- [x] Admin bots CRUD with private file upload (`.ex4`/`.ex5`), checksum stored
- [x] Bot purchase through the payment flow; `confirmPayment()` creates the license
- [x] User catalogue and "My bots": license key, signed short-lived download URLs, MT account number binding with rebind limit
- [x] Admin: purchases list, revoke/reset license
- [x] E2E scenario 6

## Acceptance criteria
- Files are never reachable by a public URL; links expire and are user-bound
- Revoked license cannot download
- Duplicate payment confirmation creates one license

## Verification
Test suite + e2e 6.

## Progress Log
- 2026-10-24: Created bots, bot_files, and bot_licenses tables in Drizzle migration 0003.
- 2026-10-24: Built Admin bot catalog management and license directory.
- 2026-10-24: Built User bot store with purchase checkout, license keys, MetaTrader account binding (max 3 rebinds), and HMAC-signed time-limited download route (/api/downloads/bot).
