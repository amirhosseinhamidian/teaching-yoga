/* eslint-disable no-undef */

import path from 'node:path';

import { access, mkdir, rm } from 'node:fs/promises';

import { getVideoStorage } from '@/server/storage';
import { logError } from '@/server/logger';

import { getVideoJobLogger } from '@/server/video/video-logger';

import {
  claimNextVideoJob,
  handleVideoJobFailure,
  heartbeatVideoJob,
  markVideoJobFailed,
  markVideoJobPublishing,
  updateVideoJobProgress,
} from '@/server/video/jobs';

import { publishVideoJob } from '@/server/video/publish-video-job';

import {
  cleanupPreviousPublishedVideo,
} from '@/server/video/cleanup-previous-published-video';

import { probeVideo } from '@/server/video/ffmpeg/probe-video';

import {
  estimateHlsOutputBytes,
  generateHls,
} from '@/server/video/ffmpeg/generate-hls';

import {
  ensureVideoDiskSpace,
  VideoDiskSpaceError,
} from '@/server/video/disk-space';

const DEFAULT_PROCESSING_ROOT = './storage/processing/jobs';

const DEFAULT_HEARTBEAT_INTERVAL_MS = 15000;

const DEFAULT_PROCESSING_OUTPUT_COPIES = 2;

const getPositiveInteger = (value, fallback) => {
  const number = Number(value);

  if (Number.isSafeInteger(number) && number > 0) {
    return number;
  }

  return fallback;
};

const getProcessingOutputCopies = () => {
  const value = Number(
    process.env.VIDEO_PROCESSING_DISK_OUTPUT_COPIES
  );

  if (
    Number.isFinite(value) &&
    value >= 1 &&
    value <= 4
  ) {
    return value;
  }

  return DEFAULT_PROCESSING_OUTPUT_COPIES;
};

const getProcessingRoot = () =>
  path.resolve(
    process.cwd(),

    process.env.VIDEO_PROCESSING_ROOT || DEFAULT_PROCESSING_ROOT
  );

const getHeartbeatIntervalMs = () => {
  return getPositiveInteger(
    process.env.VIDEO_WORKER_HEARTBEAT_INTERVAL_MS,

    DEFAULT_HEARTBEAT_INTERVAL_MS
  );
};

const ensureFileExists = async (filePath) => {
  try {
    await access(filePath);
  } catch {
    throw new Error(`The source video file does not exist: ${filePath}`);
  }
};

const normalizeCourseFolderName = (value) => {
  const folderName =
    typeof value === 'string' ? value.normalize('NFC').trim() : '';

  if (!folderName) {
    throw new Error('The course intro job does not have a course title.');
  }

  if (
    folderName.includes('/') ||
    folderName.includes('\\') ||
    folderName.includes('\0') ||
    folderName === '.' ||
    folderName === '..'
  ) {
    throw new Error('The course title contains invalid path characters.');
  }

  return folderName;
};

/*
 * استفاده از job.id باعث می‌شود هر نسخه ویدئو مسیر
 * مستقل داشته باشد. در نتیجه نسخه قبلی تا زمان موفقیت
 * کامل Job جدید سالم باقی می‌ماند.
 */
const getOutputPrefix = (job) => {
  switch (job.targetType) {
    case 'SESSION_VIDEO': {
      if (typeof job.sessionId !== 'string' || !job.sessionId) {
        throw new Error('The session video job does not have a sessionId.');
      }

      if (!Number.isInteger(job.termId) || job.termId <= 0) {
        throw new Error('The session video job does not have a valid termId.');
      }

      return ['videos', job.termId, job.sessionId, job.id].join('/');
    }

    case 'COURSE_INTRO': {
      const folderName = normalizeCourseFolderName(job.courseTitle);

      return ['videos', folderName, 'intro', job.id].join('/');
    }

    default:
      throw new Error(`Unsupported video job target: ${job.targetType}`);
  }
};

const startHeartbeat = (jobId) => {
  const log = getVideoJobLogger(jobId);
  const intervalMs = getHeartbeatIntervalMs();

  let heartbeatRunning = false;

  let stopped = false;

  const runHeartbeat = async () => {
    if (stopped || heartbeatRunning) {
      return;
    }

    heartbeatRunning = true;

    try {
      const touched = await heartbeatVideoJob(jobId);

      if (!touched) {
        stopped = true;

        clearInterval(interval);
      }
    } catch (error) {
      logError({
        log,
        error,

        message: 'Video job heartbeat failed',

        data: {
          event: 'video_job_heartbeat_failed',
        },
      });
    } finally {
      heartbeatRunning = false;
    }
  };

  const interval = setInterval(runHeartbeat, intervalMs);

  interval.unref?.();

  return () => {
    stopped = true;

    clearInterval(interval);
  };
};

