#!/usr/bin/env bash

set -Eeuo pipefail

APP_BASE_URL="${APP_BASE_URL:-http://127.0.0.1:3000}"
COMPOSE_FILE="${COMPOSE_FILE:-compose.production.yml}"
ENV_FILE="${ENV_FILE:-.env.production}"

WEB_CONTAINER="${WEB_CONTAINER:-teaching-yoga-web}"
WORKER_CONTAINER="${WORKER_CONTAINER:-teaching-yoga-video-worker}"

CURL_TIMEOUT_SECONDS="${CURL_TIMEOUT_SECONDS:-15}"
HEALTH_WAIT_SECONDS="${HEALTH_WAIT_SECONDS:-120}"
CHECK_DOCKER="${CHECK_DOCKER:-true}"
CHECK_STORAGE="${CHECK_STORAGE:-true}"
CHECK_LOGS="${CHECK_LOGS:-true}"

PASSED=0
FAILED=0
WARNINGS=0

print_line() {
  printf '%*s\n' 72 '' | tr ' ' '-'
}

info() {
  printf '\033[1;34m[INFO]\033[0m %s\n' "$*"
}

pass() {
  PASSED=$((PASSED + 1))
  printf '\033[1;32m[PASS]\033[0m %s\n' "$*"
}

warn() {
  WARNINGS=$((WARNINGS + 1))
  printf '\033[1;33m[WARN]\033[0m %s\n' "$*"
}

fail() {
  FAILED=$((FAILED + 1))
  printf '\033[1;31m[FAIL]\033[0m %s\n' "$*"
}

require_command() {
  local command_name="$1"

  if ! command -v "$command_name" >/dev/null 2>&1; then
    fail "Required command is missing: $command_name"
    return 1
  fi
}

http_status() {
  local url="$1"

  curl \
    --silent \
    --show-error \
    --output /dev/null \
    --max-time "$CURL_TIMEOUT_SECONDS" \
    --write-out '%{http_code}' \
    "$url"
}

check_http_endpoint() {
  local label="$1"
  local path="$2"
  shift 2

  local allowed_statuses=("$@")
  local url="${APP_BASE_URL}${path}"
  local status

  status="$(http_status "$url" 2>/dev/null || printf '000')"

  for allowed in "${allowed_statuses[@]}"; do
    if [[ "$status" == "$allowed" ]]; then
      pass "$label returned HTTP $status"
      return 0
    fi
  done

  fail "$label returned HTTP $status — expected: ${allowed_statuses[*]}"
  return 1
}

get_container_state() {
  local container="$1"

  docker inspect \
    "$container" \
    --format '{{.State.Status}}' \
    2>/dev/null || true
}

get_container_health() {
  local container="$1"

  docker inspect \
    "$container" \
    --format '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' \
    2>/dev/null || true
}

wait_for_web_health() {
  local elapsed=0

  info "Waiting for Web healthcheck..."

  while (( elapsed < HEALTH_WAIT_SECONDS )); do
    local state
    local health

    state="$(get_container_state "$WEB_CONTAINER")"
    health="$(get_container_health "$WEB_CONTAINER")"

    if [[ "$state" == "running" && "$health" == "healthy" ]]; then
      pass "Web container is running and healthy"
      return 0
    fi

    if [[ "$state" == "exited" || "$state" == "dead" ]]; then
      fail "Web container stopped with state: $state"
      return 1
    fi

    sleep 5
    elapsed=$((elapsed + 5))
  done

  fail "Web container did not become healthy within ${HEALTH_WAIT_SECONDS}s"
  return 1
}

check_container() {
  local label="$1"
  local container="$2"

  local state
  local health

  state="$(get_container_state "$container")"
  health="$(get_container_health "$container")"

  if [[ "$state" != "running" ]]; then
    fail "$label container state is '$state'"
    return 1
  fi

  if [[ "$health" == "healthy" || "$health" == "none" ]]; then
    pass "$label container is running; health=$health"
    return 0
  fi

  fail "$label container health is '$health'"
  return 1
}

check_database_from_web() {
  if docker exec "$WEB_CONTAINER" node - <<'NODE'
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

(async () => {
  try {
    await prisma.$queryRawUnsafe('SELECT 1');
    process.stdout.write('ok');
  } finally {
    await prisma.$disconnect();
  }
})().catch((error) => {
  process.stderr.write(error?.message || String(error));
  process.exit(1);
});
NODE
  then
    pass "Database query succeeded from Web container"
  else
    fail "Database query failed from Web container"
  fi
}

