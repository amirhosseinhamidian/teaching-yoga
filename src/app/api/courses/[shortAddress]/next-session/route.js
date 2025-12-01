import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/getAuthUser';

export async function GET(req, { params }) {
  const { shortAddress } = params;

  const authUser = getAuthUser();
  const userId = authUser?.id || null;

  if (!userId) {
    return NextResponse.json(
      { error: 'User not authenticated.' },
      { status: 401 }
    );
  }

  try {
    // بررسی خرید دوره
    const userCourse = await prismadb.userCourse.findFirst({
      where: {
        userId,
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
                      include: { session: true },
                      orderBy: { session: { order: 'asc' } },
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
        { status: 403 }
      );
    }

    const courseTerms = userCourse.course.courseTerms;

    // تبدیل sessionTerms به sessions[]
    for (const ct of courseTerms) {
      const term = ct.term;

      term.sessions = term.sessionTerms
        .map((st) => st.session)
        .sort((a, b) => a.order - b.order);
    }

    // پیدا کردن اولین جلسه‌ای که کامل نشده
    let nextSession = null;

    for (const courseTerm of courseTerms) {
      for (const session of courseTerm.term.sessions) {
        const isCompleted = await prismadb.sessionProgress.findFirst({
          where: {
            userId,
            sessionId: session.id,
            isCompleted: true,
          },
        });

        if (!isCompleted && session.isActive) {
          nextSession = session;
          break;
        }
      }
      if (nextSession) break;
    }

    // fallback در صورت نبود جلسه کامل نشده
    if (!nextSession) {
      // ۱) اولین جلسه فعال از آخرین ترم
      for (const courseTerm of [...courseTerms].reverse()) {
        const active = courseTerm.term.sessions.find((s) => s.isActive);
        if (active) {
          nextSession = active;
          break;
        }
      }

      // ۲) fallback نهایی: اولین جلسه اولین ترم موجود
      if (!nextSession) {
        const fallback = courseTerms.at(-1)?.term.sessions?.at(0);
        if (fallback) nextSession = fallback;
      }
    }

    return NextResponse.json({
      sessionId: nextSession.id,
    });
  } catch (error) {
    console.error('Next session error:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    );
  }
}
