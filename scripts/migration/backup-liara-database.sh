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

require_command pg_dump
require_command pg_restore
require_command psql
require_command sha256sum

require_environment LIARA_DATABASE_URL

ensure_migration_directories

timestamp="$(create_timestamp)"

backup_directory="$MIGRATION_BACKUP_ROOT/database"

dump_file="$backup_directory/liara-$timestamp.dump"
temporary_dump_file="${dump_file}.part"

toc_file="$backup_directory/liara-$timestamp.toc.txt"
checksum_file="${dump_file}.sha256"

row_manifest_file="$backup_directory/liara-$timestamp.rows.tsv"

echo "Creating Liara PostgreSQL backup..."
echo "Output: $dump_file"

rm -f "$temporary_dump_file"

pg_dump \
  --dbname="$LIARA_DATABASE_URL" \
  --format=custom \
  --compress=6 \
  --no-owner \
  --no-privileges \
  --verbose \
  --file="$temporary_dump_file"

mv \
  "$temporary_dump_file" \
  "$dump_file"

echo
echo "Validating archive table of contents..."

pg_restore \
  --list \
  "$dump_file" \
  > "$toc_file"

echo
echo "Creating exact table row manifest..."

create_database_row_manifest \
  "$LIARA_DATABASE_URL" \
  "$row_manifest_file"

echo
echo "Creating SHA-256 checksum..."

sha256sum \
  "$dump_file" \
  > "$checksum_file"

echo
echo "===== DATABASE BACKUP CREATED ====="
echo "Dump:      $dump_file"
echo "Checksum:  $checksum_file"
echo "TOC:       $toc_file"
echo "Rows:      $row_manifest_file"

printf \
  '%s\n' \
  "$dump_file" \
  > "$backup_directory/latest-dump.txt"