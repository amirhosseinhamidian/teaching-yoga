import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export async function POST(request) {
  try {
    // دریافت داده‌های ورودی
    const body = await request.json();
    const { userId, courseId, amount, paymentMethod } = body;

    // بررسی ورودی‌ها
    if (!userId || !courseId || !paymentMethod) {
      return NextResponse.json(
        { error: ' دوره و روش پرداخت الزامی است' },
        { status: 400 },
      );
    }

    // بررسی وجود کاربر
    const user = await prismadb.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'کاربر یافت نشد' }, { status: 404 });
    }

    // بررسی وجود دوره
    const course = await prismadb.course.findUnique({
      where: { id: courseId },
    });
    if (!course) {
      return NextResponse.json({ error: 'دوره یافت نشد' }, { status: 404 });
    }

    // بررسی اینکه کاربر قبلاً این دوره را ثبت نکرده باشد
    const existingRecord = await prismadb.userCourse.findUnique({
      where: {
        userId_courseId: { userId, courseId },
      },
    });

    if (existingRecord) {
      return NextResponse.json(
        { error: 'کاربر قبلاً در این دوره ثبت‌نام کرده است' },
        { status: 400 },
      );
    }

    // بررسی سبد خرید کاربر
    const cart = await prismadb.cart.create({
      data: { userId, status: 'COMPLETED', totalPrice: 0 },
    });

    // اضافه کردن دوره به سبد خرید
    await prismadb.cartCourse.create({
      data: { cartId: cart.id, courseId },
    });

    // به‌روزرسانی مبلغ سبد خرید
    await prismadb.cart.update({
      where: { id: cart.id },
      data: { totalPrice: (cart.totalPrice || 0) + amount },
    });

    // ثبت پرداخت برای سبد خرید
    await prismadb.payment.create({
      data: {
        userId,
        cartId: cart.id,
        amount,
        status: 'SUCCESSFUL',
        method: paymentMethod,
      },
    });

    // ثبت دوره برای کاربر
    const userCourse = await prismadb.userCourse.create({
      data: {
        userId: userId,
        courseId: courseId,
      },
    });

    return NextResponse.json(
      {
        message: 'دوره با موفقیت ثبت شد و پرداخت ایجاد شد',
        userCourse,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('خطا در ثبت دوره و پرداخت:', error);
    return NextResponse.json(
      { error: 'مشکلی در ثبت دوره و پرداخت پیش آمد' },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json();
    const { userId, courseId } = body;

    if (!userId || !courseId) {
      return NextResponse.json(
        {
          error: 'شناسه کاربر و شناسه دوره الزامی است',
        },
        { status: 400 },
      );
    }

    // حذف اطلاعات از جدول sessionProgress
    await prismadb.sessionProgress.deleteMany({
      where: {
        userId: userId,
        session: {
          term: {
            courseTerms: {
              some: {
                courseId: courseId,
              },
            },
          },
        },
      },
    });

    // حذف اطلاعات از جدول userCourse
    await prismadb.userCourse.delete({
      where: {
        userId_courseId: {
          userId: userId,
          courseId: courseId,
        },
      },
    });

    return NextResponse.json(
      {
        message: 'اطلاعات دوره برای کاربر با موفقیت حذف شد',
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('خطا در حذف اطلاعات دوره:', error);
    return NextResponse.json(
      {
        error: 'حذف اطلاعات دوره با شکست مواجه شد',
      },
      { status: 500 },
    );
  }
}
