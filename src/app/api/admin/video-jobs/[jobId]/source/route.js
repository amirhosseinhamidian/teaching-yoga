import { NextResponse } from 'next/server';

import { requireAdminApi } from '@/server/auth/require-admin-api';

import { logError } from '@/server/logger';

import { withApiLogging } from '@/server/logger/with-api-logging';

import { getAdminVideoJobLogger } from '@/server/video/admin-video-job-logger';

import { getVideoJob, markVideoJobQueued } from '@/server/video/jobs';

import {
  deleteJobUploadDirectory,
  saveSourceVideo,
  SourceVideoUploadError,
} from '@/server/video/uploads/source-video';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_CONTENT_TYPES = new Set([
  'video/mp4',
  'video/quicktime',
  'video/webm',
  'video/x-matroska',
  'application/octet-stream',
]);

const normalizeJobId = (value) => {
  const jobId = typeof value === 'string' ? value.trim() : '';

  if (!jobId || !/^[a-zA-Z0-9_-]+$/.test(jobId)) {
    return null;
  }

  return jobId;
};

const getFileName = (request) => {
  const value = request.headers.get('x-file-name') || 'source.mp4';

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const getContentLength = (request) => {
  const value = request.headers.get('content-length');

  if (!value) {
    return null;
  }

  const number = Number(value);

  if (!Number.isSafeInteger(number) || number < 0) {
    return null;
  }

  return number;
};

const getUploadErrorStatus = (error) => {
  if (error instanceof SourceVideoUploadError) {
    return error.statusCode;
  }

  if (error instanceof Error && error.message.includes('status')) {
    return 409;
  }

  return 500;
};

const handlePut = async (request, context) => {
  let jobId = null;

  let sourceSaved = false;

  let log = getAdminVideoJobLogger({
    component: 'admin-video-source-upload',
  });

  const uploadStartedAt = Date.now();

  try {
    const auth = await requireAdminApi();

    if (!auth.ok) {
      return auth.response;
    }

    const params = await context.params;

    jobId = normalizeJobId(params?.jobId);

    log = getAdminVideoJobLogger({
      jobId,
      actor: auth.user,

      component: 'admin-video-source-upload',
    });

    if (!jobId) {
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

    const job = await getVideoJob(jobId);

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

      component: 'admin-video-source-upload',
    });

    if (job.status !== 'UPLOADING') {
      log.warn(
        {
          event: 'video_source_upload_invalid_job_status',

          currentStatus: job.status,
        },
        'Video source upload rejected due to job status'
      );

      return NextResponse.json(
        {
          success: false,

          error: `امکان بارگذاری Source برای Job با وضعیت ${job.status} وجود ندارد.`,
        },
        {
          status: 409,
        }
      );
    }

    const contentType = (request.headers.get('content-type') || '')
      .split(';')[0]
      .trim()
      .toLowerCase();

    const contentLength = getContentLength(request);

    if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
      log.warn(
        {
          event: 'video_source_upload_content_type_rejected',

          contentType: contentType || null,
          contentLength,
        },
        'Video source content type was rejected'
      );

      return NextResponse.json(
        {
          success: false,
          error: 'نوع فایل ویدئویی پشتیبانی نمی‌شود.',
        },
        {
          status: 415,
        }
      );
    }

    log.info(
      {
        event: 'video_source_upload_started',

        contentType,
        expectedSizeBytes: contentLength,
      },
      'Video source upload started'
    );

    const savedVideo = await saveSourceVideo({
      jobId,

      body: request.body,

      /*
       * نام فایل برای ذخیره داخلی استفاده می‌شود
       * ولی در لاگ ثبت نمی‌شود.
       */
      fileName: getFileName(request),

      contentLength,

      signal: request.signal,
    });

    sourceSaved = true;

    const queuedJob = await markVideoJobQueued({
      jobId,

      sourcePath: savedVideo.sourcePath,
    });

    log.info(
      {
        event: 'video_source_upload_completed',

        sizeBytes: savedVideo.size,

        durationMs: Date.now() - uploadStartedAt,

        nextStatus: queuedJob.status,
      },
      'Video source upload completed and job was queued'
    );

    return NextResponse.json(
      {
        success: true,

        file: {
          sourcePath: savedVideo.sourcePath,
          size: savedVideo.size,
        },

        job: queuedJob,
      },
      {
        status: 200,

        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    if (sourceSaved && jobId) {
      try {
        await deleteJobUploadDirectory(jobId);
      } catch (cleanupError) {
        logError({
          log,
          error: cleanupError,

          message: 'Failed to clean uploaded video source after API failure',

          data: {
            event: 'video_source_upload_cleanup_failed',
          },
        });
      }
    }

    const status = getUploadErrorStatus(error);

    if (status < 500) {
      log.warn(
        {
          event: 'video_source_upload_rejected',

          status,

          reason:
            error instanceof Error
              ? error.message
              : 'Unknown video upload error',

          durationMs: Date.now() - uploadStartedAt,
        },
        'Video source upload was rejected'
      );
    } else {
      logError({
        log,
        error,

        message: 'Video source upload failed',

        data: {
          event: 'video_source_upload_failed',

          durationMs: Date.now() - uploadStartedAt,
        },
      });
    }

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : 'خطای ناشناخته در آپلود ویدئو.',
      },
      {
        status,
      }
    );
  }
};

export const PUT = withApiLogging(handlePut, {
  route: '/api/admin/video-jobs/[jobId]/source',
  component: 'admin-video-source-upload-api',
});
