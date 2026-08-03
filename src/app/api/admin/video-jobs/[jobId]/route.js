/* eslint-disable no-undef */
import path from 'node:path';
import { rm } from 'node:fs/promises';

import { NextResponse } from 'next/server';

import prismadb from '@/libs/prismadb';
import { getVideoStorage } from '@/server/storage';
import { requireAdminApi } from '@/server/auth/require-admin-api';
import { logError } from '@/server/logger';
import { getRequestLogger } from '@/server/logger/request-context';
import { withApiLogging } from '@/server/logger/with-api-logging';
import { getAdminVideoJobLogger } from '@/server/video/admin-video-job-logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_UPLOAD_ROOT = './storage/uploads/jobs';

const DEFAULT_PROCESSING_ROOT = './storage/processing/jobs';

const CANCELLABLE_STATUSES = ['UPLOADING', 'QUEUED'];

const getUploadRoot = () =>
  path.resolve(
    process.cwd(),
    process.env.VIDEO_UPLOAD_ROOT || DEFAULT_UPLOAD_ROOT
  );

const getProcessingRoot = () =>
  path.resolve(
    process.cwd(),
    process.env.VIDEO_PROCESSING_ROOT || DEFAULT_PROCESSING_ROOT
  );

const getJobId = async (context) => {
  const params = await context.params;

  const jobId = typeof params?.jobId === 'string' ? params.jobId.trim() : '';

  if (!jobId || !/^[a-zA-Z0-9_-]+$/.test(jobId)) {
    throw new Error('INVALID_JOB_ID');
  }

  return jobId;
};

const getStage = (status) => {
  switch (status) {
    case 'UPLOADING':
      return 'uploading';

    case 'QUEUED':
      return 'queued';

    case 'PROCESSING':
      return 'processing';

    case 'PUBLISHING':
      return 'publishing';

    case 'READY':
      return 'ready';

    case 'FAILED':
      return 'failed';

    case 'CANCELLED':
      return 'cancelled';

    default:
      return 'unknown';
  }
};

const getDisplayProgress = (job) => {
  switch (job.status) {
    case 'UPLOADING':
      return Math.max(0, Math.min(100, job.uploadProgress || 0));

    case 'QUEUED':
      return 0;

    case 'PROCESSING':
      return Math.max(0, Math.min(89, job.progress || 0));

    case 'PUBLISHING':
      return Math.max(90, Math.min(99, job.progress || 90));

    case 'READY':
      return 100;

    case 'FAILED':
    case 'CANCELLED':
      return Math.max(0, Math.min(100, job.progress || 0));

    default:
      return 0;
  }
};

const getPublicUrl = (outputKey, log) => {
  if (typeof outputKey !== 'string' || !outputKey.trim()) {
    return null;
  }

  try {
    const storage = getVideoStorage();

    return storage.getPublicUrl(outputKey.trim());
  } catch (error) {
    logError({
      log,
      error,
      message: 'Video job public URL could not be generated',
      data: {
        event: 'admin_video_job_public_url_failed',
      },
    });

    return null;
  }
};

