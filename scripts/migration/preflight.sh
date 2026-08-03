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

require_command psql
require_command pg_dump
require_command pg_restore
require_command rclone
require_command python3
require_command df

require_environment LIARA_DATABASE_URL
require_environment TARGET_DATABASE_URL

ensure_migration_directories
configure_liara_rclone

echo "===== DATABASE SOURCE ====="

source_version="$(
  psql \
    "$LIARA_DATABASE_URL" \
    -X \
    -v ON_ERROR_STOP=1 \
    -Atc "SHOW server_version;"
)"

source_version_number="$(
  psql \
    "$LIARA_DATABASE_URL" \
    -X \
    -v ON_ERROR_STOP=1 \
    -Atc "SHOW server_version_num;"
)"

echo "Liara PostgreSQL version: $source_version"

echo
echo "===== DATABASE TARGET ====="

target_version="$(
  psql \
    "$TARGET_DATABASE_URL" \
    -X \
    -v ON_ERROR_STOP=1 \
    -Atc "SHOW server_version;"
)"

target_version_number="$(
  psql \
    "$TARGET_DATABASE_URL" \
    -X \
    -v ON_ERROR_STOP=1 \
    -Atc "SHOW server_version_num;"
)"

echo "Target PostgreSQL version: $target_version"

source_major="$((source_version_number / 10000))"
target_major="$((target_version_number / 10000))"

if (( target_major < source_major )); then
  echo
  echo "ERROR: Target PostgreSQL major version is older than source."
  echo "Source major: $source_major"
  echo "Target major: $target_major"

  exit 1
fi

echo
echo "===== LIARA BUCKET ====="

rclone lsf \
  "liara:${LIARA_S3_BUCKET}" \
  --max-depth 1 \
  >/dev/null

bucket_size_json="$(
  rclone size \
    "liara:${LIARA_S3_BUCKET}" \
    --json
)"

bucket_objects="$(
  python3 -c '
import json
import sys

value = json.load(sys.stdin)
print(value.get("count", 0))
' <<< "$bucket_size_json"
)"

bucket_bytes="$(
  python3 -c '
import json
import sys

value = json.load(sys.stdin)
print(value.get("bytes", 0))
' <<< "$bucket_size_json"
)"

echo "Objects: $bucket_objects"
echo "Bytes:   $bucket_bytes"

echo
echo "===== TARGET STORAGE ====="

df -h "$TARGET_STORAGE_ROOT"

echo
echo "===== PREFLIGHT PASSED ====="