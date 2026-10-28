# DEPLOY.md — AKG ALGO deployment runbook

Split-stack layout: **SPA → Vercel**, **PocketBase (API + hooks + static guía files) → PocketBase Cloud**.
Locally everything still runs same-origin (`npm run serve` at :8095, SPA built into `pb_public/`) — that path is untouched.

## What the deployment task is

| Piece | Hosts | Ships |
| --- | --- | --- |
| React SPA (`frontend/`) | Vercel | `npm run build:vercel` → `dist/` |
| PocketBase backend | PocketBase Cloud (project **"Gojo Vegda's Project"**) | `pb_hooks/` + custom routes; collections via setup script or backup restore |
| Binaries & demo files (`downloads/`) | PocketBase Cloud static dir | served at `/downloads/...` from the PB origin |
| Data (`pb_data/`) | PocketBase Cloud instance | restore the local backup (see below) |

## 0. One-time frontend change (already in repo)

`frontend/src/lib/pocketbase.js` reads **`VITE_PB_URL`**. Unset → `window.location.origin`
(same-origin, local dev works as before). Set → every `pb.*` call, subscription and
asset link points at the PocketBase origin.

## 1. Deploy the PocketBase backend (PocketBase Cloud)

```bash
pbc project use "Gojo Vegda's Project"
pbc pocketbase ls            # confirm/create the instance
# upload hooks & static extras (verify exact command with `pbc --help`):
pbc pocketbase deploy        # or: pbc deploy
```

Then bring the schema + demo state up by **either**:

- **Fresh schema:** point the setup script at the cloud instance with a cloud
  superuser token: `AKG_SUPERUSER_URL=https://<instance-host> python3 scripts/setup_pb.py`,
  then `scripts/apply_hardening.py`, then seed if wanted (`python3 scripts/seed_demo.py`).
- **Restore the local backup:** take a backup from the running local instance
  (`http://127.0.0.1:8095/_/` → Settings → Backups, or `POST /api/backups`) and
  restore it on the cloud instance. Carries all demo/test data — decide before restoring.

Do **not** upload `pb_data/` as files; it belongs to the instance.

After deploy, open `https://<instance-host>/_/` → create the superuser → check
Settings → Application → **CORS**: the Vercel domain (or `*`) must be allowed,
otherwise every browser request fails preflight.

## 2. Deploy the SPA (Vercel)

```bash
cd frontend
vercel login
vercel link            # project name: akg-algo (root dir = frontend/)
vercel env add VITE_PB_URL production    # value: https://<instance-host>, no trailing slash
vercel --prod
```

- `vercel.json` (in `frontend/`) sets `build:vercel` → `dist/` + SPA rewrite to `index.html`.
- After the first deploy, when asked "In which directory is your code?" answer the
  repo root and set **Root Directory = frontend**, or just run vercel from inside `frontend/`.
- `frontend/.env.example` documents the variable.

## 3. Post-deploy checklist

1. `https://<vercel-domain>/` loads; login works (auth uses the `Authorization`
   header + localStorage token, so cross-origin auth needs only CORS, no cookies).
2. `/signals` shows signals only when logged in with an active cycle (server-filtered).
3. `/bots` catalog + `/bots/akg-gold-trap-ea` product page loads; images resolve.
4. Checkout submits a payment; admin console `/<vercel>/admin?s=...` — wait, admin
   is part of the same SPA, so it lives on Vercel too; approve a test deposit.
5. Download links in Account → resolve against the PB origin (gated route 200s).
6. Realtime (signal updates, admin sync) — subscriptions open against the PB origin.
7. Custom domain: add on Vercel + point the apex/root at PBC if you want one domain
   for both (alternatively keep subdomains: `app.` on Vercel, API subdomain on PBC).

## Rules that carry over

- Secrets stay out of Git: superuser credentials live in `.env` (root) and Vercel env only.
- `pb_hooks/akg.pb.js` is all server logic — deploy the same file that is committed.
- After editing hooks locally, restart `npm run serve`; on the cloud, redeploy hooks.
