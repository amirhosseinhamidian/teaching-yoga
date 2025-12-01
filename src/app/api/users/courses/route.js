import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';

export async function POST(request) {
  try {
    // ✅ احراز هویت توسط JWT در کوکی
    const authUser = getAuthUser();
    if (!authUser?.id) {
      return NextResponse.json(
        { error: 'کاربر احراز هویت نشده است' },
        { status: 401 } // Unauthorized
      );
    }

    const userId = authUser.id;

    // 📥 دریافت داده‌های ورودی از درخواست
    const body = await request.json();
    const { courseIds, cartId } = body;

    // 🧪 بررسی ورودی‌ها
    if (!cartId || !Array.isArray(courseIds) || courseIds.length === 0) {
      return NextResponse.json(
        {
          error: 'شناسه سبد خرید و لیست شناسه دوره‌ها الزامی است.',
        },
        { status: 400 }
      );
    }

    // 🔎 بررسی وجود کاربر (اختیاری ولی خوبه)
    const user = await prismadb.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'کاربر یافت نشد.' }, { status: 404 });
    }

    // 🔎 بررسی وجود سبد خرید و مالک بودن آن
    const cart = await prismadb.cart.findUnique({
      where: { id: cartId },
    });

    if (!cart || cart.userId !== userId) {
      return NextResponse.json(
        { error: 'سبد خرید معتبر نیست یا متعلق به این کاربر نیست.' },
        { status: 400 }
      );
    }

    if (cart.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'این سبد خرید قبلاً تکمیل شده است.' },
        { status: 400 }
      );
    }

    // ✅ به‌روزرسانی وضعیت سبد خرید به COMPLETED
    await prismadb.cart.update({
      where: { id: cartId },
      data: { status: 'COMPLETED' },
    });

    // 🧾 متغیر برای نگه‌داشتن نتایج موفق و خطاها
    const results = {
      success: [],
      failed: [],
    };

    // 🔁 پردازش دوره‌ها
    for (const courseId of courseIds) {
      try {
        // وجود دوره
        const course = await prismadb.course.findUnique({
          where: { id: courseId },
          select: { id: true },
        });

        if (!course) {
          results.failed.push({ courseId, error: 'دوره یافت نشد' });
          continue;
        }

        // آیا قبلاً این دوره برای کاربر ثبت شده؟
        const existingRecord = await prismadb.userCourse.findUnique({
          where: {
            userId_courseId: {
              userId,
              courseId,
            },
          },
        });

        if (existingRecord) {
          results.failed.push({
            courseId,
            error: 'شما قبلاً در این دوره ثبت‌نام کرده‌اید',
          });
          continue;
        }

        // ✍ ثبت دوره برای کاربر
        const userCourse = await prismadb.userCourse.create({
          data: {
            userId,
            courseId,
          },
        });

        results.success.push({ courseId, userCourse });
      } catch (error) {
        console.error(`خطا در ثبت دوره ${courseId} برای کاربر:`, error);
        results.failed.push({ courseId, error: 'خطا در ثبت دوره' });
      }
    }

    // 💳 ایجاد / به‌روزرسانی رکورد Payment برای این cart
    const payment = await prismadb.payment.upsert({
      where: { cartId },
      update: {
        amount: 0,
        status: 'SUCCESSFUL',
        method: 'FREE',
      },
      create: {
        userId,
        cartId,
        amount: 0,
        status: 'SUCCESSFUL',
        method: 'FREE',
      },
    });

    // ✨ پاسخ نهایی
    return NextResponse.json(
      {
        message: 'پردازش دوره‌ها و پرداخت تکمیل شد.',
        paymentId: payment.id,
        results,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('خطا در ثبت دوره‌ها و پرداخت:', error);
    return NextResponse.json(
      {
        error: 'ثبت دوره‌ها و پرداخت با شکست مواجه شد.',
      },
      { status: 500 }
    );
  }
}
