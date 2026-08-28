import { NextResponse } from 'next/server';

import prismadb from '@/libs/prismadb';

import { requireAdminApi } from '@/server/auth/require-admin-api';

import { logError } from '@/server/logger';

import { withApiLogging } from '@/server/logger/with-api-logging';

import { getAdminVideoJobLogger } from '@/server/video/admin-video-job-logger';

import {
  ActiveVideoJobConflictError,
  createVideoJob,
  ensureVideoJobOwnership,
} from '@/server/video/jobs';

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

const getActiveJobs = async (userId) => {
  return prismadb.videoProcessingJob.findMany({
    where: {
      createdByUserId: userId,

      status: {
        in: [
          'UPLOADING',
          'QUEUED',
          'PROCESSING',
          'PUBLISHING',
        ],
      },
    },

    orderBy: {
      updatedAt: 'desc',
    },

    take: 20,

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

      createdAt: true,
      updatedAt: true,

      session: {
        select: {
          id: true,
          name: true,
        },
      },

      course: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });
};

const handleGet = async () => {
  try {
    const auth = await requireAdminApi();

    if (!auth.ok) {
      return auth.response;
    }

    const jobs = await getActiveJobs(
      auth.user.id
    );

    return NextResponse.json(
      {
        success: true,
        jobs,
      },
      {
        status: 200,
        headers: {
          'Cache-Control':
            'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    logError({
      log: getAdminVideoJobLogger(),
      error,

      message: 'Active admin video jobs could not be listed',

      data: {
        event: 'admin_video_jobs_list_failed',
      },
    });

    return NextResponse.json(
      {
        success: false,
        error: 'خطا در بازیابی عملیات‌های فعال ویدئو.',
      },
      {
        status: 500,
      }
    );
  }
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
  let actor = null;

  try {
    const auth = await requireAdminApi();

    if (!auth.ok) {
      return auth.response;
    }

    actor = auth.user;

    log = getAdminVideoJobLogger({
      actor,
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
      const ownership =
        await ensureVideoJobOwnership({
          jobId: activeJob.id,
          userId: auth.user.id,
        });

      const canAdopt =
        ownership.owned;

      log.warn(
        {
          event: 'admin_video_job_active_conflict',

          activeJobId: activeJob.id,
          activeJobStatus: activeJob.status,

          sameAdmin: canAdopt,
          legacyClaimed:
            ownership.claimed,
        },
        'An active video job already exists for the session'
      );

      return NextResponse.json(
        {
          success: false,

          error: canAdopt
            ? 'برای این جلسه یک عملیات آپلود یا پردازش فعال وجود دارد.'
            : 'برای این جلسه یک عملیات ویدئویی توسط مدیر دیگری در حال انجام است.',

          ...(canAdopt
            ? {
                job: {
                  ...activeJob,

                  createdByUserId:
                    auth.user.id,
                },
              }
            : {}),
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
      createdByUserId: auth.user.id,
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
    if (
      error instanceof
        ActiveVideoJobConflictError
    ) {
      const activeJob =
        error.job;

      const canAdopt =
        Boolean(
          actor?.id &&
          activeJob?.createdByUserId ===
            actor.id
        );

      log.warn(
        {
          event:
            'admin_video_job_atomic_conflict',

          activeJobId:
            activeJob?.id || null,

          activeJobStatus:
            activeJob?.status || null,

          sameAdmin: canAdopt,
        },
        'Atomic video job create conflict detected'
      );

      return NextResponse.json(
        {
          success: false,

          error: canAdopt
            ? 'برای این جلسه یک عملیات آپلود یا پردازش فعال وجود دارد.'
            : 'برای این جلسه یک عملیات ویدئویی توسط مدیر دیگری در حال انجام است.',

          ...(canAdopt &&
          activeJob
            ? {
                job: activeJob,
              }
            : {}),
        },
        {
          status: 409,
        }
      );
    }

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

export const GET = withApiLogging(handleGet, {
  route: '/api/admin/video-jobs',
  component: 'admin-video-job-list-api',
});

export const POST = withApiLogging(handlePost, {
  route: '/api/admin/video-jobs',
  component: 'admin-video-job-create-api',
});
