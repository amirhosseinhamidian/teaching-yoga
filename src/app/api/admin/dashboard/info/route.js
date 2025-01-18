import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // محاسبه اطلاعات دوره‌ها
    const totalActiveCourses = await prismadb.course.count({
      where: { activeStatus: true },
    });

    const totalEnrollments = await prismadb.userCourse.count();

    const totalCompletedVideos = await prismadb.sessionProgress.count({
      where: { isCompleted: true },
    });

    const courseInfos = {
      totalActiveCourses,
      totalEnrollments,
      totalCompletedVideos,
    };

    // محاسبه اطلاعات کاربران
    const totalUsers = await prismadb.user.count();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const totalNewUsersLast30Days = await prismadb.user.count({
      where: {
        createAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    const totalActiveUsersLast30Days = await prismadb.user.count({
      where: {
        updatedAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    const userInfos = {
      totalUsers,
      totalNewUsersLast30Days,
      totalActiveUsersLast30Days,
    };

    // بازگشت پاسخ به کلاینت
    return NextResponse.json({ courseInfos, userInfos });
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching data.' },
      { status: 500 },
    );
  }
}
