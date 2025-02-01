import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.userId) {
      return NextResponse.json(
        { error: 'کاربر احراز هویت نشده است' },
        { status: 401 }, // وضعیت Unauthorized
      );
    }
    const userId = session.user.userId;
    // دریافت داده‌های ورودی از درخواست
    const body = await request.json();
    const { courseIds, cartId } = body;

    // بررسی ورودی‌ها
    if (!cartId || !Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json(
        {
          error: 'شناسه کاربر، شناسه سبد خرید و لیست شناسه دوره‌ها الزامی است',
        },
        { status: 400 },
      );
    }

    // بررسی وجود کاربر
    const user = await prismadb.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: 'کاربر یافت نشد',
        },
        { status: 404 },
      );
    }

    // بررسی وجود سبد خرید
    const cart = await prismadb.cart.findUnique({
      where: { id: cartId },
    });

    if (!cart || cart.status !== 'PENDING') {
      return NextResponse.json(
        {
          error: 'سبد خرید معتبر نیست یا قبلاً تکمیل شده است',
        },
        { status: 400 },
      );
    }

    // به‌روزرسانی وضعیت سبد خرید به COMPLETED
    await prismadb.cart.update({
      where: { id: cartId },
      data: { status: 'COMPLETED' },
    });

    // متغیر برای نگه‌داشتن نتایج موفق و خطاها
    const results = {
      success: [],
      failed: [],
    };

    // پردازش دوره‌ها
    for (const courseId of courseIds) {
      try {
        // بررسی وجود دوره
        const course = await prismadb.course.findUnique({
          where: { id: courseId },
        });

        if (!course) {
          results.failed.push({ courseId, error: 'دوره یافت نشد' });
          continue;
        }

        // بررسی اینکه کاربر قبلاً این دوره را ثبت نکرده باشد
        const existingRecord = await prismadb.userCourse.findUnique({
          where: {
            userId_courseId: {
              userId: userId,
              courseId: courseId,
            },
          },
        });

        if (existingRecord) {
          results.failed.push({
            courseId,
            error: 'شما قبلاً در این دوره ثبت‌نام کرده اید',
          });
          continue;
        }

        // ثبت دوره برای کاربر
        const userCourse = await prismadb.userCourse.create({
          data: {
            userId: userId,
            courseId: courseId,
          },
        });

        results.success.push({ courseId, userCourse });
      } catch (error) {
        console.error(`خطا در ثبت دوره ${courseId} برای کاربر:`, error);
        results.failed.push({ courseId, error: 'خطا در ثبت دوره' });
      }
    }

    // ایجاد رکورد جدید در جدول Payment
    const payment = await prismadb.payment.upsert({
      where: { cartId }, // چک می‌کند که آیا این cartId قبلاً ثبت شده است یا نه
      update: {
        amount: 0, // مبلغ پرداختی
        status: 'SUCCESSFUL', // وضعیت پرداخت
        method: 'FREE', // روش پرداخت
      },
      create: {
        userId: userId,
        cartId: cartId,
        amount: 0, // مبلغ پرداختی
        status: 'SUCCESSFUL', // وضعیت پرداخت
        method: 'FREE', // روش پرداخت
      },
    });

    // بازگرداندن پاسخ
    return NextResponse.json(
      {
        message: 'پردازش دوره‌ها و پرداخت تکمیل شد',
        paymentId: payment.id,
        results,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('خطا در ثبت دوره‌ها و پرداخت:', error);
    return NextResponse.json(
      {
        error: 'ثبت دوره‌ها و پرداخت با شکست مواجه شد',
      },
      { status: 500 },
    );
  }
}
