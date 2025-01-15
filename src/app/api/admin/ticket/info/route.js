import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
export async function GET() {
  try {
    // شمارش تیکت‌های بسته
    const closedTicketsCount = await prismadb.ticket.count({
      where: { status: 'CLOSED' },
    });

    // شمارش تیکت‌های باز
    const openTicketsCount = await prismadb.ticket.count({
      where: { OR: [{ status: 'OPEN' }, { status: 'ANSWERED' }] },
    });

    // شمارش تیکت‌های پاسخ داده نشده (در حال بررسی و در انتظار بررسی)
    const unansweredTicketsCount = await prismadb.ticket.count({
      where: {
        OR: [{ status: 'PENDING' }, { status: 'IN_PROGRESS' }],
      },
    });

    // داده‌های بازگشتی
    const data = {
      closedTickets: closedTicketsCount,
      openTickets: openTicketsCount,
      unansweredTickets: unansweredTicketsCount,
    };

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Error fetching ticket data:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching ticket data.' },
      { status: 500 },
    );
  }
}
