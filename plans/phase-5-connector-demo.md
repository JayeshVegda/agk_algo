# Phase 5 — Connector demo

**Goal:** the Connector UI and secure storage exist, demo-only.

## Tasks
- [ ] `connector_requests` table with ciphertext, nonce, key version
- [ ] Encrypt/decrypt module (AES-256-GCM or libsodium secretbox), key from `CONNECTOR_ENCRYPTION_KEY`, rotation by key version
- [ ] User form with prominent "demo account only" warning; masked saved entry; hard delete
- [ ] Mocked paper-trading status/results page (clearly labelled demo)
- [ ] Admin list; decryption only via an audit-logged action
- [ ] `CONNECTOR_REAL_MODE` flag defaulting to `false`; a test proving no outbound broker call occurs
- [ ] `docs/05-SECURITY.md` addendum: what is required before real mode (client sign-off, key management, read-only password or bridge service)

## Acceptance criteria
- Secret never appears in any response, log, or error
- Delete removes ciphertext
- Flag is false in all environments by default

## Verification
Connector tests from `docs/07-TESTING.md` §6.

## Progress Log
