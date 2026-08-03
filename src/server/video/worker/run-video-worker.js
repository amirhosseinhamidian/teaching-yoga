/* eslint-disable no-undef */

import { logError } from '@/server/logger';

import { videoWorkerLogger } from '@/server/video/video-logger';

import { processNextVideoJob } from '@/server/video/process-next-video-job';

import {
  getVideoJobMaxAttempts,
  recoverStaleVideoJobs,
} from '@/server/video/jobs';

const DEFAULT_POLL_INTERVAL_MS = 5000;

const DEFAULT_ERROR_DELAY_MS = 10000;

const DEFAULT_STALE_SCAN_INTERVAL_MS = 60000;

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

  videoWorkerLogger.info(
    {
      event: 'video_worker_loop_started',

      pollIntervalMs: pollInterval,

      errorDelayMs: errorDelay,

      staleScanIntervalMs: staleScanInterval,

      maxAttempts: getVideoJobMaxAttempts(),
    },

    'Video worker loop started'
  );

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

  let nextStaleScanAt = Date.now() + staleScanInterval;

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

    try {
      const result = await processNextVideoJob();

      if (result.processed) {
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

  videoWorkerLogger.info(
    {
      event: 'video_worker_loop_stopped',

      aborted: Boolean(signal?.aborted),
    },

    'Video worker loop stopped'
  );
}
