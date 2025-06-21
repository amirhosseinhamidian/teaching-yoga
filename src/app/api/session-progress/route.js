import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export async function GET(request) {
  // دریافت پارامترهای URL
  const { searchParams } = request.nextUrl;
  const shortAddress = searchParams.get('shortAddress');
  const requestHeaders = new Headers(request.headers);
  const userId = requestHeaders.get('userid');
  if (!userId) {
    return NextResponse.json(
      { message: 'User ID is required' },
      { status: 400 },
    );
  }

  if (!shortAddress || !userId) {
    return NextResponse.json(
      { error: 'Course short address and userId are required' },
      { status: 400 },
    );
  }

  try {
    // پیدا کردن دوره با shortAddress
    const course = await prismadb.course.findUnique({
      where: { shortAddress },
      select: {
        id: true,
        title: true,
        courseTerms: {
          // استفاده از CourseTerm برای دریافت ترم‌ها
          include: {
            term: {
              // دریافت ترم‌ها
              include: {
                sessions: {
                  // دریافت جلسات برای هر ترم
                  select: {
                    id: true,
                    order: true,
                    isActive: true,
                    sessionProgress: {
                      where: {
                        userId: userId,
                      },
                      select: {
                        isCompleted: true,
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

    // تعداد کل جلسات فعال
    let totalSessions = 0;
    // تعداد جلسات تکمیل‌شده از بین جلسات فعال
    let completedSessions = 0;

    course.courseTerms.forEach((courseTerm) => {
      const term = courseTerm.term;
      term.sessions.forEach((session) => {
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

    return NextResponse.json({ progress: progressPercentage }, { status: 200 });
  } catch (error) {
    console.error('Error calculating progress:', error);
    return NextResponse.json(
      { error: 'Failed to calculate progress' },
      { status: 500 },
    );
  }
}
