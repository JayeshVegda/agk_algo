#!/usr/bin/env python3
"""Realistic demo data: traders, payments (crypto + UPI), signal history,
briefings, and managed-account applications. Idempotent: skips if the marker
user exists. Requires AKG_SUPERUSER_PASSWORD env."""
import os, json, random, urllib.request, urllib.parse
from datetime import datetime, timedelta, timezone

BASE = os.environ.get("AKG_URL", "http://127.0.0.1:8095")
TOKEN = None

def req(method, path, body=None):
    r = urllib.request.Request(BASE + urllib.parse.quote(path, safe="/?&=%.'-"),
        data=json.dumps(body).encode() if body else None, method=method)
    r.add_header("Content-Type", "application/json")
    if TOKEN: r.add_header("Authorization", TOKEN)
    r.add_header("User-Agent", "Mozilla/5.0")
    try:
        with urllib.request.urlopen(r) as resp: return resp.status, json.loads(resp.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        try: return e.code, json.loads(e.read().decode() or "{}")
        except Exception: return e.code, {}

def main():
    global TOKEN
    st, auth = req("POST", "/api/collections/_superusers/auth-with-password", {
        "identity": os.environ.get("AKG_SUPERUSER_EMAIL", "jayeshvegda@gmail.com"),
        "password": os.environ.get("AKG_SUPERUSER_PASSWORD", "")})
    if st != 200: print("superuser auth failed:", st); return
    TOKEN = auth["token"]

    _, existing = req("GET", "/api/collections/users/records?filter=email='rohit.mehta@gmail.com'")
    if existing.get("totalItems", 0) > 0:
        print("demo data already seeded"); return

    random.seed(42)
    now = datetime.now(timezone.utc)

    traders = [
        ("rohit.mehta@gmail.com", "Rohit Mehta", "PERFECT_SIGNAL_BOX", 27),
        ("priya.nair@yahoo.in", "Priya Nair", "SR_SIGNAL_BOX", 12),
        ("arjun.patel@outlook.com", "Arjun Patel", "PERFECT_SIGNAL_BOX", 5),
        ("kunal.shah88@gmail.com", "Kunal Shah", "SR_SIGNAL_BOX", 24),
        ("meera.iyer@gmail.com", "Meera Iyer", "NONE", None),
        ("daniel.okafor@gmail.com", "Daniel Okafor", "PERFECT_SIGNAL_BOX", 19),
        ("sneha.kapoor@gmail.com", "Sneha Kapoor", "SR_SIGNAL_BOX", 2),
    ]
    ids = {}
    for email, name, plan, days in traders:
        expiry = ""
        if days is not None:
            expiry = (now + timedelta(days=days)).strftime("%Y-%m-%d %H:%M:%S.000Z")
        st, u = req("POST", "/api/collections/users/records", {
            "email": email, "password": "DemoTrader#2026", "passwordConfirm": "DemoTrader#2026",
            "name": name, "role": "user", "plan": plan, "cycle_expires_at": expiry or "0001-01-01 00:00:00.000Z"})
        if st == 200: ids[email] = u["id"]
    print(f"users: {len(ids)} created")

    def pay(email, plan, amount, days_ago, method="crypto", status="confirmed"):
        created = (now - timedelta(days=days_ago)).strftime("%Y-%m-%d %H:%M:%S.000Z")
        net = {"crypto": random.choice(["USDT-TRC20", "USDT-BEP20"]), "upi": "INR-UPI"}[method]
        tx = "".join(random.choices("0123456789abcdef", k=64)) if method == "crypto" else "".join(random.choices("0123456789", k=12))
        body = {"user_email": email, "plan": plan, "amount": amount, "network": net,
                "method": method, "inr_amount": round(amount * 91.5) if method == "upi" else None,
                "txid": tx, "status": status, "created": created}
        st, p = req("POST", "/api/collections/payments/records", body)
        return p.get("id") if st in (200, 400) else None

    n = 0
    n += 1 if pay("rohit.mehta@gmail.com", "PERFECT_SIGNAL_BOX", 20, 27) else 0
    n += 1 if pay("rohit.mehta@gmail.com", "BOT: AKG Gold Trap EA (MT4 #5021993)", 299, 25) else 0
    n += 1 if pay("priya.nair@yahoo.in", "SR_SIGNAL_BOX", 10, 12, method="upi") else 0
    n += 1 if pay("arjun.patel@outlook.com", "PERFECT_SIGNAL_BOX", 20, 5, method="upi") else 0
    n += 1 if pay("kunal.shah88@gmail.com", "SR_SIGNAL_BOX", 10, 24) else 0
    n += 1 if pay("daniel.okafor@gmail.com", "BOT: AKG Momentum Hunter (MT5 #7712004)", 349, 19) else 0
    n += 1 if pay("daniel.okafor@gmail.com", "PERFECT_SIGNAL_BOX", 20, 19) else 0
    n += 1 if pay("sneha.kapoor@gmail.com", "SR_SIGNAL_BOX", 10, 2) else 0
    n += 1 if pay("meera.iyer@gmail.com", "PERFECT_SIGNAL_BOX", 20, 0, status="pending") else 0
    n += 1 if pay("kunal.shah88@gmail.com", "BOT: AKG Scalper Pro (MT5 #3305812)", 399, 0, status="pending") else 0
    print(f"payments: {n} created")

    syms = [("XAUUSD", "4312.5", "4298", "4328", "4345"), ("EURUSD", "1.0842", "1.0820", "1.0870", "1.0905"),
            ("GBPJPY", "198.40", "199.10", "197.60", "196.90"), ("BTCUSD", "67240", "66900", "67800", "68400"),
            ("US30", "39120", "39040", "39280", "39400"), ("USDJPY", "151.80", "151.20", "152.40", "153.00")]
    for i in range(14):
        sym, e, sl, tp1, tp2 = syms[i % len(syms)]
        tier = "PERFECT_SIGNAL_BOX" if i % 3 else "SR_SIGNAL_BOX"
        active = i < 5
        created = (now - timedelta(days=13 - i)).strftime("%Y-%m-%d %H:%M:%S.000Z")
        req("POST", "/api/collections/signals/records", {
            "symbol": sym, "direction": "BUY" if i % 2 else "SELL", "entry": e, "stop_loss": sl,
            "take_profit_1": tp1, "take_profit_2": tp2 if i % 4 else "", "plan_tier": tier,
            "status": "active" if active else "closed",
            "pnl": "" if active else random.choice(["+45 pips", "+28 pips", "+112 pips", "-18 pips", "+60 pips"]),
            "notes": random.choice(["London liquidity sweep complete, riding displacement.",
                                    "NY session orderblock retest, tight invalidation.",
                                    "Asian range break with momentum confirmation.",
                                    "Macro-driven position ahead of CPI print."]),
            "created": created})
    print("signals: 14 created")

    briefs = [
        ("Cycle 3 desk performance: +1,840 pips", "The desk closed Cycle 3 with +1,840 net pips across Perfect Box instruments. Statements are being distributed to members.", "Chief Analyst", 1, 6),
        ("Gold volatility protocol - reduced sizing", "XAUUSD is trading its widest weekly range this quarter. All gold systems run at 50% risk until the FOMC minutes are digested.", "Chief Risk Officer", 1, 3),
        ("New VPS partner: BeeksFX LD4", "Bridge latency is down to 0.6ms median after the London migration. Managed accounts benefit automatically.", "Infrastructure Desk", 0, 1),
    ]
    for title, body, author, pinned, days in briefs:
        req("POST", "/api/collections/broadcasts/records", {
            "title": title, "body": body, "author": author, "pinned": bool(pinned),
            "created": (now - timedelta(days=days)).strftime("%Y-%m-%d %H:%M:%S.000Z")})
    print("briefings: 3 created")

    for email, acc, srv, brk, plat, status in [
        ("rohit.mehta@gmail.com", "5021993", "ICMarketsSC-MT5", "IC Markets", "MT5", "trading"),
        ("daniel.okafor@gmail.com", "7712004", "Exness-MT5", "Exness", "MT5", "in_progress"),
        ("priya.nair@yahoo.in", "6648201", "Pepperstone-MT4", "Pepperstone", "MT4", "pending_review"),
    ]:
        pw = "enc-demo-not-real"
        req("POST", "/api/collections/connector_requests/records", {
            "user_email": email, "account_number": acc, "server": srv, "broker": brk,
            "platform": plat, "leverage": "1:200", "risk_level": "moderate",
            "status": status, "user_profit_share": 70,
            "admin_notes": "Bots live on XAUUSD + majors. Next settlement statement on the 1st." if status == "trading" else "",
            "account_password": pw,
            "created": (now - timedelta(days=random.randint(1, 10))).strftime("%Y-%m-%d %H:%M:%S.000Z")})
    print("managed accounts: 3 created")
    print("SEED COMPLETE")

if __name__ == "__main__":
    main()
