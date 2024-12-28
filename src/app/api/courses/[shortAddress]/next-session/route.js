import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prismadb from '@/libs/prismadb';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
  const { shortAddress } = params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.userId || null;

  if (!userId) {
    return NextResponse.json(
      { error: 'User not authenticated.' },
      { status: 401 },
    );
  }

  try {
    // بررسی اینکه آیا کاربر دوره را خریداری کرده است
    const userCourse = await prismadb.userCourse.findFirst({
      where: {
        userId: userId,
        course: { shortAddress },
      },
      include: {
        course: {
          include: {
            courseTerms: {
              orderBy: { termId: 'desc' }, // مرتب‌سازی ترم‌ها به ترتیب نزولی
              include: {
                term: {
                  include: {
                    sessions: {
                      orderBy: { order: 'asc' }, // مرتب‌سازی جلسات به ترتیب صعودی
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!userCourse) {
      return NextResponse.json(
        { error: 'User has not purchased this course.' },
        { status: 403 },
      );
    }

    const courseTerms = userCourse.course.courseTerms;

    // جستجو در ترم‌ها و جلسات برای یافتن جلسه بعدی
    let nextSession = null;

    for (const courseTerm of courseTerms) {
      const termSessions = courseTerm.term.sessions;

      for (let i = 0; i < termSessions.length; i++) {
        const session = termSessions[i];

        // بررسی وضعیت تکمیل جلسه
        const userSessionProgress = await prismadb.sessionProgress.findFirst({
          where: {
            userId: userId,
            sessionId: session.id,
            isCompleted: true,
          },
        });

        // بررسی اینکه جلسه اکتیو هست یا نه
        if (!userSessionProgress && session.isActive) {
          nextSession = session;
          break;
        }
      }

      if (nextSession) {
        break;
      }
    }

    if (!nextSession) {
      return NextResponse.json(
        { error: 'No next session found.' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      sessionId: nextSession.id,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 },
    );
  }
}
