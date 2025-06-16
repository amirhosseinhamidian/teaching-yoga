import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
  try {
    const { shortAddress } = params;
    const requestHeaders = new Headers(req.headers);
    const userId = requestHeaders.get('userid');

    // دریافت اطلاعات دوره با ترم‌ها و جلسات فعال به همراه ویدیو و صوت
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
                    audio: true,
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

    // تعیین سطح دسترسی برای هر جلسه
    course.courseTerms.forEach((courseTerm) => {
      courseTerm.term.sessions.forEach((session) => {
        const media = session.video || session.audio;

        if (media) {
          if (media.accessLevel === 'PUBLIC') {
            session.access = 'PUBLIC';
          } else if (media.accessLevel === 'REGISTERED') {
            session.access = userId ? 'REGISTERED' : 'NO_ACCESS';
          } else if (media.accessLevel === 'PURCHASED') {
            session.access = userCourse ? 'PURCHASED' : 'NO_ACCESS';
          }
        } else {
          session.access = 'NO_ACCESS';
        }
      });
    });

    return NextResponse.json(course, { status: 200 });
  } catch (error) {
    console.error('Error in course detail API:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
