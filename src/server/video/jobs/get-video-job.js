import prismadb from '@/libs/prismadb';

export async function getVideoJob(jobId) {
  if (typeof jobId !== 'string' || !jobId.trim()) {
    throw new TypeError('jobId is required.');
  }

  return prismadb.videoProcessingJob.findUnique({
    where: {
      id: jobId.trim(),
    },
    include: {
      session: {
        select: {
          id: true,
          name: true,
          type: true,
          isActive: true,
          videoId: true,
        },
      },
    },
  });
}

export async function getLatestVideoJobBySessionId(sessionId) {
  if (typeof sessionId !== 'string' || !sessionId.trim()) {
    throw new TypeError('sessionId is required.');
  }

  return prismadb.videoProcessingJob.findFirst({
    where: {
      sessionId: sessionId.trim(),
    },
    orderBy: {
      createdAt: 'desc',
    },
    include: {
      session: {
        select: {
          id: true,
          name: true,
          type: true,
          isActive: true,
          videoId: true,
        },
      },
    },
  });
}
