# Playbook — Anything that changes who can see signals
This touches the most sensitive rule in the product.
1. Read `docs/02-BUSINESS-RULES.md` §1–2 and the truth table in `docs/07-TESTING.md`.
2. Change **only** `hasSignalAccess` (and its helpers) in `packages/core`. Do not add parallel checks in routes or components.
3. Add or update test cases first (before, first day, last day, after, gap, tier, status, timezone boundary).
4. Re-run the authorization tests (no entitlement → no signals via page and API).
5. Record the change in `docs/DECISIONS.md`. If it widens access, treat it as BLOCKING and ask.
