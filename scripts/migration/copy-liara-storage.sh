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

require_command rclone
require_command python3
require_command df

ensure_migration_directories
configure_liara_rclone

timestamp="$(create_timestamp)"

log_file="$MIGRATION_BACKUP_ROOT/logs/storage-copy-$timestamp.log"

check_log="$MIGRATION_BACKUP_ROOT/logs/storage-check-$timestamp.log"

difference_file="$MIGRATION_BACKUP_ROOT/storage/storage-differences-$timestamp.txt"

transfers="${RCLONE_TRANSFERS:-8}"
checkers="${RCLONE_CHECKERS:-16}"

echo "===== SOURCE BUCKET BEFORE COPY ====="

source_size_before="$(
  rclone size \
    "liara:${LIARA_S3_BUCKET}" \
    --json
)"

echo "$source_size_before" |
  python3 -m json.tool

echo
echo "===== TARGET DISK ====="

df -h "$TARGET_STORAGE_ROOT"

echo
echo "===== STORAGE COPY ====="
echo "Source: liara:${LIARA_S3_BUCKET}"
echo "Target: $TARGET_STORAGE_ROOT"
echo "Log:    $log_file"

rclone copy \
  "liara:${LIARA_S3_BUCKET}" \
  "$TARGET_STORAGE_ROOT" \
  --transfers "$transfers" \
  --checkers "$checkers" \
  --retries 8 \
  --low-level-retries 20 \
  --contimeout 30s \
  --timeout 10m \
  --stats 30s \
  --stats-one-line-date \
  --create-empty-src-dirs \
  --log-level INFO \
  --log-file "$log_file" \
  --progress

echo
echo "===== SIZE-BASED VERIFICATION ====="

rclone check \
  "liara:${LIARA_S3_BUCKET}" \
  "$TARGET_STORAGE_ROOT" \
  --one-way \
  --size-only \
  --checkers "$checkers" \
  --combined "$difference_file" \
  --log-level INFO \
  --log-file "$check_log"

echo
echo "===== SOURCE BUCKET AFTER COPY ====="

source_size_after="$(
  rclone size \
    "liara:${LIARA_S3_BUCKET}" \
    --json
)"

echo "$source_size_after" |
  python3 -m json.tool

echo
echo "===== LOCAL TARGET SIZE ====="

target_size="$(
  rclone size \
    "$TARGET_STORAGE_ROOT" \
    --json
)"

echo "$target_size" |
  python3 -m json.tool

echo
echo "===== STORAGE COPY COMPLETED ====="
echo "Copy log:       $log_file"
echo "Check log:      $check_log"
echo "Difference log: $difference_file"