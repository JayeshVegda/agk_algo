# 05 — Security

## Authentication and sessions
- Email + password with verification and reset; passwords hashed by the auth library (argon2id or equivalent strong default — verify in its docs).
- **Admins:** invite-only, mandatory TOTP 2FA, shorter session lifetime, session list with revoke.
- Rate-limit login, registration, password reset, TXID submission, and license validation. Lock out after repeated failures.

## Authorization
- Every route/action calls a guard (`requireUser`, `requireAdmin`, `requireSignalAccess`). Add an automated test that walks every admin route as a normal user and expects 403.
- Row-level ownership checks: a user can only read their own payments, licenses, connector requests, and message state.

## Web hardening
- HTTPS only, HSTS; secure, httpOnly, sameSite cookies; CSRF protection on state-changing requests.
- Content-Security-Policy allowing only what is needed: TradingView widget hosts and video embed hosts (YouTube/Vimeo if used). Load widget scripts only on pages that use them.
- Plain-text or sanitised-Markdown rendering for all admin/user text. No `dangerouslySetInnerHTML` without sanitisation and a comment.
- File uploads: allow-list MIME types and sizes, randomise filenames, store outside the web root, verify magic bytes, never execute uploads.
- Private downloads (bot files, paid PDFs) via signed URLs that expire quickly and are bound to the user.

## Secrets and data
- Secrets only in environment/secret store; `.env` is git-ignored; `.env.example` has no real values.
- **Connector credentials:** encrypt with AES-256-GCM (or libsodium secretbox). Key from `CONNECTOR_ENCRYPTION_KEY`, never the DB. Store nonce + ciphertext + key version so keys can rotate. Decrypt only in one dedicated server function used by an audit-logged admin action. Never return the secret to the browser after save; show masked. Users can hard-delete their entry.
- Never log: passwords, secrets, license keys in full, webhook bodies containing secrets.
- Audit every admin write and every credential decryption.

## Payments safety
- Idempotent processing; unique TXID per network; verify webhook signatures; admin approval is audit-logged with the admin id; refunds require a reason.

## Operations
- Dependency audit in CI; pinned versions via lockfile; update regularly.
- Backups tested: a restore drill is part of Phase 4 and written in `docs/RUNBOOK.md`.
- Security headers verified in an e2e test.

## Going beyond demo (Connector)
Flipping `CONNECTOR_REAL_MODE` requires explicit client sign-off, stricter key management, a preference for read-only (investor) passwords or a vetted bridge service, and updated user-facing terms. The agent must not enable it.
