import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
  try {
    const { shortAddress } = params;
    const requestHeaders = new Headers(req.headers);
    const userId = requestHeaders.get('userid');

    // دریافت اطلاعات دوره به همراه ترم‌ها و جلسات فعال
    const course = await prismadb.course.findUnique({
      where: { shortAddress },
      include: {
        courseTerms: {
          include: {
            term: {
              include: {
                sessions: {
                  where: { isActive: true },
                  orderBy: { order: 'asc' },
                  include: {
                    video: true,
                    sessionProgress: {
                      where: { userId },
                      select: { isCompleted: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json(
        { message: 'Course not found' },
        { status: 404 },
      );
    }

    // بررسی وضعیت خرید دوره توسط کاربر
    const userCourse = await prismadb.userCourse.findFirst({
      where: {
        userId,
        courseId: course.id,
        status: 'ACTIVE',
      },
    });

    // افزودن سطح دسترسی برای هر جلسه
    course.courseTerms.forEach((courseTerm) => {
      courseTerm.term.sessions.forEach((session) => {
        const { video } = session;
        if (video) {
          if (video.accessLevel === 'PUBLIC') {
            session.access = 'PUBLIC';
          } else if (video.accessLevel === 'REGISTERED') {
            session.access = userId ? 'REGISTERED' : 'NO_ACCESS';
          } else if (video.accessLevel === 'PURCHASED') {
            session.access = userCourse ? 'PURCHASED' : 'NO_ACCESS';
          }
        }
      });
    });

    return NextResponse.json(course, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
