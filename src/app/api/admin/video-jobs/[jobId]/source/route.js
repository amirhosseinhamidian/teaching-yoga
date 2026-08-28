import { NextResponse } from 'next/server';

import { requireAdminApi } from '@/server/auth/require-admin-api';

import { logError } from '@/server/logger';

import { withApiLogging } from '@/server/logger/with-api-logging';

import { getAdminVideoJobLogger } from '@/server/video/admin-video-job-logger';

import {
  ensureVideoJobOwnership,
  getVideoJob,
  markVideoJobFailed,
  markVideoJobQueued,
  updateVideoJobUploadProgress,
} from '@/server/video/jobs';

import {
  appendSourceVideoChunk,
  deleteJobUploadDirectory,
  getSourceVideoUploadStatus,
  saveSourceVideo,
  SourceVideoUploadError,
  SourceVideoUploadOffsetError,
} from '@/server/video/uploads/source-video';

import {
  finalizeParallelSourceVideo,
  getParallelSourceVideoUploadStatus,
  saveParallelSourceVideoChunk,
} from '@/server/video/uploads/parallel-source-video';

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

const getSafeIntegerHeader = (request, headerName) => {
  const value = request.headers.get(headerName);

  if (value === null) {
    return null;
  }

  const number = Number(value);

  if (!Number.isSafeInteger(number) || number < 0) {
    throw new SourceVideoUploadError(
      `${headerName} header is invalid.`
    );
  }

  return number;
};

const getChunkUploadParams = (request) => {
  const mode = (
    request.headers.get('x-upload-mode') || ''
  )
    .trim()
    .toLowerCase();

  const uploadOffset = getSafeIntegerHeader(
    request,
    'x-upload-offset'
  );

  const totalSize = getSafeIntegerHeader(
    request,
    'x-upload-length'
  );

  const isChunked =
    mode === 'chunked' ||
    uploadOffset !== null ||
    totalSize !== null;

  if (!isChunked) {
    return null;
  }

  if (uploadOffset === null || totalSize === null) {
    throw new SourceVideoUploadError(
      'Chunked uploads require x-upload-offset and x-upload-length headers.'
    );
  }

  if (totalSize <= 0) {
    throw new SourceVideoUploadError(
      'x-upload-length header is invalid.'
    );
  }

  return {
    uploadOffset,
    totalSize,
  };
};

