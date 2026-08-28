import prismadb from '@/libs/prismadb';

import {
  ActiveVideoJobConflictError,
} from './active-video-job-conflict-error';

import {
  lockVideoJobTarget,
} from './lock-video-job-target';

const ALLOWED_ACCESS_LEVELS = ['PUBLIC', 'REGISTERED', 'PURCHASED'];

const ACTIVE_JOB_STATUSES = [
  'UPLOADING',
  'QUEUED',
  'PROCESSING',
  'PUBLISHING',
];

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

export async function createVideoJob({
  sessionId,
  termId,
  accessLevel,
  createdByUserId,
}) {
  const normalizedSessionId = normalizeRequiredString(sessionId, 'sessionId');

  const normalizedTermId = normalizeTermId(termId);

  const normalizedAccessLevel = normalizeAccessLevel(accessLevel);

  const normalizedCreatedByUserId =
    normalizeRequiredString(
      createdByUserId,
      'createdByUserId'
    );

  return prismadb.$transaction(async (tx) => {
    await lockVideoJobTarget({
      tx,

      key:
        `session:${normalizedSessionId}:term:${normalizedTermId}`,
    });

    /*
     * این check بعد از advisory lock انجام می‌شود.
     * بنابراین دو create هم‌زمان نمی‌توانند هر دو
     * از مرحله‌ی duplicate check عبور کنند.
     */
    const activeJob =
      await tx.videoProcessingJob.findFirst({
        where: {
          sessionId:
            normalizedSessionId,

          termId:
            normalizedTermId,

          status: {
            in: ACTIVE_JOB_STATUSES,
          },
        },

        orderBy: {
          createdAt: 'desc',
        },
      });

    if (activeJob) {
      throw new ActiveVideoJobConflictError(
        activeJob
      );
    }

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
        createdByUserId:
          normalizedCreatedByUserId,

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
