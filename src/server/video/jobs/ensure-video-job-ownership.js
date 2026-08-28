import prismadb from '@/libs/prismadb';

const normalizeRequiredId = (
  value,
  fieldName
) => {
  const normalized =
    typeof value === 'string'
      ? value.trim()
      : '';

  if (!normalized) {
    throw new TypeError(
      `${fieldName} is required.`
    );
  }

  return normalized;
};

/*
 * Existing jobs from before the ownership migration have
 * createdByUserId = NULL.
 *
 * They are not listed globally. If an authenticated admin has
 * the exact job id (for example from localStorage) or touches the
 * same target and receives a conflict, the first admin wins an
 * atomic claim. Two admins cannot claim the same legacy job.
 */
export async function ensureVideoJobOwnership({
  jobId,
  userId,
  claimLegacy = true,
}) {
  const normalizedJobId =
    normalizeRequiredId(
      jobId,
      'jobId'
    );

  const normalizedUserId =
    normalizeRequiredId(
      userId,
      'userId'
    );

  let ownership =
    await prismadb.videoProcessingJob.findUnique({
      where: {
        id: normalizedJobId,
      },

      select: {
        id: true,
        createdByUserId: true,
      },
    });

  if (!ownership) {
    return {
      exists: false,
      owned: false,
      claimed: false,
      ownerId: null,
    };
  }

  if (
    ownership.createdByUserId ===
    normalizedUserId
  ) {
    return {
      exists: true,
      owned: true,
      claimed: false,
      ownerId: normalizedUserId,
    };
  }

  if (ownership.createdByUserId) {
    return {
      exists: true,
      owned: false,
      claimed: false,
      ownerId:
        ownership.createdByUserId,
    };
  }

  if (!claimLegacy) {
    return {
      exists: true,
      owned: false,
      claimed: false,
      ownerId: null,
    };
  }

  const claimResult =
    await prismadb.videoProcessingJob.updateMany({
      where: {
        id: normalizedJobId,
        createdByUserId: null,
      },

      data: {
        createdByUserId:
          normalizedUserId,
      },
    });

  if (claimResult.count === 1) {
    return {
      exists: true,
      owned: true,
      claimed: true,
      ownerId: normalizedUserId,
    };
  }

  /*
   * Another admin may have won the atomic claim between
   * our read and update.
   */
  ownership =
    await prismadb.videoProcessingJob.findUnique({
      where: {
        id: normalizedJobId,
      },

      select: {
        id: true,
        createdByUserId: true,
      },
    });

  return {
    exists: Boolean(ownership),

    owned:
      ownership?.createdByUserId ===
      normalizedUserId,

    claimed: false,

    ownerId:
      ownership?.createdByUserId ||
      null,
  };
}
