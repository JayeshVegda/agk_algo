# AKG ALGO · Institutional Precision Trading Systems

High-performance, ultra-low resource algorithmic trading desk, live signals feed, EA bot store, and simulated connector terminal.

---

## ⚡ Tech Stack & Performance
* **Backend**: [PocketBase](https://pocketbase.io/) (Single Go Binary with embedded SQLite & Realtime SSE)
* **Frontend**: React 19 + Vite 6 + Tailwind CSS
* **Memory Footprint**: ~33 MB RAM (Can easily run on low-spec VPS with 3,000–4,000 active daily users)
* **Realtime Sync**: Server-Sent Events (SSE) for sub-millisecond signal & announcement broadcasts
* **Reverse Proxy**: Caddy with SSL & immediate SSE streaming (`flush_interval -1`)

---

## 📂 Project Structure
```
├── frontend/             # React 19 + Vite frontend source code
│   ├── src/
│   │   ├── components/   # UI tabs (Signals, Bots, Charts, Connector, Broadcasts, Pricing, Admin)
│   │   ├── lib/          # PocketBase client SDK configuration
│   │   ├── App.jsx       # Root layout & real-time state
│   │   └── main.jsx
│   └── package.json
├── bin/                  # Pre-compiled PocketBase Go binary
├── pb_data/              # SQLite database & configuration
├── pb_public/            # Compiled production web bundle served by PocketBase
├── scripts/              # Python seed & collection setup utilities
└── docker-compose.yml    # Docker Compose deployment option
```

---

## 🚀 Quickstart

### 1. Build Frontend
```bash
cd frontend
npm install
npm run build
```
The compiled files are automatically output to `pb_public/`.

### 2. Run PocketBase
```bash
./bin/pocketbase serve --dir=pb_data --publicDir=pb_public --hooksDir=pb_hooks --http=0.0.0.0:8095
```
Or `npm run serve` from the repo root. The server-side security hooks live in
`pb_hooks/akg.pb.js` — they enforce registration defaults, payment validation,
transactional approvals and license-key issuance. Never run without `--hooksDir=pb_hooks`.

### 3. Database setup

PocketBase applies the versioned migrations in `pb_migrations/` on startup.
Use `npm run harden:db` with superuser credentials in the environment to verify
the payment fields and scheduled-cycle access rules. Use the production
[deployment runbook](DEPLOY.md) when configuring a fresh public instance.

### Security model (do not bypass)
- Signal message bodies and attachments are filtered by the user's access tier.
  Scheduled memberships activate and expire according to the configured cycle.
- Users cannot self-assign `role`, `plan` or `cycle_expires_at` (enforced in `pb_hooks`).
- Payments are forced to `status=pending` with the authenticated email; plan and amount
  are validated against server-side prices. Admin approval grants the cycle or issues a
  license key in one transaction (`pb_hooks/akg.pb.js`).
- Bot binaries live in `private_downloads/` (outside the web root) and are served via
  `/api/akg/download/{name}` only to authenticated users with a confirmed `BOT:` payment.

---

## 👑 Admin & Demo Accounts
* **Admin Access**: the owner account (`role=admin`) unlocks the Admin Desk for full CRUD on Signals, Payments/TXID approvals, Announcements, Bots, and User Plans.
* Credentials are intentionally **not stored in this repo**. Both the PocketBase superuser and the app admin password were rotated to strong secrets; they live in the owner's password manager only.
* To reset a superuser locally: `./bin/pocketbase superuser upsert <email> <newpass> --dir=pb_data`
* To reset the app admin password: `./bin/pocketbase superuser auth <email> <superpass>` then PATCH the users record, or use the Dashboard at `/_/`.
* Before public deployment: remove the seeded demo member (`user@akgalgo.local`) or rotate its password too.

---

## 🧾 Legal & Operations
* Public pages: `/terms` `/refund` `/risk` `/privacy`.
* Settlements: managed-account profit splits are recorded per period (`managed_settlements`) and visible to the owning trader.
* Exports: CSV export on admin Payments and Traders (respects the active filter).
* Fraud guard: duplicate TXID/UTR submissions are rejected server-side.

## 🔄 Realtime Features & CRUD
* **Live Signals Desk**: Real-time broadcast of institutional entry zones, stop losses, and TP targets.
* **Payment TXID Approvals**: User submits USDT TXID; The admin verifies the transfer and approves the order. Signal access follows the purchased cycle’s dates.
* **Announcements / Broadcasts**: Realtime directives from lead desk analysts with pinned message support.
* **Trading Bots Store**: Direct licensing and downloads for MT4/MT5 expert advisors.
