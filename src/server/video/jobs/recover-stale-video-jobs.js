/* eslint-disable no-undef */

import path from 'node:path';

import { access, rm } from 'node:fs/promises';

import prismadb from '@/libs/prismadb';

import { getVideoJobMaxAttempts } from './update-video-job';

import { logError } from '@/server/logger';

import { getVideoJobLogger } from '@/server/video/video-logger';

const DEFAULT_STALE_AFTER_MS = 5 * 60 * 1000;

const DEFAULT_PROCESSING_ROOT = './storage/processing/jobs';

const RUNNING_STATUSES = ['PROCESSING', 'PUBLISHING'];

const getPositiveInteger = (value, fallback) => {
  const number = Number(value);

  if (Number.isSafeInteger(number) && number > 0) {
    return number;
  }

  return fallback;
};

const getStaleAfterMs = () =>
  getPositiveInteger(
    process.env.VIDEO_WORKER_STALE_AFTER_MS,

    DEFAULT_STALE_AFTER_MS
  );

const getProcessingRoot = () =>
  path.resolve(
    process.cwd(),

    process.env.VIDEO_PROCESSING_ROOT || DEFAULT_PROCESSING_ROOT
  );

const sourceFileExists = async (sourcePath) => {
  if (typeof sourcePath !== 'string' || !sourcePath.trim()) {
    return false;
  }

  const projectRoot = path.resolve(process.cwd());

  const absolutePath = path.resolve(projectRoot, sourcePath);

  const relativePath = path.relative(projectRoot, absolutePath);

  if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
    return false;
  }

  try {
    await access(absolutePath);
    return true;
  } catch {
    return false;
  }
};

const cleanProcessingDirectory = async (jobId) => {
  const directory = path.join(getProcessingRoot(), jobId);

  await rm(directory, {
    recursive: true,
    force: true,
  });
};

export async function recoverStaleVideoJobs() {
  const staleAfterMs = getStaleAfterMs();

  const maxAttempts = getVideoJobMaxAttempts();

  const staleBefore = new Date(Date.now() - staleAfterMs);

  const staleJobs = await prismadb.videoProcessingJob.findMany({
    where: {
      status: {
        in: RUNNING_STATUSES,
      },

      updatedAt: {
        lt: staleBefore,
      },
    },

    orderBy: {
      updatedAt: 'asc',
    },

    select: {
      id: true,
      status: true,
      sourcePath: true,
      attempts: true,
      updatedAt: true,
    },
  });

  const summary = {
    scanned: staleJobs.length,

    requeued: 0,
    failed: 0,
    skipped: 0,
  };

  for (const job of staleJobs) {
    const sourceExists = await sourceFileExists(job.sourcePath);

    const canRetry = sourceExists && job.attempts < maxAttempts;

    const result = await prismadb.videoProcessingJob.updateMany({
      where: {
        id: job.id,

        status: {
          in: RUNNING_STATUSES,
        },

        updatedAt: {
          lt: staleBefore,
        },
      },

      data: canRetry
        ? {
            status: 'QUEUED',
            progress: 0,
            outputKey: null,

            errorMessage: `Recovered stale video job from ${job.status}.`,

            startedAt: null,
            completedAt: null,
            updatedAt: new Date(),
          }
        : {
            status: 'FAILED',
            outputKey: null,

            errorMessage: sourceExists
              ? `Video job exceeded the maximum attempt count after becoming stale in ${job.status}.`
              : `Video job became stale in ${job.status} and its source file is missing.`,

            completedAt: new Date(),

            updatedAt: new Date(),
          },
    });

    if (result.count !== 1) {
      summary.skipped += 1;
      continue;
    }

    await cleanProcessingDirectory(job.id).catch((error) => {
      logError({
        log: getVideoJobLogger(job.id, {
          previousStatus: job.status,
        }),

        error,

        message: 'Failed to clean stale video processing directory',

        data: {
          event: 'video_job_stale_cleanup_failed',
        },
      });
    });

    if (canRetry) {
      summary.requeued += 1;
    } else {
      summary.failed += 1;
    }
  }

  return {
    ...summary,
    staleAfterMs,
    maxAttempts,
  };
}
