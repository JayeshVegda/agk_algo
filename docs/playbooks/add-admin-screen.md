# Playbook — Add or change an admin screen
1. Check the screen's row in `docs/06-SCREENS.md`; implement all four states (loading, empty, error, permission denied).
2. Guard the page and every action with `requireAdmin()`. No client-only checks.
3. Validate input with Zod; keep business rules in `packages/core`.
4. Write an `audit_log` row for every write (actor, action, entity, diff).
5. Add a test: normal user gets 403; admin succeeds; audit row created.
6. Check keyboard navigation and mobile layout.
