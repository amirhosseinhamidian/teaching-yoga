import { NextResponse } from 'next/server';

import { requireAdminApi } from '@/server/auth/require-admin-api';

import {
  logError,
} from '@/server/logger';

import {
  withApiLogging,
} from '@/server/logger/with-api-logging';

import {
  getAdminVideoJobLogger,
} from '@/server/video/admin-video-job-logger';

import {
  ensureVideoJobOwnership,
  getVideoJob,
  retryVideoJob,
} from '@/server/video/jobs';

import {
  assertRetryableVideoSource,
  VideoJobRetrySourceError,
} from '@/server/video/jobs/assert-retryable-video-source';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const getJobId = async (
  context
) => {
  const params =
    await context.params;

  const jobId =
    typeof params?.jobId ===
      'string'
      ? params.jobId.trim()
      : '';

  if (
    !jobId ||
    !/^[a-zA-Z0-9_-]+$/.test(
      jobId
    )
  ) {
    return null;
  }

  return jobId;
};

const handlePost = async (
  request,
  context
) => {
  let log =
    getAdminVideoJobLogger({
      component:
        'admin-video-job-retry',
    });

  try {
    const auth =
      await requireAdminApi();

    if (!auth.ok) {
      return auth.response;
    }

    const jobId =
      await getJobId(
        context
      );

    if (!jobId) {
      return NextResponse.json(
        {
          success: false,
          error:
            'شناسه عملیات ویدئو معتبر نیست.',
        },
        {
          status: 400,
        }
      );
    }

    log =
      getAdminVideoJobLogger({
        jobId,
        actor: auth.user,

        component:
          'admin-video-job-retry',
      });

    const ownership =
      await ensureVideoJobOwnership({
        jobId,
        userId:
          auth.user.id,
      });

    if (!ownership.owned) {
      return NextResponse.json(
        {
          success: false,
          error:
            'عملیات پردازش ویدئو پیدا نشد.',
        },
        {
          status: 404,
        }
      );
    }

    const job =
      await getVideoJob(
        jobId
      );

    if (!job) {
      return NextResponse.json(
        {
          success: false,
          error:
            'عملیات پردازش ویدئو پیدا نشد.',
        },
        {
          status: 404,
        }
      );
    }

    if (
      job.status !==
      'FAILED'
    ) {
      return NextResponse.json(
        {
          success: false,

          error:
            'فقط عملیات ناموفق را می‌توان دوباره برای پردازش ارسال کرد.',
        },
        {
          status: 409,
        }
      );
    }

    const source =
      await assertRetryableVideoSource({
        jobId,
        sourcePath:
          job.sourcePath,
      });

    log.info(
      {
        event:
          'admin_video_job_manual_retry_started',

        sourceSizeBytes:
          source.size,

        previousAttempts:
          job.attempts,
      },
      'Manual video processing retry started'
    );

    const retriedJob =
      await retryVideoJob(
        jobId
      );

    log.info(
      {
        event:
          'admin_video_job_manual_retry_queued',

        nextStatus:
          retriedJob.status,
      },
      'Video job was queued for manual retry'
    );

    return NextResponse.json(
      {
        success: true,

        message:
          'پردازش ویدئو بدون آپلود مجدد دوباره در صف قرار گرفت.',

        job:
          retriedJob,
      },
      {
        status: 200,

        headers: {
          'Cache-Control':
            'no-store',
        },
      }
    );
  } catch (error) {
    if (
      error instanceof
      VideoJobRetrySourceError
    ) {
      log.warn(
        {
          event:
            'admin_video_job_manual_retry_source_unavailable',

          reason:
            error.message,
        },
        'Manual video job retry was rejected because source is unavailable'
      );

      return NextResponse.json(
        {
          success: false,
          error:
            error.message,
        },
        {
          status:
            error.statusCode,
        }
      );
    }

    if (
      error instanceof Error &&
      (
        error.message.includes(
          'Cannot retry'
        ) ||
        error.message.includes(
          'source video file'
        )
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            error.message,
        },
        {
          status: 409,
        }
      );
    }

    logError({
      log,
      error,

      message:
        'Admin video job manual retry failed',

      data: {
        event:
          'admin_video_job_manual_retry_failed',
      },
    });

    return NextResponse.json(
      {
        success: false,
        error:
          'خطا در تلاش مجدد پردازش ویدئو.',
      },
      {
        status: 500,
      }
    );
  }
};

export const POST =
  withApiLogging(
    handlePost,
    {
      route:
        '/api/admin/video-jobs/[jobId]/retry',

      component:
        'admin-video-job-retry-api',
    }
  );
