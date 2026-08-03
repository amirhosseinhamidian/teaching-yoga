#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIRECTORY="$(
  cd "$(
    dirname "${BASH_SOURCE[0]}"
  )" &&
  pwd
)"

# shellcheck source=./lib.sh
source "$SCRIPT_DIRECTORY/lib.sh"

require_command pg_restore
require_command psql
require_command sha256sum
require_command diff

require_environment TARGET_DATABASE_URL

ensure_migration_directories

dump_file="${1:-}"

if [[ -z "$dump_file" ]]; then
  latest_dump_pointer="$MIGRATION_BACKUP_ROOT/database/latest-dump.txt"

  if [[ ! -f "$latest_dump_pointer" ]]; then
    echo "Dump file was not provided and latest-dump.txt was not found."
    exit 1
  fi

  dump_file="$(
    cat "$latest_dump_pointer"
  )"
fi

if [[ ! -f "$dump_file" ]]; then
  echo "Dump file does not exist:"
  echo "$dump_file"

  exit 1
fi

checksum_file="${dump_file}.sha256"

if [[ -f "$checksum_file" ]]; then
  echo "Validating dump checksum..."

  sha256sum \
    --check \
    "$checksum_file"
fi

if [[ "$LIARA_DATABASE_URL" == "$TARGET_DATABASE_URL" ]]; then
  echo "Source and target database URLs are identical."
  exit 1
fi

if [[ "${CONFIRM_RESTORE:-}" != "YES" ]]; then
  echo
  echo "WARNING: Target database objects will be replaced."
  echo
  read -r -p "Type RESTORE to continue: " confirmation

  if [[ "$confirmation" != "RESTORE" ]]; then
    echo "Restore cancelled."
    exit 1
  fi
fi

echo
echo "Restoring database..."

pg_restore \
  --dbname="$TARGET_DATABASE_URL" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges \
  --exit-on-error \
  --single-transaction \
  --verbose \
  "$dump_file"

timestamp="$(create_timestamp)"

target_manifest="$MIGRATION_BACKUP_ROOT/database/target-$timestamp.rows.tsv"

echo
echo "Creating target row manifest..."

create_database_row_manifest \
  "$TARGET_DATABASE_URL" \
  "$target_manifest"

source_manifest="${dump_file%.dump}.rows.tsv"

if [[ -f "$source_manifest" ]]; then
  echo
  echo "Comparing source and target row counts..."

  if ! diff \
    --unified \
    "$source_manifest" \
    "$target_manifest"; then

    echo
    echo "ERROR: Database row manifests differ."

    exit 1
  fi

  echo "Database row counts match."
else
  echo "Source row manifest was not found; comparison was skipped."
fi

echo
echo "Running ANALYZE..."

psql \
  "$TARGET_DATABASE_URL" \
  -X \
  -v ON_ERROR_STOP=1 \
  -c "ANALYZE;"

echo
echo "===== DATABASE RESTORE COMPLETED ====="
echo "Dump:   $dump_file"
echo "Rows:   $target_manifest"