import prismadb from '@/libs/prismadb';

const ACTIVE_JOB_STATUSES = ['UPLOADING', 'QUEUED', 'PROCESSING', 'PUBLISHING'];

const normalizeJobId = (jobId) => {
  if (typeof jobId !== 'string' || !jobId.trim()) {
    throw new TypeError('jobId is required.');
  }

  return jobId.trim();
};

const normalizeProgress = (progress) => {
  if (!Number.isInteger(progress)) {
    throw new TypeError('progress must be an integer.');
  }

  if (progress < 0 || progress > 100) {
    throw new RangeError('progress must be between 0 and 100.');
  }

  return progress;
};

const getRequiredJob = async (jobId) => {
  const job = await prismadb.videoProcessingJob.findUnique({
    where: {
      id: jobId,
    },
  });

  if (!job) {
    throw new Error('Video processing job not found.');
  }

  return job;
};

export async function markVideoJobQueued({ jobId, sourcePath }) {
  const normalizedJobId = normalizeJobId(jobId);

  if (typeof sourcePath !== 'string' || !sourcePath.trim()) {
    throw new TypeError('sourcePath is required.');
  }

  const result = await prismadb.videoProcessingJob.updateMany({
    where: {
      id: normalizedJobId,
      status: 'UPLOADING',
    },
    data: {
      sourcePath: sourcePath.trim(),
      status: 'QUEUED',
      progress: 0,
      errorMessage: null,
      startedAt: null,
      completedAt: null,
    },
  });

  if (result.count !== 1) {
    const job = await getRequiredJob(normalizedJobId);

    throw new Error(`Cannot queue a video job with status ${job.status}.`);
  }

  return getRequiredJob(normalizedJobId);
}

export async function updateVideoJobProgress({ jobId, progress }) {
  const normalizedJobId = normalizeJobId(jobId);
  const normalizedProgress = normalizeProgress(progress);

  const result = await prismadb.videoProcessingJob.updateMany({
    where: {
      id: normalizedJobId,
      status: {
        in: ['PROCESSING', 'PUBLISHING'],
      },
    },
    data: {
      progress: normalizedProgress,
    },
  });

  if (result.count !== 1) {
    const job = await getRequiredJob(normalizedJobId);

    throw new Error(
      `Cannot update progress for a video job with status ${job.status}.`
    );
  }

  return getRequiredJob(normalizedJobId);
}

export async function markVideoJobPublishing(jobId) {
  const normalizedJobId = normalizeJobId(jobId);

  const result = await prismadb.videoProcessingJob.updateMany({
    where: {
      id: normalizedJobId,
      status: 'PROCESSING',
    },
    data: {
      status: 'PUBLISHING',
      progress: 90,
    },
  });

  if (result.count !== 1) {
    const job = await getRequiredJob(normalizedJobId);

    throw new Error(`Cannot publish a video job with status ${job.status}.`);
  }

  return getRequiredJob(normalizedJobId);
}

export async function markVideoJobReady({ jobId, outputKey }) {
  const normalizedJobId = normalizeJobId(jobId);

  if (typeof outputKey !== 'string' || !outputKey.trim()) {
    throw new TypeError('outputKey is required.');
  }

  const result = await prismadb.videoProcessingJob.updateMany({
    where: {
      id: normalizedJobId,
      status: 'PUBLISHING',
    },
    data: {
      outputKey: outputKey.trim(),
      status: 'READY',
      progress: 100,
      errorMessage: null,
      completedAt: new Date(),
    },
  });

  if (result.count !== 1) {
    const job = await getRequiredJob(normalizedJobId);

    throw new Error(`Cannot complete a video job with status ${job.status}.`);
  }

  return getRequiredJob(normalizedJobId);
}

export async function markVideoJobFailed({ jobId, error }) {
  const normalizedJobId = normalizeJobId(jobId);

  const errorMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'Unknown video processing error.';

  const result = await prismadb.videoProcessingJob.updateMany({
    where: {
      id: normalizedJobId,
      status: {
        in: ACTIVE_JOB_STATUSES,
      },
    },
    data: {
      status: 'FAILED',
      errorMessage: errorMessage.slice(0, 10000),
      completedAt: new Date(),
    },
  });

  if (result.count !== 1) {
    const job = await getRequiredJob(normalizedJobId);

    throw new Error(`Cannot fail a video job with status ${job.status}.`);
  }

  return getRequiredJob(normalizedJobId);
}

export async function retryVideoJob(jobId) {
  const normalizedJobId = normalizeJobId(jobId);

  return prismadb.$transaction(async (tx) => {
    const job = await tx.videoProcessingJob.findUnique({
      where: {
        id: normalizedJobId,
      },
    });

    if (!job) {
      throw new Error('Video processing job not found.');
    }

    if (job.status !== 'FAILED') {
      throw new Error(`Cannot retry a video job with status ${job.status}.`);
    }

    if (!job.sourcePath) {
      throw new Error('The source video file is not available.');
    }

    return tx.videoProcessingJob.update({
      where: {
        id: normalizedJobId,
      },
      data: {
        status: 'QUEUED',
        progress: 0,
        outputKey: null,
        errorMessage: null,
        startedAt: null,
        completedAt: null,
      },
    });
  });
}

export async function cancelVideoJob(jobId) {
  const normalizedJobId = normalizeJobId(jobId);

  const result = await prismadb.videoProcessingJob.updateMany({
    where: {
      id: normalizedJobId,
      status: {
        in: ACTIVE_JOB_STATUSES,
      },
    },
    data: {
      status: 'CANCELLED',
      completedAt: new Date(),
    },
  });

  if (result.count !== 1) {
    const job = await getRequiredJob(normalizedJobId);

    throw new Error(`Cannot cancel a video job with status ${job.status}.`);
  }

  return getRequiredJob(normalizedJobId);
}
