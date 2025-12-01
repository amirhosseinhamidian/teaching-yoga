/* eslint-disable no-undef */
import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET;

export async function GET() {
  try {
    // گرفتن توکن از کوکی
    const token = cookies().get('auth_token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // دیکود کردن JWT
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    // پیدا کردن کاربر
    const rawUser = await prismadb.user.findUnique({
      where: { id: decoded.id },
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
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // پردازش cart
    const user = {
      ...rawUser,
      carts: rawUser.carts.map((cart) => {
        const courses = cart.cartCourses.map((c) => c.course);

        const uniqueCourses = Array.from(
          new Map(courses.map((course) => [course.id, course])).values()
        );

        return {
          ...cart,
          uniqueCourses,
        };
      }),
    };

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('GET-ME ERROR:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}
