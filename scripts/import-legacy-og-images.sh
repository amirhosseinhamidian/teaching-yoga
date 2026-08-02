#!/usr/bin/env bash

set -Eeuo pipefail

PROJECT_ROOT="$(
  cd "$(
    dirname "${BASH_SOURCE[0]}"
  )/.." &&
  pwd
)"

cd "$PROJECT_ROOT"

POSTGRES_CONTAINER="${POSTGRES_CONTAINER:-teaching-yoga-postgres}"
POSTGRES_USER="${POSTGRES_USER:-teaching_yoga}"
POSTGRES_DATABASE="${POSTGRES_DATABASE:-teaching_yoga_dev}"

LEGACY_ORIGIN="https://beta.samaneyoga.ir"

PUBLISHED_ROOT="$PROJECT_ROOT/storage/published"
BACKUP_ROOT="$PROJECT_ROOT/backups"

TIMESTAMP="$(
  date '+%Y%m%d-%H%M%S'
)"

MANIFEST_FILE="$BACKUP_ROOT/legacy-og-images-$TIMESTAMP.tsv"

mkdir -p \
  "$PUBLISHED_ROOT/images/open-graph" \
  "$BACKUP_ROOT"

printf \
  'page\tlegacy_url\tstorage_key\tsize_bytes\tsha256\tmime_type\n' \
  > "$MANIFEST_FILE"

downloaded_count=0
skipped_count=0
failed_count=0

echo "Importing legacy Open Graph images..."
echo "Manifest: $MANIFEST_FILE"
echo

while IFS=$'\t' read -r page legacy_url; do
  if [[ -z "${legacy_url:-}" ]]; then
    continue
  fi

  relative_path="$legacy_url"

  relative_path="${relative_path#https://beta.samaneyoga.ir/}"
  relative_path="${relative_path#http://beta.samaneyoga.ir/}"

  if [[ "$relative_path" == "$legacy_url" ]]; then
    echo "INVALID URL [$page]"
    echo "  $legacy_url"

    failed_count=$((failed_count + 1))
    continue
  fi

  if [[ \
    "$relative_path" == *".."* ||
    "$relative_path" == *"\\"*
  ]]; then
    echo "UNSAFE PATH [$page]"
    echo "  $relative_path"

    failed_count=$((failed_count + 1))
    continue
  fi

  destination_path="$PUBLISHED_ROOT/$relative_path"
  destination_directory="$(
    dirname "$destination_path"
  )"

  temporary_path="${destination_path}.part"

  mkdir -p "$destination_directory"

  echo "PAGE: $page"
  echo "FROM: $legacy_url"
  echo "TO:   $destination_path"

  if [[ -f "$destination_path" ]]; then
    echo "STATUS: already exists"

    skipped_count=$((skipped_count + 1))
  else
    rm -f "$temporary_path"

    if ! curl \
      --fail \
      --location \
      --silent \
      --show-error \
      --retry 4 \
      --retry-delay 2 \
      --retry-all-errors \
      --connect-timeout 20 \
      --max-time 300 \
      --output "$temporary_path" \
      "$legacy_url"; then

      echo "STATUS: download failed"

      rm -f "$temporary_path"

      failed_count=$((failed_count + 1))

      echo
      continue
    fi

    mime_type="$(
      file \
        --brief \
        --mime-type \
        "$temporary_path"
    )"

    case "$mime_type" in
      image/jpeg|image/png|image/webp|image/gif)
        ;;
      *)
        echo "STATUS: invalid MIME type"
        echo "MIME:   $mime_type"

        rm -f "$temporary_path"

        failed_count=$((failed_count + 1))

        echo
        continue
        ;;
    esac

    if [[ ! -s "$temporary_path" ]]; then
      echo "STATUS: empty file"

      rm -f "$temporary_path"

      failed_count=$((failed_count + 1))

      echo
      continue
    fi

    chmod 0644 "$temporary_path"

    mv \
      "$temporary_path" \
      "$destination_path"

    downloaded_count=$((downloaded_count + 1))

    echo "STATUS: downloaded"
  fi

  mime_type="$(
    file \
      --brief \
      --mime-type \
      "$destination_path"
  )"

  size_bytes="$(
    wc -c \
      < "$destination_path" \
      | tr -d ' '
  )"

  sha256="$(
    shasum \
      -a 256 \
      "$destination_path" \
      | awk '{ print $1 }'
  )"

  printf \
    '%s\t%s\t%s\t%s\t%s\t%s\n' \
    "$page" \
    "$legacy_url" \
    "$relative_path" \
    "$size_bytes" \
    "$sha256" \
    "$mime_type" \
    >> "$MANIFEST_FILE"

  echo "SIZE:   $size_bytes"
  echo "SHA256: $sha256"
  echo "MIME:   $mime_type"
  echo
done < <(
  docker exec -i \
    "$POSTGRES_CONTAINER" \
    psql \
    -U "$POSTGRES_USER" \
    -d "$POSTGRES_DATABASE" \
    -At \
    -F $'\t' <<'SQL'
SELECT
  page,
  value
FROM "SeoSetting"
WHERE key = 'ogImage'
  AND value ~* '^https?://beta\.samaneyoga\.ir/'
ORDER BY page;
SQL
)

echo "===== IMPORT SUMMARY ====="
echo "Downloaded: $downloaded_count"
echo "Skipped:    $skipped_count"
echo "Failed:     $failed_count"
echo "Manifest:   $MANIFEST_FILE"

if [[ "$failed_count" -gt 0 ]]; then
  echo
  echo "Import was not completed successfully."
  exit 1
fi

echo
echo "All legacy Open Graph images are available locally."