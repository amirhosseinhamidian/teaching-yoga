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
    // بررسی خرید دوره → (بدون تغییر)
    const userCourse = await prismadb.userCourse.findFirst({
      where: {
        userId: userId,
        course: { shortAddress },
      },
      include: {
        course: {
          include: {
            courseTerms: {
              orderBy: { termId: 'desc' },
              include: {
                term: {
                  include: {
                    sessionTerms: {
                      include: {
                        session: true,
                      },
                      orderBy: {
                        session: {
                          order: 'asc',
                        },
                      },
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

    // 🔄 تبدیل sessionTerms → sessions[]
    for (const ct of courseTerms) {
      const term = ct.term;

      term.sessions = term.sessionTerms
        .map((st) => st.session)
        .sort((a, b) => a.order - b.order);
    }

    // 🔍 جستجوی جلسه بعدی
    let nextSession = null;

    for (const courseTerm of courseTerms) {
      const termSessions = courseTerm.term.sessions;

      for (const session of termSessions) {
        const userSessionProgress = await prismadb.sessionProgress.findFirst({
          where: {
            userId: userId,
            sessionId: session.id,
            isCompleted: true,
          },
        });

        if (!userSessionProgress && session.isActive) {
          nextSession = session;
          break;
        }
      }

      if (nextSession) break;
    }

    // 🔙 اگر جلسه‌ای پیدا نشد → fallback logic
    if (!nextSession) {
      for (const courseTerm of [...courseTerms].reverse()) {
        const activeSession = courseTerm.term.sessions.find((s) => s.isActive);
        if (activeSession) {
          nextSession = activeSession;
          break;
        }
      }

      if (!nextSession && courseTerms.length > 0) {
        const fallbackSession =
          courseTerms.at(-1)?.term.sessions?.at(0);
        if (fallbackSession) nextSession = fallbackSession;
      }
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