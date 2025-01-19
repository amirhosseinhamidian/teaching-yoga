import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { subDays } from 'date-fns';

export async function GET() {
  try {
    const today = new Date();
    const thirtyDaysAgo = subDays(today, 30);

    // کل فروش
    const totalSales = await prismadb.payment.aggregate({
      _sum: { amount: true },
      where: { status: 'SUCCESSFUL' },
    });

    // فروش در 30 روز گذشته
    const salesLast30Days = await prismadb.payment.aggregate({
      _sum: { amount: true },
      where: {
        status: 'SUCCESSFUL',
        updatedAt: {
          gte: thirtyDaysAgo,
          lte: today,
        },
      },
    });

    // تعداد فروش
    const totalTransactions = await prismadb.payment.count({
      where: { status: 'SUCCESSFUL' },
    });

    // پاسخ API
    return NextResponse.json({
      totalSales: totalSales._sum.amount / 10 || 0,
      salesLast30Days: salesLast30Days._sum.amount / 10 || 0,
      totalTransactions,
    });
  } catch (error) {
    console.error('[SALES_API_ERROR]', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    );
  }
}
