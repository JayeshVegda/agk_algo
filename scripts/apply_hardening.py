#!/usr/bin/env python3
"""Check that the PocketBase payment and cycle migrations are installed."""
import json
import os
import urllib.request

BASE_URL = os.environ.get("AKG_URL", "http://127.0.0.1:8095").rstrip("/")


def request(path, *, payload=None, token=None):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = token
    req = urllib.request.Request(
        f"{BASE_URL}{path}",
        data=json.dumps(payload).encode() if payload is not None else None,
        headers=headers,
    )
    with urllib.request.urlopen(req, timeout=15) as response:
        return json.load(response)


def main():
    email = os.environ.get("AKG_SUPERUSER_EMAIL")
    password = os.environ.get("AKG_SUPERUSER_PASSWORD")
    if not email or not password:
        raise SystemExit("Set AKG_SUPERUSER_EMAIL and AKG_SUPERUSER_PASSWORD first.")

    token = request("/api/collections/_superusers/auth-with-password",
                    payload={"identity": email, "password": password})["token"]
    content = request("/api/collections/message_content", token=token)
    payments = request("/api/collections/payments", token=token)
    for key in ("listRule", "viewRule"):
        rule = content.get(key) or ""
        if not all(f"active_signal_access.{tier}_member" in rule for tier in ("sr", "vip")):
            raise SystemExit("Scheduled-cycle access rules missing. Apply the bundled PocketBase migrations.")
    fields = {field["name"] for field in payments["fields"]}
    if not {"license_key", "signal_cycle"} <= fields:
        raise SystemExit("Payment fields missing. Apply the bundled PocketBase migrations.")
    for key in ("updateRule", "deleteRule"):
        rule = payments.get(key)
        if rule is None:
            continue
        normalized = "".join(rule.replace("'", '"').split())
        if normalized not in (
            '@request.auth.role="admin"',
            '@request.auth.id!=""&&(@request.auth.role="admin"||@request.auth.collectionName="_superusers")',
        ):
            raise SystemExit(f"Unexpected payments {key}. Review the collection access rules.")
    print("Payment fields and scheduled-cycle access rules are present.")


if __name__ == "__main__":
    main()