const logCleanupResults = (results, job) => {
  const log = getVideoJobLogger(job);

  const cleanupTargets = ['processing_directory', 'source_directory'];

  results.forEach((result, index) => {
    if (result.status !== 'rejected') {
      return;
    }

    logError({
      log,

      error: result.reason,

      message: 'Post-publish cleanup failed',

      data: {
        event: 'video_job_cleanup_failed',

        cleanupTarget: cleanupTargets[index] || 'unknown',
      },
    });
  });
};

export async function processNextVideoJob() {
  const job = await claimNextVideoJob();

  if (!job) {
    return {
      processed: false,

      message: 'No queued video job was found.',
    };
  }

  const jobStartedAt = Date.now();

  const jobLog = getVideoJobLogger(job);

  jobLog.info(
    {
      event: 'video_job_processing_started',

      status: job.status,

      progress: job.progress,

      uploadProgress: job.uploadProgress,
    },

    'Video job processing started'
  );

  const processingDirectory = path.join(getProcessingRoot(), job.id);

  const hlsOutputDirectory = path.join(processingDirectory, 'hls');

  const stopHeartbeat = startHeartbeat(job.id);

  let sourcePath = null;

  try {
    if (!job.sourcePath) {
      throw new Error('The video job does not have a source path.');
    }

    sourcePath = path.resolve(process.cwd(), job.sourcePath);

    await ensureFileExists(sourcePath);

    await rm(processingDirectory, {
      recursive: true,
      force: true,
    });

    /*
     * Root باید برای statfs وجود داشته باشد، ولی خود
     * workdir هنوز ساخته نمی‌شود تا preflight انجام شود.
     */
    await mkdir(getProcessingRoot(), {
      recursive: true,
    });

    const metadata = await probeVideo(sourcePath);

    jobLog.info(
      {
        event: 'video_job_probe_completed',

        width: metadata.width,

        height: metadata.height,

        duration: metadata.duration,

        hasAudio: metadata.hasAudio,
      },

      'Video source probe completed'
    );

    const estimatedHlsOutputBytes =
      estimateHlsOutputBytes(metadata);

    const outputCopies =
      getProcessingOutputCopies();

    const diskSpace =
      await ensureVideoDiskSpace({
        targetPath:
          getProcessingRoot(),

        /*
         * یک نسخه workdir همیشه داریم. در Local Storage
         * هنگام publish یک کپی دیگر هم موقتاً ساخته می‌شود.
         * مقدار پیش‌فرض ۲ محافظه‌کارانه است و برای FTPS
         * می‌تواند با env روی ۱ قرار بگیرد.
         */
        requiredBytes:
          estimatedHlsOutputBytes *
          outputCopies,

        operation:
          'پردازش و انتشار ویدئو',
      });

    jobLog.info(
      {
        event:
          'video_job_disk_space_preflight_passed',

        estimatedHlsOutputBytes,

        outputCopies,

        requiredBytes:
          diskSpace.requiredBytes,

        reserveBytes:
          diskSpace.reserveBytes,

        availableBytes:
          diskSpace.availableBytes,
      },

      'Video processing disk space preflight passed'
    );

    await mkdir(hlsOutputDirectory, {
      recursive: true,
    });

    let lastDatabaseProgress = 1;

    let progressUpdatePromise = Promise.resolve();

    const encodingStartedAt = Date.now();

    jobLog.info(
      {
        event: 'video_job_encoding_started',
      },

      'Video HLS encoding started'
    );

    const generationResult = await generateHls({
      sourcePath,

      outputDirectory: hlsOutputDirectory,

      metadata,

      onProgress: (ffmpegProgress) => {
        const jobProgress = Math.max(
          2,

          Math.min(
            89,

            Math.round(ffmpegProgress * 0.88)
          )
        );

        if (jobProgress < lastDatabaseProgress + 2) {
          return;
        }

        lastDatabaseProgress = jobProgress;

        /*
         * آپدیت‌ها به‌ترتیب ارسال می‌شوند تا Update قدیمی
         * بعد از Update جدید روی دیتابیس نوشته نشود.
         */
        progressUpdatePromise = progressUpdatePromise
          .then(() =>
            updateVideoJobProgress({
              jobId: job.id,

              progress: jobProgress,
            })
          )
          .catch((error) => {
            logError({
              log: jobLog,
              error,
              message: 'Video job progress update failed',
              data: {
                event: 'video_job_progress_update_failed',
                requestedProgress: jobProgress,
              },
            });
          });
      },
    });

    jobLog.info(
      {
        event: 'video_job_encoding_completed',

        durationMs: Date.now() - encodingStartedAt,

        profiles: generationResult.profiles,
      },

      'Video HLS encoding completed'
    );

    await progressUpdatePromise;

    await access(generationResult.masterPlaylistPath);

    await markVideoJobPublishing(job.id);

    const storage = getVideoStorage();

    const outputPrefix = getOutputPrefix(job);

    const publishingStartedAt = Date.now();

    jobLog.info(
      {
        event: 'video_job_storage_publish_started',

        outputPrefix,
      },

      'Publishing HLS output to storage'
    );

    await storage.saveDirectory(hlsOutputDirectory, outputPrefix);

    jobLog.info(
      {
        event: 'video_job_storage_publish_completed',

        outputPrefix,

        durationMs: Date.now() - publishingStartedAt,
      },

      'HLS output published to storage'
    );

    const outputKey = `${outputPrefix}/master.m3u8`;

    const masterExists = await storage.exists(outputKey);

    if (!masterExists) {
      throw new Error('The published master playlist could not be verified.');
    }

    const publishResult = await publishVideoJob({
      jobId: job.id,

      outputKey,
    });

    /*
     * دیتابیس حالا به نسخه جدید اشاره می‌کند. فقط بعد از
     * READY شدن می‌توان نسخه منتشرشده قبلی را حذف کرد.
     * خطای این Cleanup نباید Job موفق را FAILED کند.
     */
    try {
      const previousCleanup =
        await cleanupPreviousPublishedVideo({
          storage,

          previousOutputKey:
            publishResult.previousOutputKey,

          currentOutputKey:
            outputKey,
        });

      if (previousCleanup.deleted) {
        jobLog.info(
          {
            event:
              'video_previous_published_output_deleted',

            previousOutputPrefix:
              previousCleanup.previousPrefix,
          },

          'Previous published video output was deleted'
        );
      }
    } catch (cleanupError) {
      logError({
        log: jobLog,
        error: cleanupError,

        message:
          'Failed to remove previous published video output',

        data: {
          event:
            'video_previous_published_output_cleanup_failed',

          previousOutputKey:
            publishResult.previousOutputKey,
        },
      });
    }

    /*
     * Job در دیتابیس READY شده است.
     * خطای Cleanup دیگر نباید Job موفق را FAILED کند.
     */
    const cleanupResults = await Promise.allSettled([
      rm(processingDirectory, {
        recursive: true,
        force: true,
      }),

      rm(path.dirname(sourcePath), {
        recursive: true,
        force: true,
      }),
    ]);

    logCleanupResults(cleanupResults, job);

    jobLog.info(
      {
        event: 'video_job_ready',

        outputKey,

        durationMs: Date.now() - jobStartedAt,

        profiles: generationResult.profiles,
      },

      'Video job completed successfully'
    );

    return {
      processed: true,

      job: publishResult.job,

      video: publishResult.video,

      course: publishResult.course,

      metadata,

      profiles: generationResult.profiles,

      publicUrl: storage.getPublicUrl(outputKey),
    };
  } catch (error) {
    logError({
      log: jobLog,

      error,

      message: 'Video job processing failed',

      data: {
        event: 'video_job_processing_failed',

        durationMs: Date.now() - jobStartedAt,
      },
    });
    if (
      error instanceof VideoDiskSpaceError ||
      error?.code === 'VIDEO_DISK_SPACE_LOW'
    ) {
      await markVideoJobFailed({
        jobId: job.id,
        error,
      }).catch((statusError) => {
        logError({
          log: jobLog,
          error: statusError,

          message:
            'Failed to mark low-disk video job as failed',

          data: {
            event:
              'video_job_low_disk_status_update_failed',
          },
        });
      });

      jobLog.error(
        {
          event:
            'video_job_stopped_for_low_disk_space',

          availableBytes:
            error?.availableBytes,

          requiredBytes:
            error?.requiredBytes,

          reserveBytes:
            error?.reserveBytes,
        },

        'Video job stopped because disk space is too low'
      );

      await rm(processingDirectory, {
        recursive: true,
        force: true,
      }).catch(() => {});

      throw error;
    }

    const failureResult = await handleVideoJobFailure({
      jobId: job.id,

      error,
    }).catch((statusError) => {
      logError({
        log: jobLog,

        error: statusError,

        message: 'Failed to update video job failure status',

        data: {
          event: 'video_job_failure_status_update_failed',
        },
      });

      return null;
    });

    if (failureResult?.requeued) {
      jobLog.warn(
        {
          event: 'video_job_requeued',

          attempt: job.attempts,

          maxAttempts: failureResult.maxAttempts,
        },

        'Video job requeued after failure'
      );
    }

    if (failureResult?.terminal) {
      jobLog.error(
        {
          event: 'video_job_permanently_failed',

          attempt: job.attempts,

          maxAttempts: failureResult.maxAttempts,
        },

        'Video job permanently failed'
      );
    }

    await rm(processingDirectory, {
      recursive: true,
      force: true,
    }).catch(() => {});

    throw error;
  } finally {
    stopHeartbeat();
  }
}
