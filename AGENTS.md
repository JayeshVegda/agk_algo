# AGENTS.md — AKG ALGO

Briefing for coding agents. Deliberately short — only facts that hold for the code as it exists today.

## Status note on `docs/`
`docs/00-PRODUCT.md` (product scope, roles, plans) matches reality. The other docs (`01-ARCHITECTURE`, `02-BUSINESS-RULES`, `03-DATA-MODEL`, `04-PAYMENTS`, `05-SECURITY`, `06-SCREENS`, `07-TESTING`, `08-DEPENDENCIES`) were written during planning for a **Next.js + Postgres + Docker** stack that was **never built**. Treat those files as the product *intent*, not the implementation. For how anything actually works, read the code: the collection schema lives in `scripts/setup_pb.py`, server logic in `pb_hooks/akg.pb.js`, UI in `frontend/src/`.

## What this project is
A self-hosted membership website for a trading business: rolling **signal subscriptions** sold per 30-day cycle, **MT4/MT5 bot licenses** sold once (license key bound to a MetaTrader account number), a **Connector demo request** form, a shared **track record** page, and an iframe-free **admin panel** inside the same SPA. Payments are USDT (manual admin confirmation by TXID). Two roles only: `user`, `admin`.

## Actual stack
- **Backend:** PocketBase `v0.40.6` — one binary at `bin/pocketbase`, SQLite at `pb_data/`, JSVM hooks in `pb_hooks/akg.pb.js` (server rules: roles, entitlements, payments, broadcasts, aggregates). There is no separate web server, no Docker, no Postgres, no auth library.
- **Frontend:** React 19 + Vite 6 + Tailwind 4 in `frontend/`. A single SPA (`frontend/src/App.jsx`) switch-based on an `activeTab` state — there is no router library and no Next.js. Built output goes to `pb_public/`, which PocketBase serves statically.
- **Admin panel:** React components in `frontend/src/components/admin/`, talking to the same PocketBase collections.

## Commands (from the repo root)
- `npm run setup:db` — creates a fresh `pb_data/` from the schema in `scripts/setup_pb.py` (needs `.env` copied from `.env.example` first: superuser email/password, `AKG_SUPERUSER_URL`, etc.)
- `npm run harden:db` — `scripts/apply_hardening.py`: locks down API rules/visibility per collection
- `npm run serve` — runs PocketBase at `http://0.0.0.0:8095` with `--publicDir=pb_public --hooksDir=pb_hooks`; the rebuilt frontend is served at `/`, admin UI at `/_/`
- `npm run dev` — Vite dev server only (background: it still needs `npm run serve` for the PocketBase API on the configured port)
- `npm run build` — builds the frontend into `pb_public/` (this is what makes live changes visible through `serve`)
- There are **no** `pnpm`, `pnpm test`, `pnpm typecheck`, `docker compose`, or Drizzle/migration commands in this repo. Verification is: `npm run build` passes + spot-check the built site in a browser.
- Demo data: `python3 scripts/seed_demo.py` (only for local demoing — never on a real deployment).

## Layout
```
bin/pocketbase        the backend binary (gitignored build artifact)
pb_data/              SQLite db + uploaded files (gitignored)
pb_hooks/akg.pb.js    ALL server logic and API rules (JSVM, every request recalculates)
pb_public/            built frontend (gitignored output of npm run build)
frontend/             React SPA source
  src/App.jsx         tab switch + auth + routing between tabs
  src/components/     one file per tab/page, plus ui/ (Radix-based primitives), admin/, motion/
  src/lib/            pocketbase client, wallets/site-settings helpers
scripts/              setup_pb.py (schema), apply_hardening.py, seed_demo.py, backup_pb.sh
docs/                 product docs (see Status note above)
```

## Rules that never bend
1. **Authorization is server-side.** API rules in `scripts/setup_pb.py` + `scripts/apply_hardening.py` + checks in `pb_hooks/akg.pb.js` decide access. Hiding UI is not security.
2. **One entitlement function.** Who can see live signals is decided once in `pb_hooks/akg.pb.js`; never re-derive it in the client. The SPA renders from data the API already filtered.
3. Payment confirmation runs server-side in `pb_hooks/akg.pb.js` and is **idempotent** (TXID-unique check). Payments are admin-confirmed USDT transfers; there is no automatic payment provider today.
4. **Never log or return secrets**: passwords, trading-account credentials, license secrets, wallet keys. The track-record endpoint returns aggregates only, never signal entries.
5. Client-supplied payloads that reach a hook are validated there; render user/admin text as plain text, never raw HTML.
6. Timestamps stored/returned by PocketBase are UTC; cycle boundaries are 30 calendar days from activation (admin can adjust per cycle, dates entered by admin).
7. Every admin write through the hooks creates an audit trail entry where the hook provides one; direct `pb_admin` collection writes bypass hooks — prefer hook routes for anything with side effects.
8. The Connector is a **demo request** form only. It never connects to a broker. Do not add live-connection code.
9. **No fake statistics, testimonials, or invented performance claims.** Track record numbers come from real closed `signals` records via `/api/akg/track-record`; per-bot win rate/PF/drawdown render only from admin-entered `bots` fields. Never hardcode a performance number in the UI (fallback bot data ships with stats stripped).
10. Legal pages (`LegalPages.jsx`) and the registration consent checkbox are the only places risk/policy language lives — if a claim changes in copy, it must match those pages.

## Conventions
- Plain JSX + named exports; no TypeScript in this repo. Tailwind utility classes inline; shared classes (`.text-metallic`, `.surface-glass`, `.live-dot`, `.font-data`, `.safe-area-pb`) live in `frontend/src/index.css`.
- UI primitives in `frontend/src/components/ui/` (Button, Badge, Sheet, Accordion, etc.) — reuse before writing new ones.
- Motion: `Reveal` / `RevealGroup` / `RevealItem` wrappers around Framer Motion; `CountUp`, `Ticker`, `EquityCurve` for displays.
- Site-wide editable config (support email/Telegram, wallet addresses, payment toggles, landing announcement) is stored in PocketBase settings and read through `useSiteSettings()` in `frontend/src/lib/wallets.js`.
- Money is displayed as `USDT` strings/numbers, one-time or per-cycle. Never invent tax/fee logic client-side; checkout flows through `CheckoutPage.jsx` → hook endpoints.
- New tabs are added as components to `App.jsx`'s `TAB_ROUTES` map; the mobile bottom dock and the desktop navigation menu must both get the new entry.

## Working method
1. Make the smallest change that completes the task, in the file that already owns that behavior.
2. Run `npm run build` from the root; fix errors before claiming done.
3. Check the result visually: `npm run serve` serves the built bundle at `http://localhost:8095`; verify both desktop (≥1440px) and mobile (~390px, footer must clear the bottom dock).
4. Commit with a clear message, one logical change per commit.

## Gotchas
- `AGENTS.md` and `docs/01-ARCHITECTURE.md` used to describe a stack that was never implemented — trust this file and the code over the older docs.
- The PocketBase server only serves files built into `pb_public/`; editing `frontend/` does nothing visible until `npm run build`.
- Hooks run per-request in a JSVM: keep `pb_hooks/akg.pb.js` fast and stateless; restart `serve` after editing hooks.
- The mobile footer sits above a fixed bottom dock — any full-width block needs bottom padding (`pb-24 md:pb-10`, e.g. `Footer.jsx`).
- The `bots` collection may not contain performance stats; the landing page is written to render without them.

## When something is unclear
Read the code first; if the code and `docs/` disagree, the code wins (except product scope, where `00-PRODUCT.md` rules). If even the code is ambiguous, stop and ask.
