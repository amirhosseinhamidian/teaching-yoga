import { NextResponse } from 'next/server';

import prismadb from '@/libs/prismadb';
import { createVideoJob } from '@/server/video/jobs';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_ACCESS_LEVELS = ['PUBLIC', 'REGISTERED', 'PURCHASED'];

const ACTIVE_JOB_STATUSES = ['UPLOADING', 'QUEUED', 'PROCESSING', 'PUBLISHING'];

export async function POST(request) {
  try {
    const body = await request.json();

    const sessionId =
      typeof body?.sessionId === 'string' ? body.sessionId.trim() : '';

    const termId = Number(body?.termId);

    const accessLevel =
      typeof body?.accessLevel === 'string'
        ? body.accessLevel.trim().toUpperCase()
        : '';

    if (!sessionId) {
      return NextResponse.json(
        {
          success: false,
          error: 'شناسه جلسه معتبر نیست.',
        },
        {
          status: 400,
        }
      );
    }

    if (!Number.isInteger(termId) || termId <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'شناسه ترم معتبر نیست.',
        },
        {
          status: 400,
        }
      );
    }

    if (!ALLOWED_ACCESS_LEVELS.includes(accessLevel)) {
      return NextResponse.json(
        {
          success: false,
          error: 'سطح دسترسی ویدئو معتبر نیست.',
        },
        {
          status: 400,
        }
      );
    }

    /*
     * جلوگیری از ساخت دو Job فعال برای یک جلسه.
     * اگر آپلود قبلی هنوز باز باشد، همان Job به کلاینت
     * برگردانده می‌شود تا امکان Resume یا Cancel داشته باشیم.
     */
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
    const message =
      error instanceof Error
        ? error.message
        : 'خطا در ساخت عملیات پردازش ویدئو.';

    console.error('[admin-video-jobs] Create job error:', error);

    const status = message.toLowerCase().includes('not found') ? 404 : 400;

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      {
        status,
      }
    );
  }
}
