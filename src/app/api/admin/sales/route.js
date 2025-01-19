import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export async function GET(request) {
  try {
    // استخراج پارامترهای query برای pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10); // صفحه فعلی
    const perPage = parseInt(searchParams.get('perPage') || '10', 10); // تعداد موارد در هر صفحه

    // محاسبه مقدار offset
    const skip = (page - 1) * perPage;

    // دریافت تعداد کل رکوردها
    const totalPayments = await prismadb.payment.count();

    // دریافت داده‌های موردنظر با محدودیت و offset
    const payments = await prismadb.payment.findMany({
      skip,
      take: perPage,
      include: {
        user: {
          select: {
            username: true,
            avatar: true,
            firstname: true,
            lastname: true,
            phone: true,
          },
        },
        cart: {
          select: {
            cartCourses: {
              select: {
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
        updatedAt: 'desc', // مرتب‌سازی بر اساس آخرین به‌روزرسانی
      },
    });

    // ساختاردهی داده‌ها
    const formattedPayments = payments.map((payment) => ({
      id: payment.id,
      username: payment.user?.username || '',
      avatar: payment.user?.avatar || '',
      firstname: payment.user?.firstname || '',
      lastname: payment.user?.lastname || '',
      phone: payment.user?.phone || '',
      courses: payment.cart.cartCourses.map(
        (cartCourse) => cartCourse.course.title,
      ),
      method: payment.method,
      status: payment.status,
      transactionId: payment.transactionId
        ? payment.transactionId.toString()
        : '0',
      amount: payment.amount / 10,
      updatedAt: payment.updatedAt,
    }));

    // ارسال پاسخ با اطلاعات pagination
    return NextResponse.json({
      data: formattedPayments,
      meta: {
        total: totalPayments,
        page,
        perPage,
        totalPages: Math.ceil(totalPayments / perPage),
      },
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Something went wrong.' },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    // دریافت داده‌ها از بدنه درخواست
    const { id, status, method } = await request.json();

    // اعتبارسنجی داده‌ها
    if (!id || !status || !method) {
      return NextResponse.json(
        { error: 'All fields (id, status, method) are required.' },
        { status: 400 },
      );
    }

    // بروزرسانی رکورد در جدول payment
    const updatedPayment = await prismadb.payment.update({
      where: { id },
      data: { status, method },
    });

    // بازگرداندن پاسخ موفقیت‌آمیز
    return NextResponse.json({
      message: 'Payment updated successfully.',
      payment: updatedPayment,
    });
  } catch (error) {
    console.error('Error updating payment:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating the payment.' },
      { status: 500 },
    );
  }
}
