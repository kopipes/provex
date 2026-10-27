#!/usr/bin/env bash
set -euo pipefail

# Backup Provex SQLite database + receipt files to Cloudflare R2 safely.
# Usage: /usr/local/bin/backup-provex-to-r2.sh [/etc/backup-provex.env]
#
# - Database: consistent snapshot via `sqlite3 .backup`, gzipped, uploaded to
#   s3://<bucket>/backups/ with time-based retention (RETENTION_DAYS).
# - Receipts: append-only mirror of the uploads directory to
#   s3://<bucket>/uploads/. Files are never deleted remotely, so receipts still
#   referenced by archived database backups remain recoverable.

ENV_FILE="${1:-/etc/backup-provex.env}"
if [ ! -f "$ENV_FILE" ]; then
  echo "Env file $ENV_FILE not found" >&2
  exit 1
fi
source "$ENV_FILE"

for v in SRC_DB_PATH R2_ACCOUNT_ID R2_ACCESS_KEY R2_SECRET_KEY R2_BUCKET; do
  if [ -z "${!v:-}" ]; then
    echo "Required variable $v is not set in $ENV_FILE" >&2
    exit 1
  fi
done

LOCKFILE="/var/lock/backup-provex.lock"
mkdir -p "$(dirname "$LOCKFILE")"
exec 9>"$LOCKFILE" || exit 1
if ! flock -n 9; then
  echo "Another Provex backup process is running. Exiting." >&2
  exit 0
fi

TS=$(date +%Y%m%d_%H%M%S)
TMPDIR=$(mktemp -d /tmp/provex-backup-${TS}.XXXX)
trap 'rm -rf "$TMPDIR"' EXIT

TMP_DB="$TMPDIR/provex-${TS}.db"
BACKUP_FILE="$TMPDIR/provex-${TS}.db.gz"

if ! command -v sqlite3 >/dev/null 2>&1; then
  echo "sqlite3 CLI not found" >&2
  exit 1
fi
if ! command -v aws >/dev/null 2>&1; then
  echo "aws CLI not found (required for upload)" >&2
  exit 1
fi

echo "Creating consistent backup from $SRC_DB_PATH -> $TMP_DB"
sqlite3 "$SRC_DB_PATH" ".backup '$TMP_DB'"

echo "Compressing -> $BACKUP_FILE"
gzip -c "$TMP_DB" > "$BACKUP_FILE"

if [ -n "${GPG_PASSPHRASE:-}" ]; then
  if ! command -v gpg >/dev/null 2>&1; then
    echo "gpg not found but GPG_PASSPHRASE was set; aborting" >&2
    exit 1
  fi
  GPG_FILE="$BACKUP_FILE.gpg"
  echo "$GPG_PASSPHRASE" | gpg --batch --yes --passphrase-fd 0 -c --cipher-algo AES256 -o "$GPG_FILE" "$BACKUP_FILE"
  rm -f "$BACKUP_FILE"
  BACKUP_FILE="$GPG_FILE"
fi

R2_ENDPOINT="https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com"
DEST_PATH="s3://${R2_BUCKET}/backups/$(basename "$BACKUP_FILE")"

echo "Uploading $BACKUP_FILE to $DEST_PATH"
AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY" \
AWS_SECRET_ACCESS_KEY="$R2_SECRET_KEY" \
  aws --endpoint-url "$R2_ENDPOINT" s3 cp "$BACKUP_FILE" "$DEST_PATH"

echo "Upload complete. Cleaning temp files."
rm -rf "$TMPDIR"

if [ -n "${RETENTION_DAYS:-}" ]; then
  if [[ "$RETENTION_DAYS" =~ ^[0-9]+$ ]] && [ "$RETENTION_DAYS" -gt 0 ]; then
    CUTOFF_TS=$(date -d "$RETENTION_DAYS days ago" +%Y%m%d_%H%M%S)
    echo "Retention enabled: deleting provex backups older than $RETENTION_DAYS days (cutoff $CUTOFF_TS)"
    mapfile -t OLD_KEYS < <(
      AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY" AWS_SECRET_ACCESS_KEY="$R2_SECRET_KEY" \
        aws --endpoint-url "$R2_ENDPOINT" s3 ls "s3://${R2_BUCKET}/backups/" | \
        awk -v cutoff="$CUTOFF_TS" '
          {
            name=$4
            if (name ~ /^provex-[0-9]{8}_[0-9]{6}\.db(\.gz)?(\.gpg)?$/) {
              ts=name
              sub(/^provex-/, "", ts)
              sub(/\.db(\.gz)?(\.gpg)?$/, "", ts)
              if (ts < cutoff) print name
            }
          }
        '
    )
    if [ "${#OLD_KEYS[@]}" -eq 0 ]; then
      echo "Retention cleanup: no old provex backups to delete."
    else
      for key in "${OLD_KEYS[@]}"; do
        echo "Deleting expired backup s3://${R2_BUCKET}/backups/${key}"
        AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY" AWS_SECRET_ACCESS_KEY="$R2_SECRET_KEY" \
          aws --endpoint-url "$R2_ENDPOINT" s3 rm "s3://${R2_BUCKET}/backups/${key}"
      done
    fi
  else
    echo "RETENTION_DAYS is set but invalid: $RETENTION_DAYS; skipping cleanup."
  fi
fi

# ---------- Receipt files (append-only mirror) ----------
# No --delete is used on purpose: a receipt removed from disk may still be
# referenced by an older database backup, so remote copies are kept.
UPLOADS_DIR="${SRC_UPLOADS_PATH:-}"
if [ -n "$UPLOADS_DIR" ] && [ -d "$UPLOADS_DIR" ]; then
  echo "Syncing receipt files from $UPLOADS_DIR to s3://${R2_BUCKET}/uploads/"
  AWS_ACCESS_KEY_ID="$R2_ACCESS_KEY" \
  AWS_SECRET_ACCESS_KEY="$R2_SECRET_KEY" \
    aws --endpoint-url "$R2_ENDPOINT" s3 sync "$UPLOADS_DIR" "s3://${R2_BUCKET}/uploads/" \
      --only-show-errors --no-progress --size-only
  echo "Receipt sync complete."
else
  echo "SRC_UPLOADS_PATH not set or not a directory; skipping receipt sync."
fi

echo "Backup finished: $(basename "$DEST_PATH")"
exit 0
