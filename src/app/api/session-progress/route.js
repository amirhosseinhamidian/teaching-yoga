import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export async function GET(request) {
  const { searchParams } = request.nextUrl;
  const shortAddress = searchParams.get('shortAddress');
  const requestHeaders = new Headers(request.headers);
  const userId = requestHeaders.get('userid');

  if (!userId) {
    return NextResponse.json(
      { message: 'User ID is required' },
      { status: 400 }
    );
  }

  if (!shortAddress) {
    return NextResponse.json(
      { error: 'Course short address is required' },
      { status: 400 }
    );
  }

  try {
    // دریافت ترم‌های دوره + دریافت جلسات هر ترم از طریق SessionTerm
    const course = await prismadb.course.findUnique({
      where: { shortAddress },
      select: {
        id: true,
        title: true,
        courseTerms: {
          include: {
            term: {
              include: {
                sessionTerms: {
                  include: {
                    session: {
                      select: {
                        id: true,
                        order: true,
                        isActive: true,
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
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    let totalSessions = 0;
    let completedSessions = 0;

    // پردازش ترم‌ها و جلسات
    course.courseTerms.forEach((courseTerm) => {
      const term = courseTerm.term;

      term.sessionTerms.forEach((sessionTerm) => {
        const session = sessionTerm.session;

        if (session.isActive) {
          totalSessions += 1;

          if (session.sessionProgress[0]?.isCompleted) {
            completedSessions += 1;
          }
        }
      });
    });

    const progressPercentage =
      totalSessions > 0
        ? Math.ceil((completedSessions / totalSessions) * 100)
        : 0;

    return NextResponse.json(
      { progress: progressPercentage },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error calculating progress:', error);
    return NextResponse.json(
      { error: 'Failed to calculate progress' },
      { status: 500 }
    );
  }
}
