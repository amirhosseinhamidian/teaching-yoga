#!/usr/bin/env bash

set -Eeuo pipefail

APP_URL="${APP_URL:-https://vps.samaneyoga.ir}"
DISK_WARNING_PERCENT="${DISK_WARNING_PERCENT:-80}"
BACKUP_MAX_AGE_HOURS="${BACKUP_MAX_AGE_HOURS:-36}"
BACKUP_DIR="${BACKUP_DIR:-/opt/teaching-yoga/backups/postgres}"

FAILED=0

pass() {
  printf '[PASS] %s\n' "$*"
}

fail() {
  printf '[FAIL] %s\n' "$*" >&2
  FAILED=$((FAILED + 1))
}

check_service() {
  local service="$1"

  if systemctl is-active --quiet "$service"; then
    pass "Service is active: $service"
  else
    fail "Service is not active: $service"
  fi
}

check_container() {
  local container="$1"
  local state
  local health

  state="$(
    docker inspect \
      --format='{{.State.Status}}' \
      "$container" 2>/dev/null || true
  )"

  health="$(
    docker inspect \
      --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' \
      "$container" 2>/dev/null || true
  )"

  if [[ "$state" == "running" ]] &&
     [[ "$health" == "healthy" || "$health" == "none" ]]; then
    pass "Container is healthy: $container"
  else
    fail "Container problem: $container state=$state health=$health"
  fi
}

echo "===== CORE SERVICES ====="

check_service docker
check_service nginx

echo
echo "===== CONTAINERS ====="

check_container teaching-yoga-postgres
check_container teaching-yoga-web
check_container teaching-yoga-video-worker

echo
echo "===== HTTPS HEALTH ====="

health_response="$(
  curl \
    --fail \
    --silent \
    --show-error \
    --max-time 20 \
    "${APP_URL}/api/health" 2>/dev/null || true
)"

if [[ "$health_response" == *'"status":"ok"'* ]] &&
   [[ "$health_response" == *'"database":"ok"'* ]]; then
  pass "HTTPS and database health endpoint are OK"
else
  fail "HTTPS health endpoint failed: ${health_response:-no response}"
fi

echo
echo "===== DISK USAGE ====="

disk_usage="$(
  df -P / |
  awk 'NR == 2 {gsub("%", "", $5); print $5}'
)"

if [[ "$disk_usage" =~ ^[0-9]+$ ]] &&
   (( disk_usage < DISK_WARNING_PERCENT )); then
  pass "Root disk usage is ${disk_usage}%"
else
  fail "Root disk usage is ${disk_usage}% — threshold=${DISK_WARNING_PERCENT}%"
fi

echo
echo "===== DATABASE BACKUP ====="

latest_backup="$(
  find "$BACKUP_DIR" \
    -maxdepth 1 \
    -type f \
    -name 'postgres-*.dump' \
    -printf '%T@ %p\n' 2>/dev/null |
  sort -nr |
  head -n 1 |
  cut -d' ' -f2-
)"

if [[ -z "$latest_backup" ]]; then
  fail "No PostgreSQL backup was found"
else
  backup_timestamp="$(stat -c '%Y' "$latest_backup")"
  current_timestamp="$(date +%s)"
  backup_age_hours=$(( (current_timestamp - backup_timestamp) / 3600 ))

  if (( backup_age_hours <= BACKUP_MAX_AGE_HOURS )); then
    pass "Latest backup age is ${backup_age_hours} hour(s)"
  else
    fail "Latest backup is ${backup_age_hours} hours old"
  fi

  if [[ -f "${latest_backup}.sha256" ]] &&
     sha256sum -c "${latest_backup}.sha256" >/dev/null 2>&1; then
    pass "Latest backup checksum is valid"
  else
    fail "Latest backup checksum validation failed"
  fi
fi

echo
echo "===== RESULT ====="

if (( FAILED > 0 )); then
  echo "Health check failed with ${FAILED} problem(s)." >&2
  exit 1
fi

echo "All VPS health checks passed."
