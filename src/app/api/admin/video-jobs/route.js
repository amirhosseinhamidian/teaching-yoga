import { NextResponse } from 'next/server';

import prismadb from '@/libs/prismadb';

import { requireAdminApi } from '@/server/auth/require-admin-api';

import { logError } from '@/server/logger';

import { withApiLogging } from '@/server/logger/with-api-logging';

import { getAdminVideoJobLogger } from '@/server/video/admin-video-job-logger';

import { createVideoJob } from '@/server/video/jobs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_ACCESS_LEVELS = ['PUBLIC', 'REGISTERED', 'PURCHASED'];

const ACTIVE_JOB_STATUSES = ['UPLOADING', 'QUEUED', 'PROCESSING', 'PUBLISHING'];

const createValidationResponse = (error) => {
  return NextResponse.json(
    {
      success: false,
      error,
    },
    {
      status: 400,
    }
  );
};

const classifyCreateError = (error) => {
  if (error instanceof SyntaxError) {
    return {
      status: 400,
      expected: true,
      message: 'بدنه درخواست معتبر نیست.',
    };
  }

  const message =
    error instanceof Error ? error.message : 'خطا در ساخت عملیات پردازش ویدئو.';

  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes('not found')) {
    return {
      status: 404,
      expected: true,
      message,
    };
  }

  if (
    normalizedMessage.includes('required') ||
    normalizedMessage.includes('must be') ||
    normalizedMessage.includes('invalid')
  ) {
    return {
      status: 400,
      expected: true,
      message,
    };
  }

  return {
    status: 500,
    expected: false,
    message: 'خطا در ساخت عملیات پردازش ویدئو.',
  };
};

const handlePost = async (request) => {
  let log = getAdminVideoJobLogger();

  try {
    const auth = await requireAdminApi();

    if (!auth.ok) {
      return auth.response;
    }

    log = getAdminVideoJobLogger({
      actor: auth.user,
    });

    const body = await request.json();

    const sessionId =
      typeof body?.sessionId === 'string' ? body.sessionId.trim() : '';

    const termId = Number(body?.termId);

    const accessLevel =
      typeof body?.accessLevel === 'string'
        ? body.accessLevel.trim().toUpperCase()
        : '';

    if (!sessionId) {
      return createValidationResponse('شناسه جلسه معتبر نیست.');
    }

    if (!Number.isInteger(termId) || termId <= 0) {
      return createValidationResponse('شناسه ترم معتبر نیست.');
    }

    if (!ALLOWED_ACCESS_LEVELS.includes(accessLevel)) {
      return createValidationResponse('سطح دسترسی ویدئو معتبر نیست.');
    }

    log = log.child({
      sessionId,
      termId,
      accessLevel,
      targetType: 'SESSION_VIDEO',
    });

    const activeJob = await prismadb.videoProcessingJob.findFirst({
      where: {
        sessionId,
        termId,

        status: {
          in: ACTIVE_JOB_STATUSES,
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

    if (activeJob) {
      log.warn(
        {
          event: 'admin_video_job_active_conflict',

          activeJobId: activeJob.id,
          activeJobStatus: activeJob.status,
        },
        'An active video job already exists for the session'
      );

      return NextResponse.json(
        {
          success: false,
          error: 'برای این جلسه یک عملیات آپلود یا پردازش فعال وجود دارد.',
          job: activeJob,
        },
        {
          status: 409,
        }
      );
    }

    const job = await createVideoJob({
      sessionId,
      termId,
      accessLevel,
    });

    getAdminVideoJobLogger({
      actor: auth.user,
      job,
    }).info(
      {
        event: 'admin_video_job_created',

        accessLevel,
      },
      'Session video processing job created'
    );

    return NextResponse.json(
      {
        success: true,
        job,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    const classified = classifyCreateError(error);

    if (classified.expected) {
      log.warn(
        {
          event: 'admin_video_job_create_rejected',

          status: classified.status,
          reason: classified.message,
        },
        'Video job creation was rejected'
      );
    } else {
      logError({
        log,
        error,

        message: 'Admin video job creation failed',

        data: {
          event: 'admin_video_job_create_failed',
        },
      });
    }

    return NextResponse.json(
      {
        success: false,
        error: classified.message,
      },
      {
        status: classified.status,
      }
    );
  }
};

export const POST = withApiLogging(handlePost, {
  route: '/api/admin/video-jobs',
  component: 'admin-video-job-create-api',
});