const handleGet = async (request, context) => {
  let log = getRequestLogger({
    component: 'admin-video-job-status',
  });
  try {
    const auth = await requireAdminApi();

    if (!auth.ok) {
      return auth.response;
    }
    const jobId = await getJobId(context);

    log = getAdminVideoJobLogger({
      jobId,
      actor: auth.user,

      component: 'admin-video-job-status',
    });

    const job = await prismadb.videoProcessingJob.findUnique({
      where: {
        id: jobId,
      },

      select: {
        id: true,
        targetType: true,

        sessionId: true,
        termId: true,

        courseId: true,
        courseTitle: true,

        accessLevel: true,

        status: true,
        uploadProgress: true,
        progress: true,
        attempts: true,

        sourcePath: true,
        outputKey: true,
        errorMessage: true,

        startedAt: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,

        session: {
          select: {
            id: true,
            name: true,
            termId: true,
            videoId: true,
            isActive: true,
            type: true,

            video: {
              select: {
                id: true,
                videoKey: true,
                accessLevel: true,
                status: true,
                createAt: true,
                updatedAt: true,
              },
            },
          },
        },

        course: {
          select: {
            id: true,
            title: true,
            shortAddress: true,
            introVideoUrl: true,
            activeStatus: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        {
          success: false,
          error: 'عملیات پردازش ویدئو پیدا نشد.',
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json(
      {
        success: true,

        job: {
          ...job,

          stage: getStage(job.status),

          displayProgress: getDisplayProgress(job),

          publicUrl: getPublicUrl(job.outputKey, log),

          canCancel: CANCELLABLE_STATUSES.includes(job.status),
        },
      },
      {
        status: 200,

        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_JOB_ID') {
      return NextResponse.json(
        {
          success: false,
          error: 'شناسه عملیات ویدئو معتبر نیست.',
        },
        {
          status: 400,
        }
      );
    }

    logError({
      log,
      error,

      message: 'Admin video job status request failed',

      data: {
        event: 'admin_video_job_status_failed',
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: 'خطا در دریافت وضعیت ویدئو.',
      },
      {
        status: 500,
      }
    );
  }
};

export const GET = withApiLogging(handleGet, {
  route: '/api/admin/video-jobs/[jobId]',
  component: 'admin-video-job-status-api',

  /*
   * این API هنگام پردازش هر دو ثانیه Poll می‌شود.
   */
  logSuccess: false,
});

const handleDelete = async (request, context) => {
  let log = getRequestLogger({
    component: 'admin-video-job-cancel',
  });
  try {
    const auth = await requireAdminApi();

    if (!auth.ok) {
      return auth.response;
    }
    const jobId = await getJobId(context);

    log = getAdminVideoJobLogger({
      jobId,
      actor: auth.user,

      component: 'admin-video-job-cancel',
    });

    const job = await prismadb.videoProcessingJob.findUnique({
      where: {
        id: jobId,
      },

      select: {
        id: true,
        targetType: true,
        status: true,
        sourcePath: true,
        outputKey: true,
        sessionId: true,
        termId: true,
        courseId: true,
        attempts: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        {
          success: false,
          error: 'عملیات پردازش ویدئو پیدا نشد.',
        },
        {
          status: 404,
        }
      );
    }

    log = getAdminVideoJobLogger({
      job,
      actor: auth.user,

      component: 'admin-video-job-cancel',
    });

    if (!CANCELLABLE_STATUSES.includes(job.status)) {
      return NextResponse.json(
        {
          success: false,
          error:
            job.status === 'PROCESSING' || job.status === 'PUBLISHING'
              ? 'عملیات وارد مرحله پردازش شده و در حال حاضر قابل لغو نیست.'
              : 'این عملیات دیگر قابل لغو نیست.',
          job: {
            id: job.id,
            status: job.status,
            stage: getStage(job.status),
          },
        },
        {
          status: 409,
        }
      );
    }

    log.info(
      {
        event: 'admin_video_job_cancel_started',

        currentStatus: job.status,
      },
      'Admin video job cancellation started'
    );

    const cancelResult = await prismadb.videoProcessingJob.updateMany({
      where: {
        id: jobId,

        status: {
          in: CANCELLABLE_STATUSES,
        },
      },

      data: {
        status: 'CANCELLED',
        errorMessage: 'Cancelled by administrator.',
        completedAt: new Date(),
      },
    });

    if (cancelResult.count === 0) {
      const currentJob = await prismadb.videoProcessingJob.findUnique({
        where: {
          id: jobId,
        },

        select: {
          id: true,
          status: true,
        },
      });

      return NextResponse.json(
        {
          success: false,
          error: 'وضعیت عملیات تغییر کرده و دیگر قابل لغو نیست.',
          job: currentJob
            ? {
                ...currentJob,
                stage: getStage(currentJob.status),
              }
            : null,
        },
        {
          status: 409,
        }
      );
    }

    const uploadDirectory = path.join(getUploadRoot(), jobId);

    const processingDirectory = path.join(getProcessingRoot(), jobId);

    const cleanupResults = await Promise.allSettled([
      rm(uploadDirectory, {
        recursive: true,
        force: true,
      }),

      rm(processingDirectory, {
        recursive: true,
        force: true,
      }),
    ]);

    const cleanupTargets = ['upload_directory', 'processing_directory'];

    cleanupResults.forEach((result, index) => {
      if (result.status !== 'rejected') {
        return;
      }

      logError({
        log,

        error: result.reason,

        message: 'Video job cancellation cleanup failed',

        data: {
          event: 'admin_video_job_cancel_cleanup_failed',

          cleanupTarget: cleanupTargets[index] || 'unknown',
        },
      });
    });

    const cancelledJob = await prismadb.videoProcessingJob.findUnique({
      where: {
        id: jobId,
      },

      select: {
        id: true,
        targetType: true,

        sessionId: true,
        termId: true,

        courseId: true,
        courseTitle: true,

        status: true,
        uploadProgress: true,
        progress: true,
        attempts: true,

        sourcePath: true,
        outputKey: true,
        errorMessage: true,

        startedAt: true,
        completedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    log.info(
      {
        event: 'admin_video_job_cancelled',

        previousStatus: job.status,

        cleanupFailures: cleanupResults.filter(
          (result) => result.status === 'rejected'
        ).length,
      },
      'Admin video job was cancelled'
    );

    return NextResponse.json(
      {
        success: true,
        message: 'عملیات ویدئو با موفقیت لغو شد.',

        job: cancelledJob
          ? {
              ...cancelledJob,
              stage: getStage(cancelledJob.status),
              displayProgress: getDisplayProgress(cancelledJob),
              publicUrl: getPublicUrl(cancelledJob.outputKey, log),
              canCancel: false,
            }
          : null,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'INVALID_JOB_ID') {
      return NextResponse.json(
        {
          success: false,
          error: 'شناسه عملیات ویدئو معتبر نیست.',
        },
        {
          status: 400,
        }
      );
    }

    logError({
      log,
      error,

      message: 'Admin video job cancellation failed',

      data: {
        event: 'admin_video_job_cancel_failed',
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: 'خطا در لغو عملیات ویدئو.',
      },
      {
        status: 500,
      }
    );
  }
};

export const DELETE = withApiLogging(handleDelete, {
  route: '/api/admin/video-jobs/[jobId]',
  component: 'admin-video-job-cancel-api',
});
