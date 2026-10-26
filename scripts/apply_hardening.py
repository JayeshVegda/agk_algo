#!/usr/bin/env python3
"""
AKG ALGO backend hardening.

Idempotent: safe to run repeatedly. Run AFTER the server is started and
after scripts/setup_pb.py on a fresh install.

What it does:
1. Locks API rules so the paywall is real:
   - signals: readable only by admins and members with an active 30-day cycle
     (SR members only see SR-tier signals, PERFECT members see everything)
   - signals: a public `signal_previews` view exposes masked records (no entry/SL/TP)
     so locked visitors still see the live feed shape
   - users: create stays open (registration) but entitlement fields are guarded by hooks
   - payments: clients can create only "pending" records for themselves (hook-enforced)
2. Adds `license_key` to payments (server-issued on approval).
3. Removes fabricated demo data (orphan emails, unknown "PRO" plan) that
   corrupts the admin revenue stats.
"""
import json
import urllib.request
import urllib.error

BASE_URL = "http://127.0.0.1:8095"
SUPERUSER_EMAIL = "jayeshvegda@gmail.com"
import os
SUPERUSER_PASSWORD = os.environ.get("AKG_SUPERUSER_PASSWORD", "")  # required: no insecure default

ADMIN_ONLY = "@request.auth.id != '' && (@request.auth.role = 'admin' || @request.auth.collectionName = '_superusers')"

# Active member = plan + unexpired cycle. SR members only see SR-tier signals.
SIGNALS_READ = (
    '@request.auth.id != "" && ('
    '@request.auth.role = "admin" || ('
    '@request.auth.cycle_expires_at > @now && '
    '@request.auth.plan != "" && @request.auth.plan != "NONE" && '
    '(@request.auth.plan = "PERFECT_SIGNAL_BOX" || plan_tier = "SR_SIGNAL_BOX")))'
)

PREVIEW_SQL = (
    "SELECT signals.id, signals.symbol, signals.direction, signals.plan_tier, "
    "signals.status, signals.pnl, signals.created, signals.updated FROM signals"
)


def request(method, path, data=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = token
    req = urllib.request.Request(
        f"{BASE_URL}{path}",
        data=json.dumps(data).encode() if data is not None else None,
        headers=headers,
        method=method,
    )
    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read().decode()
            return json.loads(body) if body else {}
    except urllib.error.HTTPError as e:
        print(f"  !! {method} {path} -> {e.code}: {e.read().decode()[:300]}")
        raise


def authenticate():
    res = request("POST", "/api/collections/_superusers/auth-with-password", {
        "identity": SUPERUSER_EMAIL,
        "password": SUPERUSER_PASSWORD,
    })
    return res["token"]


def update_collection(token, name, **rules):
    coll = request("GET", f"/api/collections/{name}", token=token)
    coll.update(rules)
    request("PATCH", f"/api/collections/{name}", coll, token)
    print(f"  rules updated: {name}")


def ensure_license_key_field(token):
    coll = request("GET", "/api/collections/payments", token=token)
    if any(f.get("name") == "license_key" for f in coll["fields"]):
        print("  payments.license_key already exists")
        return
    coll["fields"].append({
        "name": "license_key",
        "type": "text",
        "required": False,
    })
    request("PATCH", "/api/collections/payments", coll, token)
    print("  payments.license_key added")


def ensure_signal_previews(token):
    existing = [c["name"] for c in request("GET", "/api/collections", token=token)["items"]]
    if "signal_previews" in existing:
        request("PATCH", "/api/collections/signal_previews", {
            "viewQuery": PREVIEW_SQL,
            "listRule": "",
            "viewRule": "",
        }, token)
        print("  signal_previews view updated")
        return
    request("POST", "/api/collections", {
        "name": "signal_previews",
        "type": "view",
        "viewQuery": PREVIEW_SQL,
        "listRule": "",
        "viewRule": "",
        "createRule": None,
        "updateRule": None,
        "deleteRule": None,
    }, token)
    print("  signal_previews view created")


def cleanup_demo_data(token):
    """Delete records referencing emails that have no user account (fabricated seeds)."""
    users = request("GET", "/api/collections/users/records?perPage=200", token=token)["items"]
    known_emails = {u["email"] for u in users}

    payments = request("GET", "/api/collections/payments/records?perPage=200", token=token)["items"]
    removed = 0
    for p in payments:
        orphan = p["user_email"] not in known_emails
        bad_plan = p["plan"] not in ("SR_SIGNAL_BOX", "PERFECT_SIGNAL_BOX") and not p["plan"].startswith("BOT:")
        if orphan or bad_plan:
            request("DELETE", f"/api/collections/payments/records/{p['id']}", token=token)
            removed += 1
            print(f"  removed payment: {p['user_email']} | {p['plan']} | {p['status']}")
    if removed == 0:
        print("  payments clean")

    conns = request("GET", "/api/collections/connector_requests/records?perPage=200", token=token)["items"]
    removed = 0
    for c in conns:
        if c["user_email"] not in known_emails:
            request("DELETE", f"/api/collections/connector_requests/records/{c['id']}", token=token)
            removed += 1
            print(f"  removed connector request: {c['user_email']}")
    if removed == 0:
        print("  connector_requests clean")

    removed = 0
    for u in users:
        if u["plan"] not in ("NONE", "", "SR_SIGNAL_BOX", "PERFECT_SIGNAL_BOX"):
            request("DELETE", f"/api/collections/users/records/{u['id']}", token=token)
            removed += 1
            print(f"  removed user with unknown plan: {u['email']} ({u['plan']})")
    if removed == 0:
        print("  users clean")


def main():
    print("1. Authenticating as Superuser...")
    token = authenticate()
    print("OK")

    print("2. Locking collection API rules...")
    update_collection(token, "signals",
                      listRule=SIGNALS_READ, viewRule=SIGNALS_READ,
                      createRule=ADMIN_ONLY, updateRule=ADMIN_ONLY, deleteRule=ADMIN_ONLY)
    update_collection(token, "payments",
                      listRule='@request.auth.id != "" && (@request.auth.role = "admin" || user_email = @request.auth.email)',
                      viewRule='@request.auth.id != "" && (@request.auth.role = "admin" || user_email = @request.auth.email)',
                      createRule='@request.auth.id != ""',
                      updateRule=ADMIN_ONLY, deleteRule=ADMIN_ONLY)
    update_collection(token, "connector_requests",
                      listRule='@request.auth.id != "" && (@request.auth.role = "admin" || user_email = @request.auth.email)',
                      viewRule='@request.auth.id != "" && (@request.auth.role = "admin" || user_email = @request.auth.email)',
                      createRule='@request.auth.id != ""',
                      updateRule=ADMIN_ONLY, deleteRule=ADMIN_ONLY)
    update_collection(token, "bots", createRule=ADMIN_ONLY, updateRule=ADMIN_ONLY, deleteRule=ADMIN_ONLY)
    update_collection(token, "broadcasts", createRule=ADMIN_ONLY, updateRule=ADMIN_ONLY, deleteRule=ADMIN_ONLY)
    update_collection(token, "resources", createRule=ADMIN_ONLY, updateRule=ADMIN_ONLY, deleteRule=ADMIN_ONLY)

    print("3. Adding payments.license_key field...")
    ensure_license_key_field(token)

    print("4. Creating public masked signal_previews view...")
    ensure_signal_previews(token)

    print("5. Cleaning fabricated demo data...")
    cleanup_demo_data(token)

    print("\nBACKEND HARDENING COMPLETE")


if __name__ == "__main__":
    main()
