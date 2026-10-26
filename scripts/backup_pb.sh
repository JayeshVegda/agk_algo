#!/usr/bin/env bash
# AKG ALGO — PocketBase backup.
# Uses SQLite's online .backup API so it is safe to run while the server is up.
#
# Install as a daily cron job (3:30am) with 30-day retention:
#   crontab -e
#   30 3 * * * /path/to/agk_algo/scripts/backup_pb.sh >> /path/to/agk_algo/backups/backup.log 2>&1
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB="$ROOT/pb_data/data.db"
OUT_DIR="$ROOT/backups"
RETENTION_DAYS=30

mkdir -p "$OUT_DIR"
STAMP="$(date -u +%Y%m%dT%H%M%SZ)"
DEST="$OUT_DIR/akg_pb_${STAMP}.db"

if command -v sqlite3 >/dev/null 2>&1; then
  sqlite3 "file:$DB?mode=ro" ".backup '$DEST'"
elif command -v podman >/dev/null 2>&1; then
  # no local sqlite3: borrow it from a container
  podman run --rm -v "$ROOT/pb_data:/data:ro" -v "$OUT_DIR:/out" alpine:3.20 \
    sh -c "apk add -q sqlite && sqlite3 'file:/data/data.db?mode=ro' \".backup '/out/$(basename "$DEST")'\""
else
  echo "ERROR: need sqlite3 or podman available" >&2
  exit 1
fi

echo "$(date -u +%FT%TZ) backup written: $DEST ($(du -h "$DEST" | cut -f1))"

# retention
find "$OUT_DIR" -name 'akg_pb_*.db' -mtime "+$RETENTION_DAYS" -delete
echo "retention: removed backups older than $RETENTION_DAYS days"
