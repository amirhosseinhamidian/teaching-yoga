/* eslint-disable no-undef */

import path from 'node:path';

import {
  readdir,
  rm,
  stat,
} from 'node:fs/promises';

import prismadb from '@/libs/prismadb';

import { logError } from '@/server/logger';

import {
  getVideoJobLogger,
  videoWorkerLogger,
} from '@/server/video/video-logger';

const DEFAULT_UPLOAD_ROOT =
  './storage/uploads/jobs';

const DEFAULT_PROCESSING_ROOT =
  './storage/processing/jobs';

const DEFAULT_UPLOAD_STALE_AFTER_MS =
  24 * 60 * 60 * 1000;

const DEFAULT_TERMINAL_RETENTION_MS =
  24 * 60 * 60 * 1000;

const DEFAULT_ORPHAN_RETENTION_MS =
  24 * 60 * 60 * 1000;

const DEFAULT_CLEANUP_BATCH_SIZE = 50;

const TERMINAL_STATUSES = new Set([
  'READY',
  'FAILED',
  'CANCELLED',
]);

const getPositiveInteger = (value, fallback) => {
  const number = Number(value);

  if (
    Number.isSafeInteger(number) &&
    number > 0
  ) {
    return number;
  }

  return fallback;
};

const getUploadRoot = () =>
  path.resolve(
    process.cwd(),
    process.env.VIDEO_UPLOAD_ROOT ||
      DEFAULT_UPLOAD_ROOT
  );

const getProcessingRoot = () =>
  path.resolve(
    process.cwd(),
    process.env.VIDEO_PROCESSING_ROOT ||
      DEFAULT_PROCESSING_ROOT
  );

const getUploadStaleAfterMs = () =>
  getPositiveInteger(
    process.env.VIDEO_UPLOAD_STALE_AFTER_MS,
    DEFAULT_UPLOAD_STALE_AFTER_MS
  );

const getTerminalRetentionMs = () =>
  getPositiveInteger(
    process.env.VIDEO_TERMINAL_FILE_RETENTION_MS,
    DEFAULT_TERMINAL_RETENTION_MS
  );

const getOrphanRetentionMs = () =>
  getPositiveInteger(
    process.env.VIDEO_ORPHAN_FILE_RETENTION_MS,
    DEFAULT_ORPHAN_RETENTION_MS
  );

const getCleanupBatchSize = () =>
  getPositiveInteger(
    process.env.VIDEO_FILE_CLEANUP_BATCH_SIZE,
    DEFAULT_CLEANUP_BATCH_SIZE
  );

const isSafeJobDirectoryName = (value) =>
  typeof value === 'string' &&
  /^[a-zA-Z0-9_-]+$/.test(value);

const listJobDirectories = async (root) => {
  const entries = await readdir(root, {
    withFileTypes: true,
  }).catch((error) => {
    if (error?.code === 'ENOENT') {
      return [];
    }

    throw error;
  });

  const directories = [];

  for (const entry of entries) {
    if (
      !entry.isDirectory() ||
      !isSafeJobDirectoryName(entry.name)
    ) {
      continue;
    }

    const directory = path.join(
      root,
      entry.name
    );

    const directoryStat = await stat(
      directory
    ).catch(() => null);

    directories.push({
      jobId: entry.name,
      directory,

      modifiedAt:
        directoryStat?.mtime instanceof Date
          ? directoryStat.mtime
          : new Date(0),
    });
  }

  return directories;
};

