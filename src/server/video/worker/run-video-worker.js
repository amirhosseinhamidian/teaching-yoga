/* eslint-disable no-undef */

import { logError } from '@/server/logger';

import { videoWorkerLogger } from '@/server/video/video-logger';

import { processNextVideoJob } from '@/server/video/process-next-video-job';

import {
  cleanupVideoJobFiles,
  getVideoJobMaxAttempts,
  recoverStaleVideoJobs,
} from '@/server/video/jobs';

import {
  createVideoWorkerHeartbeat,
  getVideoWorkerHeartbeatIntervalMs,
} from '@/server/video/worker/video-worker-heartbeat';

const DEFAULT_POLL_INTERVAL_MS = 5000;

const DEFAULT_ERROR_DELAY_MS = 10000;

const DEFAULT_STALE_SCAN_INTERVAL_MS = 60000;

const DEFAULT_FILE_CLEANUP_SCAN_INTERVAL_MS =
  10 * 60 * 1000;

const getPositiveInteger = (value, fallback) => {
  const number = Number(value);

  if (Number.isSafeInteger(number) && number > 0) {
    return number;
  }

  return fallback;
};

const sleep = (milliseconds, signal) =>
  new Promise((resolve) => {
    if (signal?.aborted) {
      resolve();
      return;
    }

    let timeout;

    const finish = () => {
      clearTimeout(timeout);

      signal?.removeEventListener('abort', finish);

      resolve();
    };

    timeout = setTimeout(finish, milliseconds);

    signal?.addEventListener('abort', finish, {
      once: true,
    });
  });

const logRecoveryResult = (result, trigger) => {
  if (!result.scanned) {
    return;
  }

  const logMethod = result.failed > 0 ? 'warn' : 'info';

  videoWorkerLogger[logMethod](
    {
      event: 'video_worker_stale_recovery_completed',

      trigger,

      scanned: result.scanned,

      requeued: result.requeued,

      failed: result.failed,

      skipped: result.skipped,

      staleAfterMs: result.staleAfterMs,

      maxAttempts: result.maxAttempts,
    },

    'Stale video job recovery completed'
  );
};

const runFileCleanup = async (trigger) => {
  try {
    const result =
      await cleanupVideoJobFiles();

    if (!result.scanned) {
      return;
    }

    videoWorkerLogger.debug(
      {
        event:
          'video_worker_file_cleanup_scan_completed',

        trigger,

        scanned: result.scanned,

        expiredUploads:
          result.expiredUploads,

        terminalCleanups:
          result.terminalCleanups,

        orphanCleanups:
          result.orphanCleanups,

        skipped: result.skipped,

        cleanupFailures:
          result.cleanupFailures,
      },

      'Video worker file cleanup scan completed'
    );
  } catch (error) {
    logError({
      log: videoWorkerLogger,

      error,

      message:
        'Video worker file cleanup scan failed',

      data: {
        event:
          'video_worker_file_cleanup_scan_failed',

        trigger,
      },
    });
  }
};

export async function runVideoWorker({ signal } = {}) {
  const pollInterval = getPositiveInteger(
    process.env.VIDEO_WORKER_POLL_INTERVAL_MS,

    DEFAULT_POLL_INTERVAL_MS
  );

  const errorDelay = getPositiveInteger(
    process.env.VIDEO_WORKER_ERROR_DELAY_MS,

    DEFAULT_ERROR_DELAY_MS
  );

  const staleScanInterval = getPositiveInteger(
    process.env.VIDEO_WORKER_STALE_SCAN_INTERVAL_MS,

    DEFAULT_STALE_SCAN_INTERVAL_MS
  );

  const fileCleanupScanInterval =
    getPositiveInteger(
      process.env
        .VIDEO_WORKER_FILE_CLEANUP_SCAN_INTERVAL_MS,

      DEFAULT_FILE_CLEANUP_SCAN_INTERVAL_MS
    );

  const heartbeatInterval =
    getVideoWorkerHeartbeatIntervalMs();

  videoWorkerLogger.info(
    {
      event: 'video_worker_loop_started',

      pollIntervalMs: pollInterval,

      errorDelayMs: errorDelay,

      staleScanIntervalMs: staleScanInterval,

      fileCleanupScanIntervalMs:
        fileCleanupScanInterval,

      heartbeatIntervalMs:
        heartbeatInterval,

      maxAttempts: getVideoJobMaxAttempts(),
    },

    'Video worker loop started'
  );

  const heartbeat =
    createVideoWorkerHeartbeat({
      intervalMs:
        heartbeatInterval,

      onError: (error) => {
        logError({
          log: videoWorkerLogger,
          error,

          message:
            'Video worker heartbeat write failed',

          data: {
            event:
              'video_worker_heartbeat_write_failed',
          },
        });
      },
    });

  await heartbeat.start();

  try {
    const recoveryResult = await recoverStaleVideoJobs();

    logRecoveryResult(recoveryResult, 'startup');
  } catch (error) {
    logError({
      log: videoWorkerLogger,

      error,

      message: 'Startup stale recovery failed',

      data: {
        event: 'video_worker_startup_recovery_failed',
      },
    });
  }

  await runFileCleanup('startup');

  let nextStaleScanAt = Date.now() + staleScanInterval;

  let nextFileCleanupAt =
    Date.now() + fileCleanupScanInterval;

  while (!signal?.aborted) {
    if (Date.now() >= nextStaleScanAt) {
      try {
        const recoveryResult = await recoverStaleVideoJobs();

        logRecoveryResult(recoveryResult, 'periodic');
      } catch (error) {
        logError({
          log: videoWorkerLogger,

          error,

          message: 'Periodic stale recovery failed',

          data: {
            event: 'video_worker_periodic_recovery_failed',
          },
        });
      }

      nextStaleScanAt = Date.now() + staleScanInterval;
    }

    if (Date.now() >= nextFileCleanupAt) {
      await runFileCleanup('periodic');

      nextFileCleanupAt =
        Date.now() + fileCleanupScanInterval;
    }

    try {
      const result = await processNextVideoJob();

      if (result.processed) {
        void heartbeat.markJobCompleted(
          result.job
        );

        videoWorkerLogger.info(
          {
            event: 'video_worker_job_cycle_completed',

            jobId: result.job.id,

            targetType: result.job.targetType,

            outputKey: result.job.outputKey,

            status: result.job.status,
          },

          'Video job completed'
        );

        /*
         * بدون تأخیر سراغ Job بعدی می‌رویم.
         */
        continue;
      }

      await sleep(pollInterval, signal);
    } catch (error) {
      logError({
        log: videoWorkerLogger,

        error,

        message: 'Video worker processing cycle failed',

        data: {
          event: 'video_worker_job_cycle_failed',

          retryDelayMs: errorDelay,
        },
      });

      await sleep(errorDelay, signal);
    }
  }

  await heartbeat.stop();

  videoWorkerLogger.info(
    {
      event: 'video_worker_loop_stopped',

      aborted: Boolean(signal?.aborted),
    },

    'Video worker loop stopped'
  );
}