check_storage_directory() {
  local container="$1"
  local label="$2"
  local directory="$3"
  local test_file="${directory}/.smoke-test-${RANDOM}-$$"

  if docker exec "$container" sh -lc "
    test -d '$directory' &&
    touch '$test_file' &&
    rm -f '$test_file'
  "; then
    pass "$label is writable: $directory"
  else
    fail "$label is not writable: $directory"
  fi
}

check_log_rotation() {
  local container="$1"
  local label="$2"
  local config

  config="$(
    docker inspect \
      "$container" \
      --format '{{json .HostConfig.LogConfig}}' \
      2>/dev/null || true
  )"

  if [[ -z "$config" ]]; then
    fail "Could not inspect logging configuration for $label"
    return
  fi

  if [[ "$config" == *'"Type":"local"'* ]] &&
     [[ "$config" == *'"max-size":"20m"'* ]] &&
     [[ "$config" == *'"max-file":"5"'* ]]; then
    pass "$label log rotation is configured"
  else
    warn "$label logging configuration differs from expected: $config"
  fi
}

check_recent_fatal_logs() {
  local container="$1"
  local label="$2"
  local output

  output="$(
    docker logs \
      "$container" \
      --since 10m \
      2>&1 |
      grep -Ei \
        '"level":"fatal"|"level":"error".*(uncaught|unhandled|process_fatal|startup_failed)' \
      || true
  )"

  if [[ -z "$output" ]]; then
    pass "$label has no recent fatal process errors"
  else
    warn "$label has recent fatal/error log entries"
    printf '%s\n' "$output" | tail -n 10
  fi
}

show_failure_diagnostics() {
  print_line
  info "Failure diagnostics"

  docker compose \
    --env-file "$ENV_FILE" \
    -f "$COMPOSE_FILE" \
    ps -a || true

  echo
  info "Web logs"

  docker logs \
    "$WEB_CONTAINER" \
    --tail 80 \
    2>&1 || true

  echo
  info "Worker logs"

  docker logs \
    "$WORKER_CONTAINER" \
    --tail 80 \
    2>&1 || true
}

main() {
  print_line
  info "Teaching Yoga Production Smoke Test"
  info "Base URL: $APP_BASE_URL"
  print_line

  require_command curl

  if [[ "$CHECK_DOCKER" == "true" ]]; then
    require_command docker

    wait_for_web_health || true

    check_container \
      "Web" \
      "$WEB_CONTAINER" || true

    check_container \
      "Video Worker" \
      "$WORKER_CONTAINER" || true
  fi

  print_line
  info "HTTP checks"

  check_http_endpoint \
    "Health API" \
    "/api/health" \
    200 || true

  check_http_endpoint \
    "Home page" \
    "/" \
    200 307 308 || true

  check_http_endpoint \
    "Courses page" \
    "/courses" \
    200 307 308 || true

  check_http_endpoint \
    "Articles page" \
    "/articles" \
    200 307 308 || true

  check_http_endpoint \
    "Login page" \
    "/login" \
    200 307 308 || true

  check_http_endpoint \
    "Protected profile page" \
    "/profile" \
    200 302 303 307 308 || true

  if [[ "$CHECK_DOCKER" == "true" ]]; then
    print_line
    info "Database check"

    check_database_from_web || true
  fi

  if [[ "$CHECK_DOCKER" == "true" && "$CHECK_STORAGE" == "true" ]]; then
    print_line
    info "Storage checks"

    check_storage_directory \
      "$WEB_CONTAINER" \
      "Web published storage" \
      "/app/storage/published"

    check_storage_directory \
      "$WEB_CONTAINER" \
      "Web uploads storage" \
      "/app/storage/uploads"

    check_storage_directory \
      "$WORKER_CONTAINER" \
      "Worker processing storage" \
      "/app/storage/processing"

    check_storage_directory \
      "$WORKER_CONTAINER" \
      "Worker published storage" \
      "/app/storage/published"
  fi

  if [[ "$CHECK_DOCKER" == "true" && "$CHECK_LOGS" == "true" ]]; then
    print_line
    info "Logging checks"

    check_log_rotation \
      "$WEB_CONTAINER" \
      "Web"

    check_log_rotation \
      "$WORKER_CONTAINER" \
      "Worker"

    check_recent_fatal_logs \
      "$WEB_CONTAINER" \
      "Web"

    check_recent_fatal_logs \
      "$WORKER_CONTAINER" \
      "Worker"
  fi

  print_line

  printf 'Passed:   %d\n' "$PASSED"
  printf 'Warnings: %d\n' "$WARNINGS"
  printf 'Failed:   %d\n' "$FAILED"

  print_line

  if (( FAILED > 0 )); then
    show_failure_diagnostics
    exit 1
  fi

  pass "Production smoke test completed successfully"
}

main "$@"