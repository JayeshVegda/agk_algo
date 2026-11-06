#!/usr/bin/env python3
import os
import urllib.request
import json
import sys

import os
import urllib.request
import json
import sys

BASE_URL = os.environ.get("AKG_URL", "http://127.0.0.1:8095")

def post(url, data, token=None):
    headers = {"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}
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
    headers = {"Content-Type": "application/json", "User-Agent": "Mozilla/5.0"}
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
    headers = {"User-Agent": "Mozilla/5.0"}
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
    # Resolve real collection ids for relation fields (Cloud PB rejects names in collectionId)
    coll_items = get("/api/collections", token)["items"]
    coll_ids = {c["name"]: c["id"] for c in coll_items}

    # --- SIGNAL ROOM (messages, message_content, reactions) ---
    if "messages" not in all_colls:
        print("Creating 'messages' collection...")
        m_res = post("/api/collections", {
            "name": "messages",
            "type": "base",
            "listRule": "@request.auth.id != ''",
            "viewRule": "@request.auth.id != ''",
            "createRule": "@request.auth.id != '' && @request.auth.role = 'admin'",
            "updateRule": "@request.auth.id != '' && @request.auth.role = 'admin'",
            "deleteRule": "@request.auth.id != '' && @request.auth.role = 'admin'",
            "fields": [
                {"name": "author", "type": "relation", "collectionId": coll_ids.get("users", ""), "maxSelect": 1, "required": False},
                {"name": "audience", "type": "select", "values": ["all", "sr", "vip"], "maxSelect": 1, "required": True},
                {"name": "pinned", "type": "bool", "required": False},
                {"name": "has_image", "type": "bool", "required": False}
            ]
        }, token)
        coll_ids["messages"] = m_res.get("id", "")
        # Add reply_to self-relation
        post(f"/api/collections/{m_res.get('id', '')}", {
            "fields": [
                {"name": "author", "type": "relation", "collectionId": coll_ids.get("users", ""), "maxSelect": 1, "required": False},
                {"name": "audience", "type": "select", "values": ["all", "sr", "vip"], "maxSelect": 1, "required": True},
                {"name": "pinned", "type": "bool", "required": False},
                {"name": "has_image", "type": "bool", "required": False},
                {"name": "reply_to", "type": "relation", "collectionId": m_res.get("id", ""), "maxSelect": 1, "required": False}
            ]
        }, token)
        print("✓ 'messages' created.")

    if "message_content" not in all_colls:
        print("Creating 'message_content' collection...")
        post("/api/collections", {
            "name": "message_content",
            "type": "base",
            "listRule": "@request.auth.id != ''",
            "viewRule": "@request.auth.id != ''",
            "createRule": "@request.auth.id != '' && @request.auth.role = 'admin'",
            "updateRule": "@request.auth.id != '' && @request.auth.role = 'admin'",
            "deleteRule": "@request.auth.id != '' && @request.auth.role = 'admin'",
            "fields": [
                {"name": "message", "type": "relation", "collectionId": coll_ids.get("messages", ""), "maxSelect": 1, "cascadeDelete": True, "required": True},
                {"name": "body", "type": "text", "required": False},
                {"name": "attachments", "type": "file", "maxSelect": 4, "required": False}
            ]
        }, token)
        print("✓ 'message_content' created.")

    if "reactions" not in all_colls:
        print("Creating 'reactions' collection...")
        post("/api/collections", {
            "name": "reactions",
            "type": "base",
            "listRule": "@request.auth.id != ''",
            "viewRule": "@request.auth.id != ''",
            "createRule": "@request.auth.id != ''",
            "updateRule": "",
            "deleteRule": "user = @request.auth.id",
            "fields": [
                {"name": "message", "type": "relation", "collectionId": coll_ids.get("messages", ""), "maxSelect": 1, "cascadeDelete": True, "required": True},
                {"name": "user", "type": "relation", "collectionId": coll_ids.get("users", ""), "maxSelect": 1, "cascadeDelete": True, "required": True},
                {"name": "emoji", "type": "select", "values": ["🔥", "👍", "🎯", "💰", "🙏"], "maxSelect": 1, "required": True}
            ],
            "indexes": ["CREATE UNIQUE INDEX idx_reactions_unique ON reactions (message, user, emoji)"]
        }, token)
        print("✓ 'reactions' created.")

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
                {"name": "win_rate", "type": "number", "required": False},
                {"name": "drawdown", "type": "number", "required": False},
                {"name": "profit_factor", "type": "number", "required": False},
                {"name": "pairs", "type": "json", "required": False},
                {"name": "features", "type": "json", "required": False},
                {"name": "gallery", "type": "json", "required": False},
                {"name": "strategy_type", "type": "text", "required": False},
                {"name": "trading_style", "type": "text", "required": False},
                {"name": "timeframes", "type": "select", "values": ["M1", "M5", "M15", "M30", "H1", "H4", "D1", "W1", "MN"], "maxSelect": 4, "required": False},
                {"name": "min_lot", "type": "number", "required": False},
                {"name": "leverage", "type": "text", "required": False},
                {"name": "broker_note", "type": "text", "required": False},
                {"name": "image_url", "type": "text", "required": False},
                {"name": "download_url", "type": "text", "required": False}
            ]
        }, token)
        print("✓ 'bots' created.")

    # --- BOT CHANGES (release notes per bot) ---
    if "bot_changes" not in all_colls:
        print("Creating 'bot_changes' collection...")
        post("/api/collections", {
            "name": "bot_changes",
            "type": "base",
            "listRule": "",
            "viewRule": "",
            "createRule": "@request.auth.id != '' && @request.auth.role = 'admin'",
            "updateRule": "@request.auth.id != '' && @request.auth.role = 'admin'",
            "deleteRule": "@request.auth.id != '' && @request.auth.role = 'admin'",
            "fields": [
                {"name": "bot", "type": "relation", "collectionId": coll_ids["bots"], "maxSelect": 1, "cascadeDelete": True, "required": True},
                {"name": "version", "type": "text", "required": True},
                {"name": "released", "type": "date", "required": False},
                {"name": "summary", "type": "text", "required": True}
            ],
            "indexes": ["CREATE UNIQUE INDEX idx_bot_changes_bot_version ON bot_changes (bot, version)"]
        }, token)
        print("✓ 'bot_changes' created.")

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
                {"name": "network", "type": "text", "required": False, "max": 80},
                {"name": "txid", "type": "text", "required": True},
                {"name": "status", "type": "select", "values": ["pending", "confirmed", "rejected"], "maxSelect": 1, "required": True}
            ]
        }, token)
        print("✓ 'payments' created.")

    # --- WALLETS (admin-managed crypto networks) ---
    if "wallets" not in all_colls:
        print("Creating 'wallets' collection...")
        post("/api/collections", {
            "name": "wallets",
            "type": "base",
            "listRule": "",
            "viewRule": "",
            "createRule": "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.collectionName = '_superusers')",
            "updateRule": "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.collectionName = '_superusers')",
            "deleteRule": "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.collectionName = '_superusers')",
            "fields": [
                {"name": "label", "type": "text", "required": True, "min": 1, "max": 60},
                {"name": "address", "type": "text", "required": True, "min": 10, "max": 200},
                {"name": "note", "type": "text", "required": False, "max": 200},
                {"name": "qr_image", "type": "text", "required": False, "max": 262144},
                {"name": "enabled", "type": "bool", "required": False},
                {"name": "sort", "type": "number", "required": False, "onlyInt": True}
            ]
        }, token)
        post("/api/collections/wallets/records", {"label": "USDT-TRC20", "address": get("/api/collections/site_settings/records", token)["items"][0]["wallet_trc20"], "enabled": True, "sort": 10}, token)
        print("✓ 'wallets' created.")

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

    # Seed the admin-editable plan copy into site_settings
    settings_record = get("/api/collections/site_settings/records", token)["items"][0]
    if not settings_record.get("plan_sr_name"):
        patch("/api/collections/site_settings/records/" + settings_record["id"], {
            "plan_sr_name": "SR Signal Box",
            "plan_sr_blurb": "Desk-tested signals for a focused watchlist. Real-time entries, stops and targets across FX and crypto.",
            "plan_sr_price": 10,
            "plan_vip_name": "Perfect Signal Box",
            "plan_vip_blurb": "For serious business. Includes the whole desks coverage plus priority briefings and 1:1 desk guidance etc.",
            "plan_vip_price": 20
        }, token)
        print("✓ Plan copy seeded.")

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

    # Seed sample messages in Signal Room
    existing_messages = get("/api/collections/messages/records", token)["totalItems"]
    if existing_messages == 0:
        sample_messages = [
            ("all", "Welcome to the AKG institutional trading desk. Real-time setup broadcasts, execution updates, and market context land here live."),
            ("sr", "XAUUSD intraday watch: H4 liquidity sweep confirmed. Watching 2,748.50 zone for continuation."),
            ("vip", "PERFECT BOX VIP: Institutional order block mitigation underway. Check target zones in London open.")
        ]
        for audience, body in sample_messages:
            m = post("/api/collections/messages/records", {"audience": audience, "has_image": False}, token)
            if m.get("id"):
                post("/api/collections/message_content/records", {"message": m["id"], "body": body}, token)
        print(f"✓ Seeded {len(sample_messages)} broadcast messages.")

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
            },
            {
                "name": "AKG Momentum Hunter",
                "description": "Multi-timeframe trend-following algorithm specialized for EURUSD, GBPUSD, and NAS100 breakouts.",
                "platform": "MT5",
                "price": 349,
                "version": "v2.0",
                "recommended_deposit": "$1,000+",
                "download_url": "https://drive.google.com/drive/folders/akg-momentum-hunter-demo",
            },
            {
                "name": "AKG Scalper Pro",
                "description": "Ultra-low latency M1/M5 news scalper with automated spread protection and trailing stop-loss.",
                "platform": "MT4/MT5",
                "price": 399,
                "version": "v4.1",
                "recommended_deposit": "$300+",
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
