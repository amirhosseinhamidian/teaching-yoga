import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;

    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPageRaw = parseInt(searchParams.get('perPage') || '10', 10);
    const perPage = Math.min(Math.max(perPageRaw, 1), 100); // جلوگیری از perPage خیلی بزرگ
    const search = (searchParams.get('search') || '').trim();

    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const skip = (safePage - 1) * perPage;

    const where = search
      ? {
          OR: [
            {
              user: {
                username: { contains: search, mode: 'insensitive' },
              },
            },
            {
              user: {
                phone: { contains: search }, // phone معمولاً عددی/متنیه، mode لازم نیست
              },
            },
          ],
        }
      : {};

    // تعداد کل با فیلتر سرچ
    const totalPayments = await prismadb.payment.count({ where });

    // داده‌ها با pagination + سرچ
    const payments = await prismadb.payment.findMany({
      where,
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
        updatedAt: 'desc',
      },
    });

    const formattedPayments = payments.map((payment) => ({
      id: payment.id,
      username: payment.user?.username || '',
      avatar: payment.user?.avatar || '',
      firstname: payment.user?.firstname || '',
      lastname: payment.user?.lastname || '',
      phone: payment.user?.phone || '',
      courses: payment.cart?.cartCourses?.map((cc) => cc.course.title) || [],
      method: payment.method,
      status: payment.status,
      transactionId: payment.transactionId
        ? String(payment.transactionId)
        : '0',
      amount: payment.amount / 10,
      updatedAt: payment.updatedAt,
    }));

    return NextResponse.json({
      data: formattedPayments,
      meta: {
        total: totalPayments,
        page: safePage,
        perPage,
        totalPages: Math.ceil(totalPayments / perPage),
        search, // (اختیاری) برای دیباگ/نمایش در کلاینت
      },
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Something went wrong.' },
      { status: 500 }
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
        { status: 400 }
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
      { status: 500 }
    );
  }
}
