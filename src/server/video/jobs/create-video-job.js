import prismadb from '@/libs/prismadb';

const ALLOWED_ACCESS_LEVELS = ['PUBLIC', 'REGISTERED', 'PURCHASED'];

const normalizeRequiredString = (value, fieldName) => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${fieldName} is required.`);
  }

  return value.trim();
};

const normalizeTermId = (value) => {
  const termId = Number(value);

  if (!Number.isInteger(termId) || termId <= 0) {
    throw new Error('termId must be a positive integer.');
  }

  return termId;
};

const normalizeAccessLevel = (value) => {
  const accessLevel =
    typeof value === 'string' ? value.trim().toUpperCase() : '';

  if (!ALLOWED_ACCESS_LEVELS.includes(accessLevel)) {
    throw new Error('accessLevel must be PUBLIC, REGISTERED or PURCHASED.');
  }

  return accessLevel;
};

export async function createVideoJob({ sessionId, termId, accessLevel }) {
  const normalizedSessionId = normalizeRequiredString(sessionId, 'sessionId');

  const normalizedTermId = normalizeTermId(termId);

  const normalizedAccessLevel = normalizeAccessLevel(accessLevel);

  return prismadb.$transaction(async (tx) => {
    /*
     * Session ممکن است:
     * 1. مستقیماً termId داشته باشد
     * 2. از طریق SessionTerm به ترم متصل شده باشد
     */
    const session = await tx.session.findFirst({
      where: {
        id: normalizedSessionId,

        OR: [
          {
            termId: normalizedTermId,
          },
          {
            sessionTerms: {
              some: {
                termId: normalizedTermId,
              },
            },
          },
        ],
      },

      select: {
        id: true,
      },
    });

    if (!session) {
      throw new Error('Session was not found in the selected term.');
    }

    return tx.videoProcessingJob.create({
      data: {
        sessionId: session.id,
        termId: normalizedTermId,
        accessLevel: normalizedAccessLevel,

        status: 'UPLOADING',
        uploadProgress: 0,
        progress: 0,
      },
    });
  });
}
