import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const authUser = getAuthUser();
    const userId = authUser?.id || null;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // دریافت دوره‌های کاربر همراه با ترم‌ها و جلسات
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
                    sessionTerms: {
                      select: {
                        session: {
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
        const term = courseTerm.term;

        const sessions =
          term.sessionTerms?.map((st) => st.session).filter(Boolean) || [];

        sessions.forEach((session) => {
          totalSessions += 1;
          if (session.sessionProgress?.[0]?.isCompleted) {
            completedSessions += 1;
          }
        });
      });

      const progress =
        totalSessions > 0
          ? Math.ceil((completedSessions / totalSessions) * 100)
          : 0;

      return {
        courseId: course.id,
        courseTitle: course.title,
        courseCover: course.cover,
        shortAddress: course.shortAddress,
        progress,
      };
    });

    return NextResponse.json(courseProgress, { status: 200 });
  } catch (error) {
    console.error('Course progress error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course progress.' },
      { status: 500 }
    );
  }
}
