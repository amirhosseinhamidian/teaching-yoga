import prismadb from '@/libs/prismadb';

import { getVideoJobMaxAttempts } from './update-video-job';

const MAX_CLAIM_ATTEMPTS = 5;

const JOB_SELECT = {
  id: true,
  targetType: true,

  sessionId: true,
  termId: true,

  courseId: true,
  courseTitle: true,

  accessLevel: true,

  sourcePath: true,
  outputKey: true,

  status: true,
  uploadProgress: true,
  progress: true,

  errorMessage: true,
  attempts: true,

  startedAt: true,
  completedAt: true,
  createdAt: true,
  updatedAt: true,
};

const failInvalidQueuedJobs = async (maxAttempts) => {
  await prismadb.videoProcessingJob.updateMany({
    where: {
      status: 'QUEUED',

      OR: [
        {
          sourcePath: null,
        },
        {
          attempts: {
            gte: maxAttempts,
          },
        },
      ],
    },

    data: {
      status: 'FAILED',

      errorMessage:
        'The queued video job cannot be processed because its source is missing or its retry limit has been reached.',

      completedAt: new Date(),
    },
  });
};

export async function claimNextVideoJob() {
  const maxAttempts = getVideoJobMaxAttempts();

  await failInvalidQueuedJobs(maxAttempts);

  for (
    let claimAttempt = 0;
    claimAttempt < MAX_CLAIM_ATTEMPTS;
    claimAttempt += 1
  ) {
    const queuedJob = await prismadb.videoProcessingJob.findFirst({
      where: {
        status: 'QUEUED',

        sourcePath: {
          not: null,
        },

        attempts: {
          lt: maxAttempts,
        },
      },

      orderBy: [
        {
          createdAt: 'asc',
        },
        {
          id: 'asc',
        },
      ],

      select: {
        id: true,
      },
    });

    if (!queuedJob) {
      return null;
    }

    const startedAt = new Date();

    /*
     * Compare And Swap:
     * فقط Workerی که هنوز Job را در وضعیت QUEUED ببیند
     * می‌تواند آن را Claim کند.
     */
    const claimResult = await prismadb.videoProcessingJob.updateMany({
      where: {
        id: queuedJob.id,
        status: 'QUEUED',

        attempts: {
          lt: maxAttempts,
        },
      },

      data: {
        status: 'PROCESSING',
        progress: 1,

        attempts: {
          increment: 1,
        },

        startedAt,
        completedAt: null,
        errorMessage: null,
      },
    });

    if (claimResult.count === 0) {
      continue;
    }

    const claimedJob = await prismadb.videoProcessingJob.findUnique({
      where: {
        id: queuedJob.id,
      },

      select: JOB_SELECT,
    });

    if (!claimedJob) {
      throw new Error(`Claimed video job was not found: ${queuedJob.id}`);
    }

    if (claimedJob.status !== 'PROCESSING') {
      throw new Error(
        `Claimed video job has an invalid status: ${claimedJob.status}`
      );
    }

    return claimedJob;
  }

  return null;
}
