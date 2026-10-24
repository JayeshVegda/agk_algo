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
./bin/pocketbase serve --dir=pb_data --publicDir=pb_public --http=0.0.0.0:8095
```
Or start the background systemd service:
```bash
sudo systemctl restart agk-algo
```

---

## 👑 Admin & Demo Credentials
* **Admin Access**:
  * Email: `jayeshvegda@gmail.com`
  * Password: `root1234`
  * Unlocks the **👑 Admin Desk** tab for full CRUD on Signals, Payments/TXID approvals, Announcements, Bots, and User Plans.
* **Trader Demo Member**:
  * Email: `user@akgalgo.local`
  * Password: `root1234`
  * Unlocks active 30-day membership cycle parameters.

---

## 🔄 Realtime Features & CRUD
* **Live Signals Desk**: Real-time broadcast of institutional entry zones, stop losses, and TP targets.
* **Payment TXID Approvals**: User submits USDT TXID; Admin clicks "Approve & Grant" which immediately updates payment status and unlocks 30 days of signal access for the user in real time.
* **Announcements / Broadcasts**: Realtime directives from lead desk analysts with pinned message support.
* **Trading Bots Store**: Direct licensing and downloads for MT4/MT5 expert advisors.
