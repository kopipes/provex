#!/usr/bin/env bash
set -euo pipefail

# Restore the Provex SQLite database (and optionally receipt files) from
# Cloudflare R2. Intended for disaster recovery on a fresh VPS.
#
# Usage:
#   ./restore-provex-from-r2.sh                    # list available backups
#   ./restore-provex-from-r2.sh --latest           # restore newest backup
#   ./restore-provex-from-r2.sh --db-key <key>     # restore a specific backup
#   ./restore-provex-from-r2.sh --latest --uploads # also sync receipt files
#   ./restore-provex-from-r2.sh --latest --yes     # skip confirmation prompt
#
# Options:
#   --latest              pick the newest database backup in R2
#   --db-key <key>        exact object key under backups/, e.g. provex-20261027_091835.db.gz
#   --uploads             also download receipts into SRC_UPLOADS_PATH
#   --yes                 do not prompt for confirmation
#   --env-file <path>     config file (default /etc/backup-provex.env)
#   --no-restart          do not stop/start the backend container
#
# The current database is always saved to a timestamped local file before it is
# replaced, and container restart only happens after integrity checks pass.

ENV_FILE="/etc/backup-provex.env"
DB_KEY=""
USE_LATEST=0
DO_UPLOADS=0
ASSUME_YES=0
DO_RESTART=1

while [ $# -gt 0 ]; do
  case "$1" in
    --latest)      USE_LATEST=1; shift ;;
    --db-key)      DB_KEY="${2:-}"; shift 2 ;;
    --uploads)     DO_UPLOADS=1; shift ;;
    --yes|-y)      ASSUME_YES=1; shift ;;
    --no-restart)  DO_RESTART=0; shift ;;
    --env-file)    ENV_FILE="${2:-}"; shift 2 ;;
    -h|--help)     sed -n '2,30p' "$0"; exit 0 ;;
    *) echo "Unknown option: $1" >&2; exit 1 ;;
  esac
done

[ -f "$ENV_FILE" ] || { echo "Env file $ENV_FILE not found" >&2; exit 1; }
# shellcheck disable=SC1090
source "$ENV_FILE"

for v in R2_ACCOUNT_ID R2_ACCESS_KEY R2_SECRET_KEY R2_BUCKET; do
  if [ -z "${!v:-}" ]; then
    echo "Required variable $v is not set in $ENV_FILE" >&2
    exit 1
  fi
done

R2_ENDPOINT="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
export AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY"
export AWS_SECRET_ACCESS_KEY="$R2_SECRET_KEY"
AWS=(aws --endpoint-url "$R2_ENDPOINT")

command -v sqlite3 >/dev/null 2>&1 || { echo "sqlite3 CLI not found" >&2; exit 1; }
command -v aws >/dev/null 2>&1     || { echo "aws CLI not found" >&2; exit 1; }

# ---------- list mode ----------
if [ "$USE_LATEST" -eq 0 ] && [ -z "$DB_KEY" ]; then
  echo "Available database backups in s3://${R2_BUCKET}/backups/ (newest last):"
  echo
  "${AWS[@]}" s3 ls "s3://${R2_BUCKET}/backups/" | grep -E 'provex-[0-9]{8}_[0-9]{6}\.db(\.gz)?(\.gpg)?$' || {
    echo "No database backups found." >&2; exit 1; }
  echo
  echo "Restore with: $0 --latest [--uploads]"
  echo "       or   : $0 --db-key provex_YYYYMMDD_HHMMSS.db.gz [--uploads]"
  exit 0
fi

if [ "$USE_LATEST" -eq 1 ]; then
  DB_KEY=$("${AWS[@]}" s3 ls "s3://${R2_BUCKET}/backups/" \
    | awk '{print $4}' \
    | grep -E '^provex-[0-9]{8}_[0-9]{6}\.db(\.gz)?(\.gpg)?$' \
    | sort | tail -n 1)
  [ -n "$DB_KEY" ] || { echo "No database backups found in R2." >&2; exit 1; }
fi

DEST_DB="${SRC_DB_PATH:?SRC_DB_PATH must be set in $ENV_FILE}"
PROVEX_DIR="${PROVEX_DIR:-$(dirname "$(dirname "$DEST_DB")")}"

echo "Selected backup : $DB_KEY"
echo "Target database : $DEST_DB"
echo "Project dir     : $PROVEX_DIR"
echo "Restore receipts: $([ "$DO_UPLOADS" -eq 1 ] && echo yes || echo no)"
echo

if [ "$ASSUME_YES" -eq 0 ]; then
  printf "This will REPLACE the current database. Continue? [y/N] "
  read -r reply
  case "$reply" in y|Y|yes|YES) ;; *) echo "Aborted."; exit 1 ;; esac
