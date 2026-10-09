#!/usr/bin/env bash
#
# Nightly backup for Kashmir Connect: the MySQL database and the uploads folder.
# Safe to run while the API is serving (the dump uses a single transaction).
#
# Usage:
#   server/scripts/backup.sh          # writes to ~/backups/kashmir-connect
#   BACKUP_DIR=/mnt/backups RETENTION_DAYS=30 server/scripts/backup.sh
#
# Nightly cron (02:30) — replace the path with where this repo lives on the server:
#   30 2 * * * /home/USER/kashmir-connect/server/scripts/backup.sh >> /home/USER/kashmir-backup.log 2>&1
#
# Restore:
#   gunzip < db/kashmir_connect-<stamp>.sql.gz | mysql -u root kashmir_connect
#   tar -xzf uploads/uploads-<stamp>.tar.gz -C /path/to/kashmir-connect/server
#
# Credentials come from server/.env (DATABASE_URL). The password is passed to
# mysqldump through a 0600 defaults file, never on the command line.

set -euo pipefail

cd "$(dirname "$0")/.."

read_env_value() {
  local key="$1" line value
  [[ -f .env ]] || return 0
  line="$(grep -E "^${key}=" .env | head -n 1 || true)"
  [[ -n "$line" ]] || return 0
  value="${line#*=}"
  value="${value%\"}"
  value="${value#\"}"
  printf '%s' "$value"
}

DATABASE_URL="${DATABASE_URL:-$(read_env_value DATABASE_URL)}"
UPLOAD_DIR="${UPLOAD_DIR:-$(read_env_value UPLOAD_DIR)}"
UPLOAD_DIR="${UPLOAD_DIR:-./uploads}"
BACKUP_DIR="${BACKUP_DIR:-$HOME/backups/kashmir-connect}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
STAMP="$(date +%Y%m%d-%H%M%S)"

if [[ -z "$DATABASE_URL" ]]; then
  echo "[backup] DATABASE_URL is not set (is server/.env in place?)" >&2
  exit 1
fi

command -v mysqldump >/dev/null || { echo "[backup] mysqldump not found" >&2; exit 1; }
command -v node >/dev/null || { echo "[backup] node not found" >&2; exit 1; }

mkdir -p "$BACKUP_DIR/db" "$BACKUP_DIR/uploads"

DB_NAME="$(DB_URL="$DATABASE_URL" node -e 'process.stdout.write(new URL(process.env.DB_URL).pathname.replace(/^\/+/, ""))')"
if [[ -z "$DB_NAME" ]]; then
  echo "[backup] DATABASE_URL does not include a database name" >&2
  exit 1
fi

CNF="$(mktemp)"
chmod 600 "$CNF"
trap 'rm -f "$CNF"' EXIT

DB_URL="$DATABASE_URL" node -e '
  const url = new URL(process.env.DB_URL);
  const lines = [
    "[client]",
    `host=${url.hostname}`,
    `port=${url.port || "3306"}`,
    `user=${decodeURIComponent(url.username)}`,
  ];
  if (url.password) lines.push(`password=${decodeURIComponent(url.password)}`);
  process.stdout.write(lines.join("\n") + "\n");
' > "$CNF"

echo "[backup] dumping $DB_NAME to $BACKUP_DIR/db/${DB_NAME}-${STAMP}.sql.gz"
mysqldump \
  --defaults-extra-file="$CNF" \
  --single-transaction \
  --routines --triggers \
  --default-character-set=utf8mb4 \
  "$DB_NAME" | gzip -9 > "$BACKUP_DIR/db/${DB_NAME}-${STAMP}.sql.gz"

echo "[backup] archiving uploads ($UPLOAD_DIR)"
tar -czf "$BACKUP_DIR/uploads/uploads-${STAMP}.tar.gz" \
  -C "$(dirname "$UPLOAD_DIR")" "$(basename "$UPLOAD_DIR")"

find "$BACKUP_DIR/db" -type f -name '*.sql.gz' -mtime +"$RETENTION_DAYS" -delete
find "$BACKUP_DIR/uploads" -type f -name '*.tar.gz' -mtime +"$RETENTION_DAYS" -delete

echo "[backup] done — keeping the last $RETENTION_DAYS days in $BACKUP_DIR"
