import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { subDays } from 'date-fns';

export async function GET() {
  try {
    const today = new Date();
    const days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(today, i);
      return {
        dayStart: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        dayEnd: new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate() + 1,
        ),
      };
    }).reverse(); // Reverse to ensure chronological order

    const payments = await prismadb.payment.findMany({
      where: {
        updatedAt: {
          gte: days[0].dayStart,
          lt: days[days.length - 1].dayEnd,
        },
        status: 'SUCCESSFUL',
      },
    });

    const revenueByDate = days.map(({ dayStart, dayEnd }) => {
      const dayRevenue = payments
        .filter(
          (payment) =>
            payment.updatedAt >= dayStart && payment.updatedAt < dayEnd,
        )
        .reduce((total, payment) => total + payment.amount, 0);

      return {
        date: dayStart,
        revenue: dayRevenue / 10,
      };
    });

    return NextResponse.json(revenueByDate);
  } catch (error) {
    console.error('[REVENUE_ERROR]', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    );
  }
}
