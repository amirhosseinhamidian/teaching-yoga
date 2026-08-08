import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { toAbsoluteMediaUrl } from '@/server/media/absolute-url';

export async function GET() {
  try {
    const courses = await prismadb.course.findMany({
      select: {
        id: true,
        title: true,
        cover: true,
        users: {
          select: {
            id: true,
          },
        },
        cartCourses: {
          select: {
            cart: {
              select: {
                payment: {
                  select: {
                    amount: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const courseData = courses.map((course) => {
      const totalRegister = course.users.length;

      const totalSale = course.cartCourses.reduce((sum, cartCourse) => {
        return sum + (cartCourse.cart?.payment?.amount || 0);
      }, 0);

      return {
        title: course.title,

        // تبدیل path ذخیره شده به URL کامل
        cover: toAbsoluteMediaUrl(course.cover),

        totalRegister,
        totalSale,
      };
    });

    courseData.sort((a, b) => b.totalRegister - a.totalRegister);

    return NextResponse.json(courseData);
  } catch (error) {
    console.error('Error fetching course data:', error);

    return NextResponse.json(
      { error: 'Failed to fetch course data' },
      { status: 500 }
    );
  }
}
