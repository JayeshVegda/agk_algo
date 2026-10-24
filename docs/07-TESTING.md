# 07 — Testing

Tools: Vitest (unit/integration), Playwright (end-to-end). CI runs typecheck, lint, tests, and dependency audit. Write core tests **before** UI.

## 1. Access control truth table (unit tests for `hasSignalAccess`)
Use the worked example in `02-BUSINESS-RULES.md` (C1 8 Sep–8 Oct, gap, C2 20 Oct–20 Nov) plus:
| Case | Expected |
|---|---|
| Before cycle start | no |
| First day / last day (inclusive) of cycle | yes |
| Day after `ends_on` | no |
| During a gap | no |
| Paid but cycle status `draft` | no |
| Enrolment `pending` / `refunded` / `expired` | no |
| Wrong tier | no |
| Midnight boundary in business timezone vs UTC (e.g. Asia/Kolkata, America/New_York) | follows business timezone |
| Mid-cycle join with setting off / on | blocked / allowed at full price |
| Renewal window: previous member vs new user | previous member allowed; new user blocked until audience = everyone |
| Overlapping cycle creation | rejected without override |

## 2. Payment tests
Idempotent confirmation (run twice → one enrolment) · duplicate TXID · underpay/overpay/late · invalid webhook signature rejected · concurrent approval · illegal state transition throws · enrolment created in same transaction as status change.

## 3. Authorization tests
- Every admin route/action returns 403 for a normal user and redirects anonymous users to login.
- User cannot read another user's payment, license, connector entry, or message state.
- User without entitlement cannot read today's signals (API and page).
- Non-admin cannot call the broadcast send endpoint.

## 4. Broadcast tests
Audience resolution for each audience type · seen recorded once · acknowledge recorded once · soft-deleted messages hidden from users · admin counts correct.

## 5. Signals tests
Monthly summary calculation (counts, win rate, pips/R) with known fixtures · month navigation · tier filtering.

## 6. Connector tests
Encrypt/decrypt round-trip · secret never present in any API response or log output · delete removes ciphertext · `CONNECTOR_REAL_MODE=false` makes no outbound broker call.

## 7. End-to-end scenarios (Playwright)
1. Register → verify email → accept terms → subscribe to next cycle → submit TXID → admin approves → user sees today's signals.
2. Cycle ends → access removed → renewal window → user renews → access returns.
3. Admin pauses (gap) → user sees paused banner → archive still visible per setting.
4. Admin publishes a signal → user dashboard shows it → admin records outcome → archive summary updates.
5. Admin sends broadcast to "active subscribers" → subscriber sees unread badge → "Got it" → admin sees acknowledgement.
6. Buy a bot → payment approved → license appears → signed download works → link expires.
7. Admin login requires 2FA.
8. Security headers and CSP present on key pages.

## 8. Seed data (`pnpm db:seed`)
1 admin (2FA bypass only in dev) · 8 users in different states (never paid, paid C1 only, paid C1+C2, pending payment, refunded, expired) · 3 cycles including a one-week gap · ~60 signals over 3 months with mixed outcomes across both tiers · 5 broadcast messages with different audiences · 3 bots · 2 payment networks (manual).
