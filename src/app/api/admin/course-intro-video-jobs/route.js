import { NextResponse } from 'next/server';

import prismadb from '@/libs/prismadb';

import { requireAdminApi } from '@/server/auth/require-admin-api';

import { logError } from '@/server/logger';

import { withApiLogging } from '@/server/logger/with-api-logging';

import { getAdminVideoJobLogger } from '@/server/video/admin-video-job-logger';

import { createCourseIntroVideoJob } from '@/server/video/jobs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ACTIVE_STATUSES = ['UPLOADING', 'QUEUED', 'PROCESSING', 'PUBLISHING'];

const classifyCreateError = (error) => {
  if (error instanceof SyntaxError) {
    return {
      status: 400,
      expected: true,
      message: 'بدنه درخواست معتبر نیست.',
    };
  }

  const message =
    error instanceof Error ? error.message : 'خطا در ساخت عملیات ویدئوی معرفی.';

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
    normalizedMessage.includes('invalid') ||
    normalizedMessage.includes('too long')
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
    message: 'خطا در ساخت عملیات ویدئوی معرفی.',
  };
};

const handlePost = async (request) => {
  let log = getAdminVideoJobLogger({
    component: 'admin-course-intro-video-jobs',
  });

  try {
    const auth = await requireAdminApi();

    if (!auth.ok) {
      return auth.response;
    }

    const body = await request.json();

    const courseTitle =
      typeof body?.courseTitle === 'string'
        ? body.courseTitle.normalize('NFC').trim()
        : '';

    const courseId =
      body?.courseId === undefined ||
      body?.courseId === null ||
      body?.courseId === ''
        ? null
        : Number(body.courseId);

    log = getAdminVideoJobLogger({
      actor: auth.user,

      component: 'admin-course-intro-video-jobs',
    }).child({
      targetType: 'COURSE_INTRO',
      courseId,
    });

    if (!courseTitle) {
      return NextResponse.json(
        {
          success: false,
          error: 'عنوان دوره معتبر نیست.',
        },
        {
          status: 400,
        }
      );
    }

    if (courseId !== null && (!Number.isInteger(courseId) || courseId <= 0)) {
      return NextResponse.json(
        {
          success: false,
          error: 'شناسه دوره معتبر نیست.',
        },
        {
          status: 400,
        }
      );
    }

    const activeJob = await prismadb.videoProcessingJob.findFirst({
      where: {
        targetType: 'COURSE_INTRO',

        status: {
          in: ACTIVE_STATUSES,
        },

        ...(courseId
          ? {
              courseId,
            }
          : {
              courseId: null,
              courseTitle,
            }),
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

    if (activeJob) {
      log.warn(
        {
          event: 'course_intro_video_job_active_conflict',

          activeJobId: activeJob.id,
          activeJobStatus: activeJob.status,
        },
        'An active course intro video job already exists'
      );

      return NextResponse.json(
        {
          success: false,
          error: 'برای ویدئوی معرفی این دوره یک عملیات فعال وجود دارد.',
          job: activeJob,
        },
        {
          status: 409,
        }
      );
    }

    const job = await createCourseIntroVideoJob({
      courseId,
      courseTitle,
    });

    getAdminVideoJobLogger({
      actor: auth.user,
      job,

      component: 'admin-course-intro-video-jobs',
    }).info(
      {
        event: 'course_intro_video_job_created',
      },
      'Course intro video processing job created'
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
          event: 'course_intro_video_job_create_rejected',

          status: classified.status,
          reason: classified.message,
        },
        'Course intro video job creation was rejected'
      );
    } else {
      logError({
        log,
        error,

        message: 'Course intro video job creation failed',

        data: {
          event: 'course_intro_video_job_create_failed',
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
  route: '/api/admin/course-intro-video-jobs',
  component: 'admin-course-intro-video-job-create-api',
});