const getDirectoryInventory = async () => {
  const [
    uploadDirectories,
    processingDirectories,
  ] = await Promise.all([
    listJobDirectories(getUploadRoot()),
    listJobDirectories(getProcessingRoot()),
  ]);

  const byJobId = new Map();

  const register = (item, type) => {
    const previous =
      byJobId.get(item.jobId) || {
        jobId: item.jobId,
        uploadDirectory: null,
        processingDirectory: null,
        latestModifiedAt: new Date(0),
      };

    if (type === 'upload') {
      previous.uploadDirectory =
        item.directory;
    } else {
      previous.processingDirectory =
        item.directory;
    }

    if (
      item.modifiedAt >
      previous.latestModifiedAt
    ) {
      previous.latestModifiedAt =
        item.modifiedAt;
    }

    byJobId.set(
      item.jobId,
      previous
    );
  };

  uploadDirectories.forEach((item) =>
    register(item, 'upload')
  );

  processingDirectories.forEach((item) =>
    register(item, 'processing')
  );

  return [...byJobId.values()];
};

const removeDirectory = async (
  directory
) => {
  if (!directory) {
    return {
      removed: true,
      error: null,
    };
  }

  try {
    await rm(directory, {
      recursive: true,
      force: true,
    });

    return {
      removed: true,
      error: null,
    };
  } catch (error) {
    return {
      removed: false,
      error,
    };
  }
};

const removeJobDirectories = async ({
  jobId,
  uploadDirectory,
  processingDirectory,
}) => {
  const [
    uploadResult,
    processingResult,
  ] = await Promise.all([
    removeDirectory(uploadDirectory),
    removeDirectory(processingDirectory),
  ]);

  const log = getVideoJobLogger(jobId);

  if (uploadResult.error) {
    logError({
      log,
      error: uploadResult.error,

      message:
        'Failed to clean retained video upload directory',

      data: {
        event:
          'video_job_retained_upload_cleanup_failed',
      },
    });
  }

  if (processingResult.error) {
    logError({
      log,
      error: processingResult.error,

      message:
        'Failed to clean retained video processing directory',

      data: {
        event:
          'video_job_retained_processing_cleanup_failed',
      },
    });
  }

  return {
    uploadRemoved:
      uploadResult.removed,

    processingRemoved:
      processingResult.removed,

    failures:
      Number(Boolean(uploadResult.error)) +
      Number(Boolean(processingResult.error)),
  };
};

const expireAbandonedUpload = async (
  job,
  inventoryItem,
  staleBefore
) => {
  const result =
    await prismadb.videoProcessingJob.updateMany({
      where: {
        id: job.id,
        status: 'UPLOADING',
        updatedAt: {
          lt: staleBefore,
        },
      },

      data: {
        status: 'FAILED',

        errorMessage:
          'آپلود به‌دلیل عدم ادامه در بازه مجاز منقضی شد.',

        sourcePath: null,
        completedAt: new Date(),
      },
    });

  if (result.count !== 1) {
    return {
      expired: false,
      cleanupFailures: 0,
    };
  }

  const cleanup =
    await removeJobDirectories({
      jobId: job.id,

      uploadDirectory:
        inventoryItem.uploadDirectory,

      processingDirectory:
        inventoryItem.processingDirectory,
    });

  return {
    expired: true,
    cleanupFailures:
      cleanup.failures,
  };
};

const cleanTerminalJob = async (
  job,
  inventoryItem
) => {
  const cleanup =
    await removeJobDirectories({
      jobId: job.id,

      uploadDirectory:
        inventoryItem.uploadDirectory,

      processingDirectory:
        inventoryItem.processingDirectory,
    });

  if (
    cleanup.uploadRemoved &&
    cleanup.processingRemoved &&
    job.sourcePath
  ) {
    await prismadb.videoProcessingJob.updateMany({
      where: {
        id: job.id,
        status: job.status,
      },

      data: {
        sourcePath: null,
      },
    }).catch((error) => {
      logError({
        log: getVideoJobLogger(job),

        error,

        message:
          'Failed to clear retained video sourcePath after cleanup',

        data: {
          event:
            'video_job_source_path_cleanup_failed',
        },
      });
    });
  }

  return cleanup;
};

