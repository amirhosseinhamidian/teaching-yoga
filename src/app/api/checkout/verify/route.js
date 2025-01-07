/* eslint-disable no-undef */
import { verifyPayment } from '@/app/actions/zarinpal';
import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

export const GET = async (req) => {
  const { searchParams } = req.nextUrl;
  const authority = searchParams.get('Authority');
  const status = searchParams.get('Status');

  if (!authority) {
    return NextResponse.json(
      { error: 'Authority parameter is required.' },
      { status: 400 },
    );
  }

  try {
    const paymentRecord = await prismadb.payment.findUnique({
      where: { authority },
    });

    if (!paymentRecord) {
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/complete-payment?token=error-not-found&status=${status}`,
      );
    }

    const payment = await verifyPayment({
      amountInRial: paymentRecord.amount,
      authority,
    });

    if (![100, 101].includes(payment.data.code)) {
      await prismadb.payment.update({
        where: { authority },
        data: { status: 'FAILED' },
      });

      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/complete-payment?token=error-payment-failed&status=${status}`,
      );
    }

    // ذخیره ref_id به عنوان transactionId
    const updatedPayment = await prismadb.payment.update({
      where: { authority },
      data: {
        status: 'SUCCESSFUL',
        transactionId: payment.data.ref_id,
      },
    });

    // به‌روزرسانی وضعیت سبد خرید
    await prismadb.cart.update({
      where: { id: updatedPayment.cartId },
      data: {
        status: 'COMPLETED',
      },
    });

    // دریافت اطلاعات سبد خرید و دوره‌های موجود در آن
    const cart = await prismadb.cart.findUnique({
      where: { id: updatedPayment.cartId },
      include: {
        cartCourses: {
          include: {
            course: true,
          },
        },
      },
    });

    // بررسی صحت یافتن سبد خرید
    if (!cart) {
      throw new Error('Cart not found');
    }

    // استخراج دوره‌ها از cartCourses
    const courses = cart.cartCourses.map((cartCourse) => cartCourse.course);

    // اضافه کردن دوره‌ها به کاربر
    for (const course of courses) {
      await prismadb.userCourse.upsert({
        where: {
          userId_courseId: {
            userId: paymentRecord.userId,
            courseId: course.id,
          },
        },
        update: {}, // در صورت موجود بودن فقط آپدیت انجام نمی‌شود
        create: {
          userId: paymentRecord.userId,
          courseId: course.id,
        },
      });
    }

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/complete-payment?token=${updatedPayment.id}&status=${status}`,
    );
  } catch (error) {
    console.error('Error verifying payment:', error.message);

    await prismadb.payment.update({
      where: { authority },
      data: { status: 'FAILED' },
    });

    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/complete-payment?token=error-something-went-wrong&status=NOK`,
    );
  }
};
