import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // احراز هویت با JWT
    const authUser = getAuthUser();
    if (!authUser?.id) {
      return NextResponse.json(
        { error: 'کاربر احراز هویت نشده است' },
        { status: 401 }
      );
    }

    const userId = authUser.id;

    // دریافت پرداخت‌های کاربر
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

    // ساخت خروجی نهایی
    const paymentDetails = payments.map((payment) => {
      const courses =
        payment.cart?.cartCourses?.map((cc) => cc.course.title) || [];

      return {
        transactionId: payment.transactionId?.toString() || '0', // BigInt → string
        courses,
        updatedAt: payment.updatedAt,
        status: payment.status,
        method: payment.method,
        amount: payment.amount,
      };
    });

    return NextResponse.json(paymentDetails, { status: 200 });
  } catch (error) {
    console.error('Error fetching payment details:', error);
    return NextResponse.json({ error: 'خطای سرور' }, { status: 500 });
  }
}
