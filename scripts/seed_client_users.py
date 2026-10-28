#!/usr/bin/env python3
"""Client review accounts: simple creds, one per use case. Idempotent."""
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
        "identity": os.environ.get("AKG_SUPERUSER_EMAIL", "admin@admin.com"),
        "password": os.environ.get("AKG_SUPERUSER_PASSWORD", "")})
    if st != 200: print("superuser auth failed:", st); return
    TOKEN = auth["token"]

    st, existing = req("GET", "/api/collections/users/records?filter=email='demo5@akgalgo.com'")
    if existing.get("totalItems", 0) > 0:
        print("client review users already seeded"); return

    random.seed(7)
    now = datetime.now(timezone.utc)
    expiry = (lambda d: (now + timedelta(days=d)).strftime("%Y-%m-%d %H:%M:%S.000Z") if d else "0001-01-01 00:00:00.000Z")
    ADMIN_PW = os.environ.get("AKG_CLIENT_ADMIN_PASSWORD", "admin@admin")
    DEMO_PW = os.environ.get("AKG_CLIENT_DEMO_PASSWORD", "welcome123")

    people = [
        # email, name, plan, cycle days, admin?
        ("admin@admin.com", "Client Admin", "PERFECT_SIGNAL_BOX", 30, True),
        ("demo1@akgalgo.com", "Demo One - Active Signals", "SR_SIGNAL_BOX", 18, False),
        ("demo2@akgalgo.com", "Demo Two - Bot Owner", "PERFECT_SIGNAL_BOX", 26, False),
        ("demo3@akgalgo.com", "Demo Three - Bot Pending", "NONE", 0, False),
        ("demo4@akgalgo.com", "Demo Four - Managed Account", "SR_SIGNAL_BOX", 22, False),
        ("demo5@akgalgo.com", "Demo Five - New Free User", "NONE", 0, False),
    ]
    ids = {}
    for email, name, plan, days, is_admin in people:
        st, u = req("POST", "/api/collections/users/records", {
            "email": email, "password": ADMIN_PW if is_admin else DEMO_PW,
            "passwordConfirm": ADMIN_PW if is_admin else DEMO_PW,
            "name": name, "role": "admin" if is_admin else "user",
            "plan": plan, "cycle_expires_at": expiry(days), "verified": True})
        if st == 200: ids[email] = u["id"]
        else: print("user failed:", email, st, u)
    print(f"users: {len(ids)} created")

    def pay(email, plan, amount, days_ago, method="crypto", status="confirmed"):
        created = (now - timedelta(days=days_ago)).strftime("%Y-%m-%d %H:%M:%S.000Z")
        net = {"crypto": "USDT-TRC20", "upi": "INR-UPI"}[method]
        tx = "".join(random.choices("0123456789abcdef", k=64)) if method == "crypto" else "".join(random.choices("0123456789", k=12))
        st, p = req("POST", "/api/collections/payments/records", {"user_email": email, "plan": plan, "amount": amount,
            "network": net, "method": method, "inr_amount": round(amount * 91.5) if method == "upi" else None,
            "txid": tx, "status": status, "created": created})
        return st

    pay("demo1@akgalgo.com", "SR_SIGNAL_BOX", 10, 12, method="upi")
    pay("demo2@akgalgo.com", "PERFECT_SIGNAL_BOX", 20, 26)
    pay("demo2@akgalgo.com", "BOT: AKG Gold Trap EA (MT4 #5021993)", 299, 20)
    pay("demo3@akgalgo.com", "BOT: AKG Momentum Hunter (MT5 #7712004)", 349, 1, status="pending")
    pay("demo4@akgalgo.com", "SR_SIGNAL_BOX", 10, 22, method="upi")
    print("payments: 5 created")

    for email, acc, srv, brk, plat, status in [
        ("demo4@akgalgo.com", "8841027", "ICMarketsSC-MT5", "IC Markets", "MT5", "trading"),
        ("demo3@akgalgo.com", "3369012", "Exness-MT5", "Exness", "MT5", "pending_review"),
    ]:
        req("POST", "/api/collections/connector_requests/records", {
            "user_email": email, "account_number": acc, "server": srv, "broker": brk,
            "platform": plat, "leverage": "1:200", "risk_level": "moderate", "status": status,
            "user_profit_share": 70, "account_password": "enc-demo-not-real",
            "admin_notes": "EMA cross system on XAUUSD M15. Statement shared every 1st.",
            "created": (now - timedelta(days=3)).strftime("%Y-%m-%d %H:%M:%S.000Z")})
    print("managed accounts: 2 created")
    print("CLIENT SEED COMPLETE")

if __name__ == "__main__":
    main()
