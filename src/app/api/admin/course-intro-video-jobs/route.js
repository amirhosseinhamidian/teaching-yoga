import { NextResponse } from 'next/server';

import prismadb from '@/libs/prismadb';

import { createCourseIntroVideoJob } from '@/server/video/jobs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ACTIVE_STATUSES = ['UPLOADING', 'QUEUED', 'PROCESSING', 'PUBLISHING'];

export async function POST(request) {
  try {
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
    console.error('[course-intro-video-jobs] Create error:', error);

    const message =
      error instanceof Error
        ? error.message
        : 'خطا در ساخت عملیات ویدئوی معرفی.';

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status: message.toLowerCase().includes('not found') ? 404 : 400,
      }
    );
  }
}
