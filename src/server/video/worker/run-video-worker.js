/* eslint-disable no-undef */
import { processNextVideoJob } from '@/server/video/process-next-video-job';

const DEFAULT_POLL_INTERVAL_MS = 5000;
const DEFAULT_ERROR_DELAY_MS = 10000;

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

export async function runVideoWorker({ signal } = {}) {
  const pollInterval = getPositiveInteger(
    process.env.VIDEO_WORKER_POLL_INTERVAL_MS,
    DEFAULT_POLL_INTERVAL_MS
  );

  const errorDelay = getPositiveInteger(
    process.env.VIDEO_WORKER_ERROR_DELAY_MS,
    DEFAULT_ERROR_DELAY_MS
  );

  console.log('[video-worker] Worker started.');
  console.log(`[video-worker] Poll interval: ${pollInterval}ms`);

  while (!signal?.aborted) {
    try {
      const result = await processNextVideoJob();

      if (result.processed) {
        console.log(`[video-worker] Job completed: ${result.job.id}`);

        console.log(`[video-worker] Output: ${result.job.outputKey}`);

        // اگر Job دیگری در صف باشد، بدون تأخیر سراغ آن می‌رویم.
        continue;
      }

      await sleep(pollInterval, signal);
    } catch (error) {
      console.error(
        '[video-worker] Job processing failed:',
        error instanceof Error ? error.stack || error.message : error
      );

      // processNextVideoJob خودش Job شکست‌خورده را FAILED می‌کند.
      // این تأخیر جلوی Loop سریع و مصرف بیهوده CPU را می‌گیرد.
      await sleep(errorDelay, signal);
    }
  }

  console.log('[video-worker] Worker loop stopped.');
}