fi

TMPDIR=$(mktemp -d /tmp/provex-restore-XXXXXX)
trap 'rm -rf "$TMPDIR"' EXIT

SRC_OBJ="s3://${R2_BUCKET}/backups/${DB_KEY}"
LOCAL_OBJ="$TMPDIR/$DB_KEY"

echo "Downloading $SRC_OBJ"
"${AWS[@]}" s3 cp "$SRC_OBJ" "$LOCAL_OBJ" --only-show-errors --no-progress

RESTORED_DB="$TMPDIR/restored.db"

case "$LOCAL_OBJ" in
  *.gpg)
    command -v gpg >/dev/null 2>&1 || { echo "Backup is encrypted but gpg is missing" >&2; exit 1; }
    [ -n "${GPG_PASSPHRASE:-}" ] || { echo "Backup is encrypted but GPG_PASSPHRASE is not set" >&2; exit 1; }
    echo "Decrypting"
    echo "$GPG_PASSPHRASE" | gpg --batch --yes --passphrase-fd 0 -d -o "${LOCAL_OBJ%.gpg}" "$LOCAL_OBJ"
    if [ -f "${LOCAL_OBJ%.gpg}.gz" ]; then LOCAL_OBJ="${LOCAL_OBJ%.gpg}.gz"; else LOCAL_OBJ="${LOCAL_OBJ%.gpg}"; fi
    ;;
esac

case "$LOCAL_OBJ" in
  *.gz)
    echo "Decompressing"
    gzip -t "$LOCAL_OBJ" || { echo "gzip integrity check FAILED" >&2; exit 1; }
    gzip -dc "$LOCAL_OBJ" > "$RESTORED_DB"
    ;;
  *)
    cp "$LOCAL_OBJ" "$RESTORED_DB"
    ;;
esac

echo "Verifying SQLite integrity"
INTEGRITY=$(sqlite3 "$RESTORED_DB" "PRAGMA integrity_check;")
[ "$INTEGRITY" = "ok" ] || { echo "Integrity check FAILED: $INTEGRITY" >&2; exit 1; }

USERS=$(sqlite3 "$RESTORED_DB" "SELECT COUNT(*) FROM users;" 2>/dev/null || echo 0)
CLAIMS=$(sqlite3 "$RESTORED_DB" "SELECT COUNT(*) FROM claims;" 2>/dev/null || echo 0)
PROJECTS=$(sqlite3 "$RESTORED_DB" "SELECT COUNT(*) FROM projects;" 2>/dev/null || echo 0)
echo "Backup contents : users=$USERS claims=$CLAIMS projects=$PROJECTS"

if [ "$DO_RESTART" -eq 1 ] && [ -d "$PROVEX_DIR" ] && command -v docker >/dev/null 2>&1; then
  echo "Stopping backend container"
  (cd "$PROVEX_DIR" && docker compose stop backend) || true
fi

if [ -f "$DEST_DB" ]; then
  SAFETY="/var/backups/provex-db-before-restore-$(date +%Y%m%d_%H%M%S).db"
  mkdir -p "$(dirname "$SAFETY")"
  cp "$DEST_DB" "$SAFETY"
  echo "Current database saved to $SAFETY"
fi

mkdir -p "$(dirname "$DEST_DB")"
# cp truncates in place, preserving the bind-mount inode used by Docker.
cp "$RESTORED_DB" "$DEST_DB"
echo "Database restored to $DEST_DB"

if [ "$DO_UPLOADS" -eq 1 ]; then
  UPLOADS_DIR="${SRC_UPLOADS_PATH:-}"
  if [ -z "$UPLOADS_DIR" ]; then
    echo "SRC_UPLOADS_PATH not set; skipping receipt restore." >&2
  else
    mkdir -p "$UPLOADS_DIR"
    echo "Downloading receipt files to $UPLOADS_DIR"
    "${AWS[@]}" s3 sync "s3://${R2_BUCKET}/uploads/" "$UPLOADS_DIR" \
      --only-show-errors --no-progress
    echo "Receipt files restored: $(find "$UPLOADS_DIR" -maxdepth 1 -type f | wc -l) file(s)"
  fi
fi

if [ "$DO_RESTART" -eq 1 ] && [ -d "$PROVEX_DIR" ] && command -v docker >/dev/null 2>&1; then
  echo "Starting backend container"
  (cd "$PROVEX_DIR" && docker compose up -d backend)
  sleep 5
  if command -v curl >/dev/null 2>&1; then
    CODE=$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:8010/api/health || true)
    echo "Health check: HTTP $CODE"
  fi
fi

echo
echo "Restore finished. Verify the application, then update DNS/nginx as needed."