const getParallelUploadParams = (
  request,
  {
    requireChunk = false,
  } = {}
) => {
  const mode = (
    request.headers.get('x-upload-mode') || ''
  )
    .trim()
    .toLowerCase();

  if (mode !== 'parallel-chunked') {
    return null;
  }

  const totalSize = getSafeIntegerHeader(
    request,
    'x-upload-length'
  );

  const chunkSize = getSafeIntegerHeader(
    request,
    'x-upload-chunk-size'
  );

  const rawFileFingerprint = (
    request.headers.get(
      'x-upload-fingerprint'
    ) || ''
  )
    .trim()
    .toLowerCase();

  const fileFingerprint =
    rawFileFingerprint || null;

  if (
    fileFingerprint &&
    !/^sha256:[a-f0-9]{64}$/.test(
      fileFingerprint
    )
  ) {
    throw new SourceVideoUploadError(
      'Parallel upload fingerprint is invalid.'
    );
  }

  if (
    totalSize === null ||
    totalSize <= 0 ||
    chunkSize === null ||
    chunkSize <= 0
  ) {
    throw new SourceVideoUploadError(
      'Parallel uploads require valid x-upload-length and x-upload-chunk-size headers.'
    );
  }

  if (!requireChunk) {
    return {
      totalSize,
      chunkSize,
      fileFingerprint,
    };
  }

  const uploadOffset = getSafeIntegerHeader(
    request,
    'x-upload-offset'
  );

  const chunkIndex = getSafeIntegerHeader(
    request,
    'x-upload-chunk-index'
  );

  if (
    uploadOffset === null ||
    chunkIndex === null
  ) {
    throw new SourceVideoUploadError(
      'Parallel chunk requests require x-upload-offset and x-upload-chunk-index headers.'
    );
  }

  return {
    totalSize,
    chunkSize,
    fileFingerprint,
    uploadOffset,
    chunkIndex,
  };
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

const getAdminOwnedVideoJob = async ({
  jobId,
  userId,
}) => {
  const ownership =
    await ensureVideoJobOwnership({
      jobId,
      userId,
    });

  if (!ownership.owned) {
    return null;
  }

  return getVideoJob(jobId);
};

const handlePut = async (request, context) => {
  let jobId = null;

  /*
   * این تشخیص باید قبل از اولین await انجام شود.
   * هنگام refresh ممکن است request قبل از auth/job lookup
   * abort شود؛ در آن حالت هم نباید فایل .part حذف شود.
   */
  const uploadMode = (
    request.headers.get('x-upload-mode') || ''
  )
    .trim()
    .toLowerCase();

  let isChunkedUpload =
    uploadMode === 'chunked' ||
    uploadMode === 'parallel-chunked' ||
    request.headers.has('x-upload-offset') ||
    request.headers.has('x-upload-length');

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

    const job =
      await getAdminOwnedVideoJob({
        jobId,
        userId: auth.user.id,
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

    const parallelChunkUpload =
      getParallelUploadParams(request, {
        requireChunk: true,
      });

    const chunkUpload = parallelChunkUpload
      ? null
      : getChunkUploadParams(request);

    isChunkedUpload = Boolean(
      parallelChunkUpload || chunkUpload
    );

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

    const fileName = getFileName(request);

    const savedVideo = parallelChunkUpload
      ? await saveParallelSourceVideoChunk({
          jobId,
          body: request.body,
          fileName,
          contentLength,

          uploadOffset:
            parallelChunkUpload.uploadOffset,

          totalSize:
            parallelChunkUpload.totalSize,

          chunkSize:
            parallelChunkUpload.chunkSize,

          chunkIndex:
            parallelChunkUpload.chunkIndex,

          signal: request.signal,
        })
      : chunkUpload
        ? await appendSourceVideoChunk({
            jobId,
            body: request.body,
            fileName,
            contentLength,
            uploadOffset: chunkUpload.uploadOffset,
            totalSize: chunkUpload.totalSize,
            signal: request.signal,
          })
        : await saveSourceVideo({
            jobId,
            body: request.body,

            /*
             * نام فایل برای ذخیره داخلی استفاده می‌شود
             * ولی در لاگ ثبت نمی‌شود.
             */
            fileName,

            contentLength,

            signal: request.signal,
          });

    if (parallelChunkUpload) {
      const uploadProgress = Math.max(
        0,
        Math.min(
          99,
          Math.floor(
            (savedVideo.uploadedBytes /
              savedVideo.totalSize) *
              100
          )
        )
      );

      const uploadingJob =
        await updateVideoJobUploadProgress({
          jobId,
          progress: uploadProgress,
        });

      return NextResponse.json(
        {
          success: true,

          upload: {
            uploadedBytes:
              savedVideo.uploadedBytes,

            totalSize:
              savedVideo.totalSize,

            chunkSize:
              savedVideo.chunkSize,

            totalChunks:
              savedVideo.totalChunks,

            completedChunks:
              savedVideo.completedChunks,

            chunks:
              savedVideo.chunks,

            chunk:
              savedVideo.chunk,

            complete:
              savedVideo.complete,

            finalized: false,
          },

          job: uploadingJob,
        },
        {
          status: 200,

          headers: {
            'Cache-Control': 'no-store',
          },
        }
      );
    }

    if (chunkUpload && !savedVideo.complete) {
      const uploadProgress = Math.max(
        0,
        Math.min(
          99,
          Math.floor(
            (savedVideo.uploadedBytes /
              savedVideo.totalSize) *
              100
          )
        )
      );

      const uploadingJob =
        await updateVideoJobUploadProgress({
          jobId,
          progress: uploadProgress,
        });

      log.info(
        {
          event: 'video_source_chunk_saved',
          uploadedBytes: savedVideo.uploadedBytes,
          totalSizeBytes: savedVideo.totalSize,
          uploadProgress,
          durationMs: Date.now() - uploadStartedAt,
        },
        'Video source chunk was saved'
      );

      return NextResponse.json(
        {
          success: true,

          upload: {
            uploadedBytes: savedVideo.uploadedBytes,
            totalSize: savedVideo.totalSize,
            complete: false,
          },

          job: uploadingJob,
        },
        {
          status: 200,
          headers: {
            'Cache-Control': 'no-store',
          },
        }
      );
    }

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

        ...(chunkUpload
          ? {
              upload: {
                uploadedBytes: savedVideo.uploadedBytes,
                totalSize: savedVideo.totalSize,
                complete: true,
              },
            }
          : {}),

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
    /*
     * در حالت legacy هر PUT کل فایل است؛ پس شکست آن Job را
     * FAILED می‌کند. در حالت chunked فایل .part عمداً حفظ
     * می‌شود تا درخواست بعدی از offset واقعی ادامه دهد.
     */
    if (jobId && !isChunkedUpload) {
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

    if (jobId && !isChunkedUpload) {
      const currentJob = await getVideoJob(jobId).catch(() => null);

      if (currentJob?.status === 'UPLOADING') {
        const failureError =
          error instanceof Error && error.name === 'AbortError'
            ? new Error('آپلود فایل ویدئویی پیش از تکمیل قطع شد.')
            : error;

        await markVideoJobFailed({
          jobId,
          error: failureError,
        }).catch((statusError) => {
          logError({
            log,
            error: statusError,
            message: 'Failed to update interrupted upload job status',
            data: {
              event: 'video_source_upload_status_update_failed',
            },
          });
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

        ...(error instanceof SourceVideoUploadOffsetError
          ? {
              expectedOffset: error.expectedOffset,
              receivedOffset: error.receivedOffset,
            }
          : {}),
      },
      {
        status,
      }
    );
  }
};

const handlePost = async (request, context) => {
  let log = getAdminVideoJobLogger({
    component: 'admin-video-source-finalize',
  });

  try {
    const auth = await requireAdminApi();

    if (!auth.ok) {
      return auth.response;
    }

    const params = await context.params;
    const jobId = normalizeJobId(params?.jobId);

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

    const job =
      await getAdminOwnedVideoJob({
        jobId,
        userId: auth.user.id,
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
      component: 'admin-video-source-finalize',
    });

    if (job.status !== 'UPLOADING') {
      if (
        [
          'QUEUED',
          'PROCESSING',
          'PUBLISHING',
          'READY',
        ].includes(job.status)
      ) {
        return NextResponse.json(
          {
            success: true,

            upload: {
              complete: true,
              finalized: true,
            },

            job,
          },
          {
            status: 200,
            headers: {
              'Cache-Control': 'no-store',
            },
          }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: 'این عملیات دیگر قابل نهایی‌سازی نیست.',
        },
        {
          status: 409,
        }
      );
    }

    const parallelUpload =
      getParallelUploadParams(request);

    if (!parallelUpload) {
      throw new SourceVideoUploadError(
        'Parallel upload headers are required for finalization.'
      );
    }

    const savedVideo =
      await finalizeParallelSourceVideo({
        jobId,

        fileName:
          getFileName(request),

        totalSize:
          parallelUpload.totalSize,

        chunkSize:
          parallelUpload.chunkSize,

        fileFingerprint:
          parallelUpload.fileFingerprint,
      });

    const queuedJob =
      await markVideoJobQueued({
        jobId,
        sourcePath:
          savedVideo.sourcePath,
      });

    log.info(
      {
        event:
          'video_source_parallel_upload_finalized',

        sizeBytes:
          savedVideo.size,

        nextStatus:
          queuedJob.status,
      },
      'Parallel video upload finalized and queued'
    );

    return NextResponse.json(
      {
        success: true,

        file: {
          sourcePath:
            savedVideo.sourcePath,
          size: savedVideo.size,
        },

        upload: {
          uploadedBytes:
            savedVideo.uploadedBytes,
          totalSize:
            savedVideo.totalSize,
          complete: true,
          finalized: true,
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
    const status =
      getUploadErrorStatus(error);

    if (status >= 500) {
      logError({
        log,
        error,

        message:
          'Parallel video source finalization failed',

        data: {
          event:
            'video_source_parallel_finalize_failed',
        },
      });
    }

    return NextResponse.json(
      {
        success: false,

        error:
          error instanceof Error
            ? error.message
            : 'خطا در نهایی‌سازی آپلود ویدئو.',
      },
      {
        status,
      }
    );
  }
};

export const POST = withApiLogging(handlePost, {
  route: '/api/admin/video-jobs/[jobId]/source',
  component: 'admin-video-source-finalize-api',
});

const handleGet = async (request, context) => {
  let log = getAdminVideoJobLogger({
    component: 'admin-video-source-upload-status',
  });

  try {
    const auth = await requireAdminApi();

    if (!auth.ok) {
      return auth.response;
    }

    const params = await context.params;
    const jobId = normalizeJobId(params?.jobId);

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

    const job =
      await getAdminOwnedVideoJob({
        jobId,
        userId: auth.user.id,
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
      component: 'admin-video-source-upload-status',
    });

    const parallelUpload =
      getParallelUploadParams(request);

    const totalSize =
      parallelUpload?.totalSize ??
      getSafeIntegerHeader(
        request,
        'x-upload-length'
      );

    if (totalSize === null || totalSize <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'x-upload-length header is required.',
        },
        {
          status: 400,
        }
      );
    }

    const upload = parallelUpload
      ? await getParallelSourceVideoUploadStatus({
          jobId,

          fileName:
            getFileName(request),

          totalSize:
            parallelUpload.totalSize,

          chunkSize:
            parallelUpload.chunkSize,

          fileFingerprint:
            parallelUpload.fileFingerprint,
        })
      : await getSourceVideoUploadStatus({
          jobId,
          fileName: getFileName(request),
          totalSize,
        });

    return NextResponse.json(
      {
        success: true,
        upload,
        job,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    const status = getUploadErrorStatus(error);

    if (status >= 500) {
      logError({
        log,
        error,
        message: 'Video source upload status lookup failed',
        data: {
          event: 'video_source_upload_status_lookup_failed',
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'خطا در دریافت وضعیت آپلود ویدئو.',
      },
      {
        status,
      }
    );
  }
};

export const GET = withApiLogging(handleGet, {
  route: '/api/admin/video-jobs/[jobId]/source',
  component: 'admin-video-source-upload-status-api',
});

export const PUT = withApiLogging(handlePut, {
  route: '/api/admin/video-jobs/[jobId]/source',
  component: 'admin-video-source-upload-api',
});
