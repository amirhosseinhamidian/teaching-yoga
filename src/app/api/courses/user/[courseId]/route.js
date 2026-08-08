import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

import { toAbsoluteMediaUrl } from '@/server/media/absolute-url';

export async function GET(req, { params }) {
  const { courseId } = params;

  const numericCourseId = Number.parseInt(courseId, 10);

  if (!Number.isInteger(numericCourseId) || numericCourseId <= 0) {
    return NextResponse.json(
      {
        success: false,
        message: 'Course ID must be a valid number',
      },
      {
        status: 400,
      }
    );
  }

  try {
    const course = await prismadb.course.findUnique({
      where: {
        id: numericCourseId,
      },

      select: {
        id: true,
        title: true,
        cover: true,
        shortAddress: true,
      },
    });

    if (!course) {
      return NextResponse.json(
        {
          success: false,
          message: 'Course not found',
        },
        {
          status: 404,
        }
      );
    }

    /*
     * DB ممکن است هنوز یکی از این شکل‌ها را داشته باشد:
     *
     * /images/course_covers/...
     * images/course_covers/...
     * https://...
     *
     * toAbsoluteMediaUrl مسئول تبدیل آن
     * به URL نهایی قابل استفاده توسط Client است.
     */
    const cover = course.cover
      ? toAbsoluteMediaUrl(String(course.cover).trim().replace(/^\/+/, ''), {
          allowedRoots: ['images'],
        })
      : null;

    return NextResponse.json(
      {
        success: true,

        data: {
          ...course,
          cover,
        },
      },
      {
        status: 200,

        headers: {
          'Cache-Control': 'private, no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('[GET_USER_COURSE]', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Server error',
      },
      {
        status: 500,
      }
    );
  }
}