export async function cleanupVideoJobFiles() {
  const now = Date.now();

  const uploadStaleAfterMs =
    getUploadStaleAfterMs();

  const terminalRetentionMs =
    getTerminalRetentionMs();

  const orphanRetentionMs =
    getOrphanRetentionMs();

  const batchSize =
    getCleanupBatchSize();

  const inventory =
    await getDirectoryInventory();

  if (inventory.length === 0) {
    return {
      scanned: 0,
      expiredUploads: 0,
      terminalCleanups: 0,
      orphanCleanups: 0,
      skipped: 0,
      cleanupFailures: 0,

      uploadStaleAfterMs,
      terminalRetentionMs,
      orphanRetentionMs,
    };
  }

  const candidates = inventory
    .sort(
      (a, b) =>
        a.latestModifiedAt -
        b.latestModifiedAt
    )
    .slice(0, batchSize);

  const jobIds = candidates.map(
    (item) => item.jobId
  );

  const jobs =
    await prismadb.videoProcessingJob.findMany({
      where: {
        id: {
          in: jobIds,
        },
      },

      select: {
        id: true,
        status: true,
        sourcePath: true,
        updatedAt: true,
        completedAt: true,
      },
    });

  const jobsById = new Map(
    jobs.map((job) => [
      job.id,
      job,
    ])
  );

  const summary = {
    scanned: candidates.length,
    expiredUploads: 0,
    terminalCleanups: 0,
    orphanCleanups: 0,
    skipped: 0,
    cleanupFailures: 0,

    uploadStaleAfterMs,
    terminalRetentionMs,
    orphanRetentionMs,
  };

  const uploadStaleBefore =
    new Date(
      now - uploadStaleAfterMs
    );

  const terminalBefore =
    new Date(
      now - terminalRetentionMs
    );

  const orphanBefore =
    new Date(
      now - orphanRetentionMs
    );

  for (const item of candidates) {
    const job =
      jobsById.get(item.jobId);

    if (!job) {
      if (
        item.latestModifiedAt >=
        orphanBefore
      ) {
        summary.skipped += 1;
        continue;
      }

      const cleanup =
        await removeJobDirectories({
          jobId: item.jobId,

          uploadDirectory:
            item.uploadDirectory,

          processingDirectory:
            item.processingDirectory,
        });

      summary.orphanCleanups += 1;
      summary.cleanupFailures +=
        cleanup.failures;

      continue;
    }

    if (job.status === 'UPLOADING') {
      if (
        job.updatedAt >=
        uploadStaleBefore
      ) {
        summary.skipped += 1;
        continue;
      }

      const result =
        await expireAbandonedUpload(
          job,
          item,
          uploadStaleBefore
        );

      if (result.expired) {
        summary.expiredUploads += 1;
      } else {
        summary.skipped += 1;
      }

      summary.cleanupFailures +=
        result.cleanupFailures;

      continue;
    }

    if (
      TERMINAL_STATUSES.has(
        job.status
      )
    ) {
      const terminalDate =
        job.completedAt ||
        job.updatedAt;

      if (
        terminalDate >=
        terminalBefore
      ) {
        summary.skipped += 1;
        continue;
      }

      const cleanup =
        await cleanTerminalJob(
          job,
          item
        );

      summary.terminalCleanups += 1;
      summary.cleanupFailures +=
        cleanup.failures;

      continue;
    }

    /*
     * QUEUED / PROCESSING / PUBLISHING:
     * فایل‌های این Job هنوز فعال هستند.
     */
    summary.skipped += 1;
  }

  if (
    summary.expiredUploads > 0 ||
    summary.terminalCleanups > 0 ||
    summary.orphanCleanups > 0 ||
    summary.cleanupFailures > 0
  ) {
    const logMethod =
      summary.cleanupFailures > 0
        ? 'warn'
        : 'info';

    videoWorkerLogger[logMethod](
      {
        event:
          'video_job_file_cleanup_completed',

        ...summary,
      },

      'Video job file cleanup completed'
    );
  }

  return summary;
}
