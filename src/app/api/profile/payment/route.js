import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import prismadb from '@/libs/prismadb';
import { authOptions } from '../../auth/[...nextauth]/route';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // احراز هویت کاربر
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.userId) {
      return NextResponse.json(
        { error: 'کاربر احراز هویت نشده است' },
        { status: 401 }, // وضعیت Unauthorized
      );
    }

    // واکشی اطلاعات پرداخت کاربر
    const userId = session.user.userId;

    const payments = await prismadb.payment.findMany({
      where: { userId },
      include: {
        cart: {
          include: {
            cartCourses: {
              include: {
                course: {
                  select: {
                    title: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createAt: 'desc',
      },
    });

    // استخراج اطلاعات مورد نیاز
    const paymentDetails = payments.map((payment) => {
      const courseTitles = payment.cart.cartCourses.map(
        (cartCourse) => cartCourse.course.title,
      );
      return {
        transactionId: payment.transactionId
          ? payment.transactionId.toString() // تبدیل BigInt به String
          : '0', // مقدار پیش‌فرض به صورت String
        courses: courseTitles, // لیست عناوین دوره‌ها
        updatedAt: payment.updatedAt,
        status: payment.status,
        method: payment.method,
        amount: payment.amount,
      };
    });

    return NextResponse.json(paymentDetails);
  } catch (error) {
    console.error('Error fetching payment details:', error);
    return NextResponse.error();
  }
}
