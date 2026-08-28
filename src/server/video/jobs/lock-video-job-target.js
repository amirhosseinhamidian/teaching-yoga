const normalizeLockKey = (value) => {
  const key =
    typeof value === 'string'
      ? value.trim()
      : '';

  if (!key) {
    throw new TypeError(
      'Video job lock key is required.'
    );
  }

  return key;
};

/*
 * PostgreSQL transaction-level advisory lock:
 * - scoped only to this transaction
 * - automatically released on commit/rollback
 * - different video targets use different keys
 */
export async function lockVideoJobTarget({
  tx,
  key,
}) {
  if (!tx?.$queryRaw) {
    throw new TypeError(
      'A Prisma transaction client is required.'
    );
  }

  const normalizedKey =
    normalizeLockKey(key);

  /*
   * pg_advisory_xact_lock() returns PostgreSQL `void`.
   * Prisma cannot deserialize a raw `void` column, so cast
   * the function result to text while keeping the exact same
   * transaction-scoped advisory-lock behavior.
   */
  await tx.$queryRaw`
    SELECT pg_advisory_xact_lock(
      hashtextextended(
        ${normalizedKey},
        0::bigint
      )
    )::text AS "lockResult"
  `;
}
