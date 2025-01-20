import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session?.user || !session.user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.userId;

    // بازیابی تمام دوره‌هایی که کاربر در آن‌ها شرکت کرده
    const userCourses = await prismadb.userCourse.findMany({
      where: { userId },
      select: {
        course: {
          select: {
            id: true,
            title: true,
            cover: true,
            shortAddress: true,
            courseTerms: {
              select: {
                term: {
                  select: {
                    sessions: {
                      select: {
                        id: true,
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

    if (!userCourses || userCourses.length === 0) {
      return NextResponse.json([], { status: 200 });
    }

    // پردازش پیشرفت هر دوره
    const courseProgress = userCourses.map((userCourse) => {
      const course = userCourse.course;

      let totalSessions = 0;
      let completedSessions = 0;

      course.courseTerms.forEach((courseTerm) => {
        courseTerm.term.sessions.forEach((session) => {
          totalSessions += 1;
          if (session.sessionProgress[0]?.isCompleted) {
            completedSessions += 1;
          }
        });
      });

      const progressPercentage =
        totalSessions > 0
          ? Math.ceil((completedSessions / totalSessions) * 100)
          : 0;

      return {
        courseId: course.id,
        courseTitle: course.title,
        courseCover: course.cover,
        shortAddress: course.shortAddress,
        progress: progressPercentage,
      };
    });

    return NextResponse.json(courseProgress, { status: 200 });
  } catch (error) {
    console.error('خطا در بازیابی پیشرفت دوره:', error);
    return NextResponse.json(
      { error: 'بازیابی پیشرفت دوره با شکست مواجه شد' },
      { status: 500 },
    );
  }
}
