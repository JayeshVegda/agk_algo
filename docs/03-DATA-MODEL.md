# 03 — Data Model

Starting point; refine through migrations. Use `uuid` primary keys, `created_at`/`updated_at` (timestamptz, UTC), integer minor units for money.

## Auth (generated)
Tables created by the Better Auth CLI (users, sessions, accounts, verification, 2FA). Do not hand-edit the generated auth schema. Add app columns on a separate `user_profiles` table (display name, role, terms status) rather than altering generated tables.

## Core tables
| Table | Key columns |
|---|---|
| `user_profiles` | user_id FK, role (`user|admin`), display_name, terms_version, terms_accepted_at |
| `terms_versions` | id, version, body, published_at |
| `terms_acceptances` | user_id, terms_version, accepted_at, ip_hash, user_agent_hash |
| `settings` | key (unique), value jsonb — business_timezone, allow_mid_cycle_join, archive_visible_when_inactive, reminder_days, paused_banner_text |
| `plans` | id, code (`SR_SIGNAL_BOX|PERFECT_SIGNAL_BOX`), name, active |
| `cycles` | id, name, starts_on, ends_on, status, renewal_opens_at, renewal_closes_at, renewal_audience |
| `cycle_plan_prices` | cycle_id, plan_id, price_minor, currency |
| `enrolments` | id, user_id, cycle_id, plan_id, payment_id, status (`pending|paid|refunded|expired`) |
| `payment_networks` | id, asset (e.g. USDT), network, label, address (manual), confirmations_required, invoice_ttl_minutes, enabled |
| `payments` | id, user_id, order_type (`enrolment|bot_purchase`), order_id, amount_minor, currency, asset, network_id, provider, provider_invoice_id, txid, status, expires_at, confirmed_at |
| `payment_events` | id, provider, external_event_id (unique per provider), payload jsonb, received_at, processed_at |
| `signals` | id, symbol, direction, entry, stop_loss, take_profits jsonb, note, image_file_id, plan_tier, status, published_at, created_by |
| `signal_outcomes` | signal_id (unique), outcome, result_pips, result_r, closed_at, note |
| `messages` | id, author_id, body, attachment_file_id, audience_type, audience_ref, pinned, requires_ack, created_at, deleted_at |
| `message_reads` | message_id, user_id, seen_at, acknowledged_at (PK message_id+user_id) |
| `bots` | id, name, description, platform, price_minor, currency, active |
| `bot_files` | id, bot_id, platform, storage_key, size, sha256 |
| `bot_licenses` | id, user_id, bot_id, license_key (unique), bound_account_number, rebind_count, status |
| `broker_links` | id, name, logo_file_id, url, description, sort_order, active |
| `resources` | id, kind (`pdf|video`), title, url_or_file_id, visibility, sort_order |
| `news_posts` | id, title, body, published_at |
| `social_links` | id, platform, url, active |
| `social_posts` | id, platform, title, image_file_id, url, published_at |
| `connector_requests` | id, user_id, platform, account_number, server, secret_ciphertext, secret_nonce, key_version, status, created_at |
| `files` | id, storage_key, mime, size, sha256, owner_id, visibility (`public|private`) |
| `audit_log` | id, actor_id, action, entity_type, entity_id, diff jsonb, ip_hash, created_at |

## Constraints and indexes (required)
- `cycles`: CHECK `ends_on >= starts_on`; **exclusion constraint** preventing overlapping date ranges unless an override flag is set (or enforce in a transaction with a lock if the exclusion constraint is impractical — document the choice).
- `enrolments`: partial unique index `(user_id, cycle_id, plan_id)` where status in (`pending`,`paid`).
- `payments`: unique `(network_id, txid)` where txid is not null.
- `payment_events`: unique `(provider, external_event_id)` for idempotency.
- `bot_licenses.license_key` unique.
- Indexes: `signals(plan_tier, published_at desc)`, `signals(published_at)`, `enrolments(user_id)`, `enrolments(cycle_id)`, `message_reads(user_id)`, `payments(status, expires_at)`, `audit_log(entity_type, entity_id)`.
- Foreign keys everywhere; `ON DELETE` behaviour chosen deliberately (never cascade-delete payments or audit rows).

## Derived data (never stored by hand)
Monthly signal summaries, active-member counts, revenue per cycle, per-message seen/ack counts — computed by queries.
