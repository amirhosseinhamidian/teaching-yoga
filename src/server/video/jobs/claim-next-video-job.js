import prismadb from '@/libs/prismadb';

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

export async function claimNextVideoJob() {
  for (let attempt = 0; attempt < MAX_CLAIM_ATTEMPTS; attempt += 1) {
    const queuedJob = await prismadb.videoProcessingJob.findFirst({
      where: {
        status: 'QUEUED',
        sourcePath: {
          not: null,
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

    const claimResult = await prismadb.videoProcessingJob.updateMany({
      where: {
        id: queuedJob.id,
        status: 'QUEUED',
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
