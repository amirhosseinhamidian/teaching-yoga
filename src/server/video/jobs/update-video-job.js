/* eslint-disable no-undef */

import prismadb from '@/libs/prismadb';

const ACTIVE_JOB_STATUSES = ['UPLOADING', 'QUEUED', 'PROCESSING', 'PUBLISHING'];

const RUNNING_JOB_STATUSES = ['PROCESSING', 'PUBLISHING'];

const DEFAULT_MAX_VIDEO_JOB_ATTEMPTS = 3;

const getPositiveInteger = (value, fallback) => {
  const number = Number(value);

  if (Number.isSafeInteger(number) && number > 0) {
    return number;
  }

  return fallback;
};

export const getVideoJobMaxAttempts = () => {
  return getPositiveInteger(
    process.env.VIDEO_WORKER_MAX_ATTEMPTS,

    DEFAULT_MAX_VIDEO_JOB_ATTEMPTS
  );
};

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

const normalizeErrorMessage = (error) => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'Unknown video processing error.';

  return message.trim().slice(0, 10000);
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
      attempts: 0,
      outputKey: null,
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
        in: RUNNING_JOB_STATUSES,
      },
    },

    data: {
      progress: normalizedProgress,

      /*
       * مقدار updatedAt صریحاً تغییر می‌کند
       * تا همین Update نقش Heartbeat هم داشته باشد.
       */
      updatedAt: new Date(),
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

/*
 * برای زمان‌هایی که FFmpeg برای مدتی Progress جدید نمی‌دهد.
 * این تابع خطا نمی‌دهد و فقط موفق یا ناموفق بودن Touch را
 * برمی‌گرداند.
 */
export async function heartbeatVideoJob(jobId) {
  const normalizedJobId = normalizeJobId(jobId);

  const result = await prismadb.videoProcessingJob.updateMany({
    where: {
      id: normalizedJobId,

      status: {
        in: RUNNING_JOB_STATUSES,
      },
    },

    data: {
      updatedAt: new Date(),
    },
  });

  return result.count === 1;
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
      updatedAt: new Date(),
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

  const errorMessage = normalizeErrorMessage(error);

  const result = await prismadb.videoProcessingJob.updateMany({
    where: {
      id: normalizedJobId,

      status: {
        in: ACTIVE_JOB_STATUSES,
      },
    },

    data: {
      status: 'FAILED',
      outputKey: null,
      errorMessage,
      completedAt: new Date(),
    },
  });

  if (result.count !== 1) {
    const job = await getRequiredJob(normalizedJobId);

    throw new Error(`Cannot fail a video job with status ${job.status}.`);
  }

  return getRequiredJob(normalizedJobId);
}

/*
 * خطای پردازش را بررسی می‌کند:
 *
 * attempts < maxAttempts
 *   => Job دوباره QUEUED می‌شود.
 *
 * attempts >= maxAttempts
 *   => Job برای همیشه FAILED می‌شود.
 */
export async function handleVideoJobFailure({ jobId, error }) {
  const normalizedJobId = normalizeJobId(jobId);

  const job = await getRequiredJob(normalizedJobId);

  const maxAttempts = getVideoJobMaxAttempts();

  const errorMessage = normalizeErrorMessage(error);

  /*
   * ممکن است Job پیش از رسیدن Catch به وضعیت دیگری
   * منتقل شده باشد؛ مثلاً READY شده باشد.
   */
  if (!RUNNING_JOB_STATUSES.includes(job.status)) {
    return {
      job,
      requeued: false,
      terminal: false,
      ignored: true,
      maxAttempts,
    };
  }

  const canRetry = Boolean(job.sourcePath) && job.attempts < maxAttempts;

  const result = await prismadb.videoProcessingJob.updateMany({
    where: {
      id: normalizedJobId,

      status: {
        in: RUNNING_JOB_STATUSES,
      },
    },

    data: canRetry
      ? {
          status: 'QUEUED',
          progress: 0,
          outputKey: null,

          errorMessage:
            `Attempt ${job.attempts}/${maxAttempts} failed: ${errorMessage}`.slice(
              0,
              10000
            ),

          startedAt: null,
          completedAt: null,
          updatedAt: new Date(),
        }
      : {
          status: 'FAILED',
          outputKey: null,

          errorMessage:
            `Video processing failed after ${job.attempts}/${maxAttempts} attempts: ${errorMessage}`.slice(
              0,
              10000
            ),

          completedAt: new Date(),

          updatedAt: new Date(),
        },
  });

  if (result.count !== 1) {
    const currentJob = await getRequiredJob(normalizedJobId);

    return {
      job: currentJob,
      requeued: false,
      terminal: false,
      ignored: true,
      maxAttempts,
    };
  }

  const updatedJob = await getRequiredJob(normalizedJobId);

  return {
    job: updatedJob,
    requeued: canRetry,
    terminal: !canRetry,
    ignored: false,
    maxAttempts,
  };
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

        /*
         * Retry دستی بودجه تلاش را از ابتدا آغاز می‌کند.
         */
        attempts: 0,

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
