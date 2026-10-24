# Phase 5 — Connector demo

**Goal:** the Connector UI and secure storage exist, demo-only.

## Tasks
- [x] `connector_requests` table with ciphertext, nonce, key version
- [x] Encrypt/decrypt module (AES-256-GCM), key from `CONNECTOR_ENCRYPTION_KEY`, rotation by key version
- [x] User form with prominent "demo account only" warning; masked saved entry; hard delete
- [x] Mocked paper-trading status/results page (clearly labelled demo)
- [x] Admin list; decryption only via an audit-logged action
- [x] `CONNECTOR_REAL_MODE` flag defaulting to `false`; a test proving no outbound broker call occurs
- [x] `docs/05-SECURITY.md` addendum: what is required before real mode (client sign-off, key management, read-only password or bridge service)

## Acceptance criteria
- Secret never appears in any response, log, or error
- Delete removes ciphertext
- Flag is false in all environments by default

## Verification
Connector tests from `docs/07-TESTING.md` §6.

## Progress Log
- 2026-10-24: Created connector_requests table in Drizzle migration 0003.
- 2026-10-24: Implemented AES-256-GCM authenticated encryption in src/lib/connector-crypto.ts with unit tests.
- 2026-10-24: Built User Connector demo interface with mandatory warnings, masked passwords, hard-deletion, and live paper-trading telemetry status.
- 2026-10-24: Built Admin Connector portal with strictly audit-logged decryption action.
