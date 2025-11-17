import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'شناسه کاربر الزامی است' },
        { status: 400 },
      );
    }

    // گرفتن دوره‌هایی که کاربر خریده
    const userCourses = await prismadb.userCourse.findMany({
      where: { userId },
      select: {
        course: {
          select: {
            id: true,
            title: true,
            cover: true,
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
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!userCourses || userCourses.length === 0) {
      return NextResponse.json(
        { error: 'هیچ دوره‌ای برای کاربر یافت نشد' },
        { status: 404 },
      );
    }

    // محاسبه درصد پیشرفت با ساختار جدید (sessionTerms)
    const courseProgress = userCourses.map((userCourse) => {
      const course = userCourse.course;

      let totalSessions = 0;
      let completedSessions = 0;

      course.courseTerms.forEach((courseTerm) => {
        courseTerm.term.sessionTerms.forEach((st) => {
          const session = st.session;
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
