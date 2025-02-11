import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;

    // دریافت پارامترها از URL
    const page = parseInt(searchParams.get('page') || '1', 10); // شماره صفحه، پیش‌فرض: 1
    const perPage = parseInt(searchParams.get('perPage') || '10', 10); // تعداد تیکت‌ها در هر صفحه، پیش‌فرض: 10
    const search = searchParams.get('search') || ''; // رشته جستجو
    const status = searchParams.get('status') || 'ALL'; // وضعیت تیکت، پیش‌فرض: ALL

    // تعریف شرط جستجو
    const searchFilter = {
      OR: [{ title: { contains: search, mode: 'insensitive' } }],
    };

    // تعریف فیلتر وضعیت
    const statusFilter =
      status !== 'ALL'
        ? { status } // اگر وضعیت مشخص شده باشد
        : {}; // اگر وضعیت ALL باشد (همه تیکت‌ها)

    // محاسبه تعداد کل رکوردها (برای pagination)
    const totalTickets = await prismadb.ticket.count({
      where: {
        AND: [statusFilter, searchFilter],
      },
    });

    // دریافت لیست تیکت‌ها با pagination و فیلترها
    const tickets = await prismadb.ticket.findMany({
      where: {
        AND: [statusFilter, searchFilter],
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        course: {
          select: {
            title: true,
          },
        },
      },
      skip: (page - 1) * perPage, // محاسبه offset
      take: perPage, // تعداد رکوردها در هر صفحه
      orderBy: {
        createdAt: 'desc', // مرتب‌سازی بر اساس تاریخ ایجاد
      },
    });

    // بازگشت داده‌ها به همراه اطلاعات pagination
    return NextResponse.json({
      tickets,
      pagination: {
        total: totalTickets,
        page,
        perPage,
        totalPages: Math.ceil(totalTickets / perPage),
      },
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching tickets.' },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    // دریافت id از هدر
    const ticketId = request.headers.get('id');

    // بررسی اینکه id موجود باشد
    if (!ticketId) {
      return NextResponse.json(
        { error: 'Ticket ID is required in the header.' },
        { status: 400 },
      );
    }

    // تبدیل id به عدد و بررسی اینکه معتبر باشد
    const id = parseInt(ticketId, 10);
    if (isNaN(id)) {
      return NextResponse.json(
        { error: 'Invalid Ticket ID. It must be a number.' },
        { status: 400 },
      );
    }

    // استفاده از تراکنش برای حذف پاسخ‌ها و تیکت
    await prismadb.$transaction(async (prisma) => {
      // حذف تمام پاسخ‌های مرتبط با تیکت
      await prisma.ticketReply.deleteMany({
        where: { ticketId: id },
      });

      // حذف خود تیکت
      await prisma.ticket.delete({
        where: { id },
      });
    });

    // بازگشت پاسخ موفق
    return NextResponse.json(
      { message: 'تیکت و پاسخ‌های مرتبط با موفقیت حذف شدند.' },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error deleting ticket and its replies:', error);

    // بررسی ارور اگر تیکت پیدا نشود
    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Ticket not found or already deleted.' },
        { status: 404 },
      );
    }

    // بازگشت خطای عمومی
    return NextResponse.json(
      { error: 'An error occurred while deleting the ticket and its replies.' },
      { status: 500 },
    );
  }
}
