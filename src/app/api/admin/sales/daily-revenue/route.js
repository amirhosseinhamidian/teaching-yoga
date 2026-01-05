// src/app/api/admin/sales/daily-revenue/route.js
import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { subDays, startOfDay, addDays } from 'date-fns';

function toInt(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : fallback;
}

export async function GET() {
  try {
    const today = new Date();

    // ۳۰ روز اخیر (از 29 روز قبل تا امروز)
    const days = Array.from({ length: 30 }, (_, i) => {
      const d = subDays(today, 29 - i); // قدیمی -> جدید
      const dayStart = startOfDay(d);
      const dayEnd = addDays(dayStart, 1);
      return { dayStart, dayEnd };
    });

    const rangeStart = days[0].dayStart;
    const rangeEnd = days[days.length - 1].dayEnd;

    // ✅ همه پرداخت‌های موفق (برای دوره/اشتراک/فروشگاه/ترکیبی)
    const payments = await prismadb.payment.findMany({
      where: {
        status: 'SUCCESSFUL',
        updatedAt: {
          gte: rangeStart,
          lt: rangeEnd,
        },
      },
      select: {
        updatedAt: true,
        amount: true, // ریال
        kind: true, // DIGITAL | SHOP | BOTH (اختیاری برای دیباگ)
      },
    });

    const revenueByDate = days.map(({ dayStart, dayEnd }) => {
      const dayRevenueRial = payments
        .filter((p) => p.updatedAt >= dayStart && p.updatedAt < dayEnd)
        .reduce((sum, p) => sum + toInt(p.amount, 0), 0);

      return {
        date: dayStart,
        revenue: Math.ceil(dayRevenueRial / 10), // ✅ تومان
      };
    });

    return NextResponse.json(revenueByDate);
  } catch (error) {
    console.error('[REVENUE_ERROR]', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
