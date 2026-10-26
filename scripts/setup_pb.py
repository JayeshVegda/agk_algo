#!/usr/bin/env python3
import os
import urllib.request
import json
import sys

BASE_URL = "http://127.0.0.1:8095"

def post(url, data, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = token
    req = urllib.request.Request(f"{BASE_URL}{url}", data=json.dumps(data).encode(), headers=headers)
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f"Error on {url}:", e.code, e.read().decode())
        raise e

def patch(url, data, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = token
    req = urllib.request.Request(f"{BASE_URL}{url}", data=json.dumps(data).encode(), headers=headers, method="PATCH")
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        print(f"Error on {url}:", e.code, e.read().decode())
        raise e

def get(url, token=None):
    headers = {}
    if token:
        headers["Authorization"] = token
    req = urllib.request.Request(f"{BASE_URL}{url}", headers=headers)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())

def main():
    print("1. Authenticating as Superuser...")
    auth_res = post("/api/collections/_superusers/auth-with-password", {
        "identity": os.environ.get("AKG_SUPERUSER_EMAIL", "jayeshvegda@gmail.com"),
        "password": os.environ.get("AKG_SUPERUSER_PASSWORD", "")
    })
    token = auth_res["token"]
    print("✓ Superuser authenticated.")

    print("2. Updating 'users' collection schema...")
    users_coll = get("/api/collections/users", token)
    existing_field_names = [f["name"] for f in users_coll["fields"]]
    new_fields = list(users_coll["fields"])

    for f in new_fields:
        if f.get("name") == "password":
            f["min"] = 8

    if "role" not in existing_field_names:
        new_fields.append({
            "name": "role",
            "type": "select",
            "values": ["user", "admin"],
            "maxSelect": 1,
            "required": False
        })
    if "plan" not in existing_field_names:
        new_fields.append({
            "name": "plan",
            "type": "select",
            "values": ["NONE", "SR_SIGNAL_BOX", "PERFECT_SIGNAL_BOX"],
            "maxSelect": 1,
            "required": False
        })
    if "cycle_expires_at" not in existing_field_names:
        new_fields.append({
            "name": "cycle_expires_at",
            "type": "date",
            "required": False
        })

    patch("/api/collections/users", {"fields": new_fields}, token)
    print("✓ 'users' collection updated.")

    # Helper to create collection if not exists
    all_colls = [c["name"] for c in get("/api/collections", token)["items"]]

    # --- SIGNALS ---
    if "signals" not in all_colls:
        print("Creating 'signals' collection...")
        post("/api/collections", {
            "name": "signals",
            "type": "base",
            "listRule": "",
            "viewRule": "",
            "createRule": "@request.auth.id != '' && @request.auth.role = 'admin'",
            "updateRule": "@request.auth.id != '' && @request.auth.role = 'admin'",
            "deleteRule": "@request.auth.id != '' && @request.auth.role = 'admin'",
            "fields": [
                {"name": "symbol", "type": "text", "required": True},
                {"name": "direction", "type": "select", "values": ["BUY", "SELL"], "maxSelect": 1, "required": True},
                {"name": "entry", "type": "text", "required": True},
                {"name": "stop_loss", "type": "text", "required": True},
                {"name": "take_profit_1", "type": "text", "required": True},
                {"name": "take_profit_2", "type": "text", "required": False},
                {"name": "plan_tier", "type": "select", "values": ["SR_SIGNAL_BOX", "PERFECT_SIGNAL_BOX"], "maxSelect": 1, "required": True},
                {"name": "status", "type": "select", "values": ["active", "closed", "cancelled"], "maxSelect": 1, "required": True},
                {"name": "pnl", "type": "text", "required": False},
                {"name": "notes", "type": "text", "required": False}
            ]
        }, token)
        print("✓ 'signals' created.")

    # --- BOTS ---
    if "bots" not in all_colls:
        print("Creating 'bots' collection...")
        post("/api/collections", {
            "name": "bots",
            "type": "base",
            "listRule": "",
            "viewRule": "",
            "createRule": "@request.auth.id != '' && @request.auth.role = 'admin'",
            "updateRule": "@request.auth.id != '' && @request.auth.role = 'admin'",
            "deleteRule": "@request.auth.id != '' && @request.auth.role = 'admin'",
            "fields": [
                {"name": "name", "type": "text", "required": True},
                {"name": "description", "type": "text", "required": True},
                {"name": "platform", "type": "select", "values": ["MT4", "MT5", "MT4/MT5"], "maxSelect": 1, "required": True},
                {"name": "price", "type": "number", "required": True},
                {"name": "version", "type": "text", "required": True},
                {"name": "recommended_deposit", "type": "text", "required": False},
                {"name": "win_rate", "type": "text", "required": False}
            ]
        }, token)
        print("✓ 'bots' created.")

    # --- BROADCASTS ---
    if "broadcasts" not in all_colls:
        print("Creating 'broadcasts' collection...")
        post("/api/collections", {
            "name": "broadcasts",
            "type": "base",
            "listRule": "",
            "viewRule": "",
            "createRule": "@request.auth.id != '' && @request.auth.role = 'admin'",
            "updateRule": "@request.auth.id != '' && @request.auth.role = 'admin'",
            "deleteRule": "@request.auth.id != '' && @request.auth.role = 'admin'",
            "fields": [
                {"name": "title", "type": "text", "required": True},
                {"name": "body", "type": "text", "required": True},
                {"name": "pinned", "type": "bool", "required": False},
                {"name": "author", "type": "text", "required": False}
            ]
        }, token)
        print("✓ 'broadcasts' created.")

    # --- PAYMENTS ---
    if "payments" not in all_colls:
        print("Creating 'payments' collection...")
        post("/api/collections", {
            "name": "payments",
            "type": "base",
            "listRule": "@request.auth.id != ''",
            "viewRule": "@request.auth.id != ''",
            "createRule": "@request.auth.id != ''",
            "updateRule": "@request.auth.id != '' && @request.auth.role = 'admin'",
            "deleteRule": "@request.auth.id != '' && @request.auth.role = 'admin'",
            "fields": [
                {"name": "user_email", "type": "text", "required": True},
                {"name": "plan", "type": "text", "required": True},
                {"name": "amount", "type": "number", "required": True},
                {"name": "network", "type": "select", "values": ["USDT-TRC20", "USDT-BEP20", "USDT-ERC20"], "maxSelect": 1, "required": True},
                {"name": "txid", "type": "text", "required": True},
                {"name": "status", "type": "select", "values": ["pending", "confirmed", "rejected"], "maxSelect": 1, "required": True}
            ]
        }, token)
        print("✓ 'payments' created.")

    # --- CONNECTOR REQUESTS ---
    if "connector_requests" not in all_colls:
        print("Creating 'connector_requests' collection...")
        post("/api/collections", {
            "name": "connector_requests",
            "type": "base",
            "listRule": "@request.auth.id != ''",
            "viewRule": "@request.auth.id != ''",
            "createRule": "@request.auth.id != ''",
            "updateRule": "@request.auth.id != '' && @request.auth.role = 'admin'",
            "deleteRule": "@request.auth.id != '' && @request.auth.role = 'admin'",
            "fields": [
                {"name": "user_email", "type": "text", "required": True},
                {"name": "account_number", "type": "text", "required": True},
                {"name": "server", "type": "text", "required": True},
                {"name": "platform", "type": "select", "values": ["MT4", "MT5"], "maxSelect": 1, "required": True},
                {"name": "status", "type": "select", "values": ["pending_review", "in_progress", "connected", "rejected", "demo_active"], "maxSelect": 1, "required": True},
                {"name": "admin_notes", "type": "text", "required": False},
                {"name": "risk_level", "type": "text", "required": False},
                {"name": "leverage", "type": "text", "required": False}
            ]
        }, token)
        print("✓ 'connector_requests' created.")

    print("\n3. Seeding Base Records...")

    # Seed demo users
    existing_users = [u["email"] for u in get("/api/collections/users/records", token)["items"]]
    if "jayeshvegda@gmail.com" not in existing_users:
        post("/api/collections/users/records", {
            "email": "jayeshvegda@gmail.com",
            "password": os.environ.get("AKG_ADMIN_PASSWORD", ""),
            "passwordConfirm": os.environ.get("AKG_ADMIN_PASSWORD", ""),
            "name": "Jayesh Vegda",
            "role": "admin",
            "plan": "PERFECT_SIGNAL_BOX",
            "verified": True
        }, token)
        print("✓ User jayeshvegda@gmail.com created.")

    if "user@akgalgo.local" not in existing_users:
        post("/api/collections/users/records", {
            "email": "user@akgalgo.local",
            "password": os.environ.get("AKG_DEMO_PASSWORD", os.environ.get("AKG_ADMIN_PASSWORD", "")),
            "passwordConfirm": os.environ.get("AKG_DEMO_PASSWORD", os.environ.get("AKG_ADMIN_PASSWORD", "")),
            "name": "Alex Trader",
            "role": "user",
            "plan": "PERFECT_SIGNAL_BOX",
            "verified": True
        }, token)
        print("✓ User user@akgalgo.local created.")

    # Seed sample signals
    existing_signals = get("/api/collections/signals/records", token)["totalItems"]
    if existing_signals == 0:
        sample_signals = [
            {
                "symbol": "XAUUSD",
                "direction": "BUY",
                "entry": "2,748.50",
                "stop_loss": "2,735.00",
                "take_profit_1": "2,765.00",
                "take_profit_2": "2,780.00",
                "plan_tier": "PERFECT_SIGNAL_BOX",
                "status": "active",
                "notes": "H4 Liquidity sweep confirmed above Asian range high."
            },
            {
                "symbol": "EURUSD",
                "direction": "BUY",
                "entry": "1.08420",
                "stop_loss": "1.08150",
                "take_profit_1": "1.08800",
                "take_profit_2": "1.09200",
                "plan_tier": "SR_SIGNAL_BOX",
                "status": "active",
                "notes": "London session break & retest of key daily support level."
            },
            {
                "symbol": "BTCUSD",
                "direction": "BUY",
                "entry": "68,420",
                "stop_loss": "67,200",
                "take_profit_1": "70,000",
                "take_profit_2": "71,500",
                "plan_tier": "PERFECT_SIGNAL_BOX",
                "status": "active",
                "notes": "Weekly trendline continuation with high volume expansion."
            }
        ]
        for s in sample_signals:
            post("/api/collections/signals/records", s, token)
        print(f"✓ Seeded {len(sample_signals)} signals.")

    # Seed sample bots
    existing_bots = get("/api/collections/bots/records", token)["totalItems"]
    if existing_bots == 0:
        sample_bots = [
            {
                "name": "AKG Gold Trap EA",
                "description": "Proprietary XAU/USD mean-reversion algorithm with automated dynamic lot-sizing and drawdown protection.",
                "platform": "MT4",
                "price": 299,
                "version": "v3.2",
                "recommended_deposit": "$500+",
                "win_rate": "84.2%"
            },
            {
                "name": "AKG Momentum Hunter",
                "description": "Multi-timeframe trend-following algorithm specialized for EURUSD, GBPUSD, and NAS100 breakouts.",
                "platform": "MT5",
                "price": 349,
                "version": "v2.0",
                "recommended_deposit": "$1,000+",
                "win_rate": "78.5%"
            },
            {
                "name": "AKG Scalper Pro",
                "description": "Ultra-low latency M1/M5 news scalper with automated spread protection and trailing stop-loss.",
                "platform": "MT4/MT5",
                "price": 399,
                "version": "v4.1",
                "recommended_deposit": "$300+",
                "win_rate": "89.1%"
            }
        ]
        for b in sample_bots:
            post("/api/collections/bots/records", b, token)
        print(f"✓ Seeded {len(sample_bots)} bots.")

    # Seed sample broadcasts
    existing_broadcasts = get("/api/collections/broadcasts/records", token)["totalItems"]
    if existing_broadcasts == 0:
        sample_broadcasts = [
            {
                "title": "Welcome to AKG ALGO Institutional Desk",
                "body": "Daily market alerts and execution parameters are updated during active London and New York trading sessions. Ensure your notifications are enabled.",
                "pinned": True,
                "author": "AKG System Admin"
            },
            {
                "title": "Cycle 2 Active · Template Update",
                "body": "Cycle 2 is currently active. Ensure your MetaTrader terminal chart template is updated to v2.1 for optimal Fibonacci sync.",
                "pinned": False,
                "author": "Chief Analyst"
            }
        ]
        for b in sample_broadcasts:
            post("/api/collections/broadcasts/records", b, token)
        print(f"✓ Seeded {len(sample_broadcasts)} broadcasts.")

    print("\n✅ POCKETBASE DATABASE SETUP AND SEEDING COMPLETED SUCCESSFULLY!")

if __name__ == "__main__":
    main()
