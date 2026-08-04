#!/usr/bin/env bash

set -Eeuo pipefail
umask 077

PROJECT_DIR="${PROJECT_DIR:-/opt/teaching-yoga}"
BACKUP_DIR="${BACKUP_DIR:-${PROJECT_DIR}/backups/postgres}"
POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-teaching-yoga-postgres}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
LOCK_FILE="${LOCK_FILE:-/tmp/teaching-yoga-postgres-backup.lock}"

if ! [[ "$RETENTION_DAYS" =~ ^[1-9][0-9]*$ ]]; then
  echo "Invalid RETENTION_DAYS: $RETENTION_DAYS" >&2
  exit 1
fi

command -v docker >/dev/null 2>&1 || {
  echo "docker command was not found" >&2
  exit 1
}

command -v flock >/dev/null 2>&1 || {
  echo "flock command was not found" >&2
  exit 1
}

mkdir -p "$BACKUP_DIR"
chmod 700 "$BACKUP_DIR"

exec 9>"$LOCK_FILE"

if ! flock -n 9; then
  echo "Another PostgreSQL backup is already running."
  exit 0
fi

if [[ "$(docker inspect \
  --format='{{.State.Running}}' \
  "$POSTGRES_CONTAINER" 2>/dev/null || true)" != "true" ]]; then
  echo "PostgreSQL container is not running: $POSTGRES_CONTAINER" >&2
  exit 1
fi

timestamp="$(date -u +'%Y%m%d-%H%M%S')"
backup_file="${BACKUP_DIR}/postgres-${timestamp}.dump"
temporary_file="${backup_file}.part"
checksum_file="${backup_file}.sha256"

cleanup() {
  rm -f "$temporary_file"
}

trap cleanup EXIT

echo "Creating PostgreSQL backup..."

docker exec "$POSTGRES_CONTAINER" sh -ec '
  exec pg_dump \
    --format=custom \
    --no-owner \
    --no-privileges \
    --username="$POSTGRES_USER" \
    --dbname="$POSTGRES_DB"
' > "$temporary_file"

if [[ ! -s "$temporary_file" ]]; then
  echo "Backup file is empty." >&2
  exit 1
fi

echo "Validating PostgreSQL backup..."

docker exec -i "$POSTGRES_CONTAINER" \
  pg_restore --list \
  < "$temporary_file" \
  > /dev/null

mv "$temporary_file" "$backup_file"
sha256sum "$backup_file" > "$checksum_file"

chmod 600 "$backup_file" "$checksum_file"

echo "Removing backups older than ${RETENTION_DAYS} days..."

find "$BACKUP_DIR" \
  -maxdepth 1 \
  -type f \
  \( \
    -name 'postgres-*.dump' \
    -o -name 'postgres-*.dump.sha256' \
  \) \
  -mmin "+$((RETENTION_DAYS * 1440))" \
  -print \
  -delete

find "$BACKUP_DIR" \
  -maxdepth 1 \
  -type f \
  -name '*.part' \
  -mmin +1440 \
  -delete

echo
echo "Backup completed successfully."
echo "File: $backup_file"
echo "Retention: ${RETENTION_DAYS} days"
du -h "$backup_file"
