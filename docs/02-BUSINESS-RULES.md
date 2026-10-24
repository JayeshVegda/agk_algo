# 02 — Business Rules

These rules are the heart of the product. Implement them in `packages/core`, test them exhaustively, and do not re-implement them elsewhere.

## 1. Cycles
A **cycle** is an admin-defined subscription period.

Fields: `name`, `starts_on` (date), `ends_on` (date, inclusive), `status` (`draft | renewal_open | running | closed`), `renewal_opens_at`, `renewal_closes_at`, `renewal_audience` (`previous_members | everyone`), per-plan prices.

Rules:
- The admin decides start and end dates; they are **not** fixed to any day of the month.
- Cycles normally **do not overlap**. Block overlap by default; allow only with an explicit admin override (audit-logged).
- **Gaps are allowed.** A pause is just a period with no running cycle.
- Dates are evaluated in the admin-set `business_timezone` (IANA name). `ends_on` is inclusive until the end of that day.
- A user pays the **full price** to enrol in a cycle. **No proration.**
- Default: a user cannot join a cycle that is already running (`allow_mid_cycle_join = false`); they join the next cycle while it is in `renewal_open`. If the admin turns the setting on, the full price still applies.
- Renewal: before the next cycle starts, **previous members** get priority (`renewal_audience = previous_members`). The admin can later switch it to `everyone`.
- Non-renewal: when a cycle's `ends_on` passes, that enrolment ends. Access returns only if the user enrols in a later cycle.

### Worked example
| Cycle | Dates | Notes |
|---|---|---|
| C1 | 8 Sep – 8 Oct | running |
| (gap) | 9 Oct – 19 Oct | admin pause, no running cycle |
| C2 | 20 Oct – 20 Nov | renewal for C1 members opens e.g. 1 Oct |

User A paid C1 only; User B paid C1 and C2.

| Date | A has access? | B has access? | Dashboard shows |
|---|---|---|---|
| 7 Sep | no | no | "Next cycle starts 8 Sep" |
| 8 Oct | yes | yes | today's signals |
| 9 Oct | no | no | "Paused — next cycle starts 20 Oct" |
| 19 Oct | no | no | paused banner |
| 20 Oct | no (not renewed) | yes | A sees renew prompt; B sees signals |
| 21 Nov | no | no | cycle closed |

## 2. Access
`hasSignalAccess(user, planTier, now)` is true **only if** the user has an enrolment that is `paid` and not `refunded`, in a cycle whose date range contains `now` (business timezone), for the required tier.
- Evaluated **on every request** that returns signals. A nightly job must never be the only thing removing access.
- Default tier rule: one tier per enrolment; Perfect does **not** include SR signals. Keep this rule isolated in one function so it can change.
- **Archive visibility** when not subscribed: governed by setting `archive_visible_when_inactive` (default: visible to anyone who has ever had a paid enrolment).

## 3. Signals
Admin fields: `symbol`, `direction`, `entry`, `stop_loss`, `take_profits[]`, `note`, `image`, `plan_tier`, `status` (`draft | published | cancelled`), `published_at`.
Outcome (set later by admin): `win | loss | breakeven | cancelled`, `result_pips` and/or `result_r`, `closed_at`, `outcome_note`.
- Dashboard default: **today's published signals** for the user's tier, newest first.
- **Archive:** month-by-month browser, going back as far as data exists. Each month shows the signal list with outcomes and a computed **monthly summary** (count, wins, losses, breakeven, win rate, total pips/R). Summaries are computed from rows, never typed by hand.
- Signals are structured data, not chat messages.
- Show a disclaimer: signals are not financial advice.

## 4. Admin broadcast (one-way)
- Only admins can create messages. Users **cannot reply**.
- Fields: `body` (max 4,000 chars), optional attachment (image/PDF), `audience`, `pinned`, `requires_ack`, `deleted_at` (soft delete).
- Audience options: all users · active subscribers · members of a chosen cycle · a plan tier · a single user.
- Users see a feed with an unread badge. **Seen** is recorded when displayed; **acknowledged** is recorded when the user presses "Got it" (only for `requires_ack` messages). Neither sends anything back.
- Admin sees, per message: targeted count, seen count, acknowledged count, and who has not seen/acknowledged.
- Sending is a job-friendly operation so Telegram/WhatsApp forwarding can be added later (not in v1).

## 5. Bot store and licenses
- Admin manages bots: name, description, platform (`MT4 | MT5 | both`), price, images, private compiled files (`.ex4`/`.ex5`).
- Purchase uses the payment flow (`04-PAYMENTS.md`). On `confirmed` payment, create a license.
- License: `license_key`, `user_id`, `bot_id`, `bound_account_number` (nullable until bound), `status` (`active | revoked`).
- Users download through authenticated, short-lived signed URLs; the user may bind an MT account number (limited rebinds; admin can reset).
- Optional (Phase 4): rate-limited license-validation endpoint for the EA, returning only valid/invalid.

## 6. Connector (demo only)
- Form: platform (`MT4 | MT5`), account number, server, master password. Prominent warning: demo account only.
- With `CONNECTOR_REAL_MODE=false` the backend stores the request and shows a **mocked** paper-trading status page. It never contacts a broker.
- Credentials are encrypted at rest (see `05-SECURITY.md`), never returned to the browser after saving, never logged. Users can delete their entry (hard delete of ciphertext).

## 7. Registration and terms
- Registration requires an "I agree" checkbox. Store `terms_version`, `accepted_at`, and a hashed IP/user agent.
- When the admin publishes a new terms version, users must accept it on next login before continuing.

## 8. Reminders
Default reminder emails: 7, 3, and 1 days before a cycle's `ends_on` (admin-configurable), and when a renewal window opens.
