#!/usr/bin/env bash

set -Eeuo pipefail

PROJECT_ROOT="$(
  cd "$(dirname "${BASH_SOURCE[0]}")/../.." &&
  pwd
)"

MIGRATION_ENV_FILE="${MIGRATION_ENV_FILE:-$PROJECT_ROOT/.env.migration}"

if [[ ! -f "$MIGRATION_ENV_FILE" ]]; then
  echo "Migration environment file was not found:"
  echo "$MIGRATION_ENV_FILE"
  exit 1
fi

set -a

# shellcheck source=/dev/null
source "$MIGRATION_ENV_FILE"

set +a

require_command() {
  local command_name="$1"

  if ! command -v "$command_name" >/dev/null 2>&1; then
    echo "Required command is missing: $command_name"
    exit 1
  fi
}

require_environment() {
  local variable_name="$1"
  local variable_value="${!variable_name-}"

  if [[ -z "$variable_value" ]]; then
    echo "Required environment variable is missing: $variable_name"
    exit 1
  fi
}

create_timestamp() {
  date -u '+%Y%m%dT%H%M%SZ'
}

ensure_migration_directories() {
  require_environment MIGRATION_BACKUP_ROOT
  require_environment TARGET_STORAGE_ROOT

  mkdir -p \
    "$MIGRATION_BACKUP_ROOT/database" \
    "$MIGRATION_BACKUP_ROOT/storage" \
    "$MIGRATION_BACKUP_ROOT/logs" \
    "$TARGET_STORAGE_ROOT"
}

configure_liara_rclone() {
  require_environment LIARA_S3_ENDPOINT
  require_environment LIARA_S3_BUCKET
  require_environment LIARA_S3_ACCESS_KEY
  require_environment LIARA_S3_SECRET_KEY

  export RCLONE_CONFIG_LIARA_TYPE="s3"
  export RCLONE_CONFIG_LIARA_PROVIDER="Other"
  export RCLONE_CONFIG_LIARA_ENV_AUTH="false"

  export RCLONE_CONFIG_LIARA_ACCESS_KEY_ID="$LIARA_S3_ACCESS_KEY"
  export RCLONE_CONFIG_LIARA_SECRET_ACCESS_KEY="$LIARA_S3_SECRET_KEY"

  export RCLONE_CONFIG_LIARA_ENDPOINT="$LIARA_S3_ENDPOINT"
  export RCLONE_CONFIG_LIARA_REGION="${LIARA_S3_REGION:-us-east-1}"
  export RCLONE_CONFIG_LIARA_FORCE_PATH_STYLE="true"
}

create_database_row_manifest() {
  local database_url="$1"
  local output_file="$2"

  local table_name
  local row_count

  : > "$output_file"

  while IFS= read -r table_name; do
    [[ -z "$table_name" ]] && continue

    row_count="$(
      psql \
        "$database_url" \
        -X \
        -v ON_ERROR_STOP=1 \
        -Atc "SELECT COUNT(*) FROM $table_name;"
    )"

    printf \
      '%s\t%s\n' \
      "$table_name" \
      "$row_count" \
      >> "$output_file"
  done < <(
    psql \
      "$database_url" \
      -X \
      -v ON_ERROR_STOP=1 \
      -Atc "
        SELECT format(
          '%I.%I',
          schemaname,
          tablename
        )
        FROM pg_tables
        WHERE schemaname = 'public'
        ORDER BY 1;
      "
  )
}