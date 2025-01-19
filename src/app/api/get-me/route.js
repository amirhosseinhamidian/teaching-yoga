import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const rawUser = await prismadb.user.findUnique({
      where: { id: session.user.userId },
      include: {
        questions: true,
        comments: true,
        courses: true,
        carts: {
          include: {
            cartCourses: {
              include: {
                course: {
                  select: {
                    id: true,
                    title: true,
                    cover: true,
                    shortAddress: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!rawUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // پردازش داده‌های سبد خرید
    const user = {
      ...rawUser,
      carts: (rawUser.carts || []).map((cart) => {
        // استخراج فقط دوره‌ها از cartCourses
        const courses = cart.cartCourses.map((cartCourse) => cartCourse.course);

        const uniqueCourses = Array.from(
          new Map(courses.map((course) => [course.id, course])).values(),
        );

        return {
          ...cart,
          uniqueCourses, // اضافه کردن لیست دوره‌های یکتا
        };
      }),
    };
    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
