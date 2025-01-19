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
    }).reverse(); // ترتیب به صورت تاریخی

    const visitLogs = await prismadb.visitLog.findMany({
      where: {
        visitedAt: {
          gte: days[0].dayStart,
          lt: days[days.length - 1].dayEnd,
        },
      },
    });

    const visitsByDate = days.map(({ dayStart, dayEnd }) => {
      const dayVisits = visitLogs.filter(
        (visit) => visit.visitedAt >= dayStart && visit.visitedAt < dayEnd,
      ).length;

      return {
        date: dayStart,
        visits: formatNumber(dayVisits), // فرمت تعداد بازدیدها
      };
    });

    return NextResponse.json(visitsByDate);
  } catch (error) {
    console.error('[VISIT_LOG_ERROR]', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 },
    );
  }
}

// تابع برای فرمت کردن تعداد بازدیدها
function formatNumber(num) {
  if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(1) + 'm';
  } else if (num >= 1_000) {
    return (num / 1_000).toFixed(1) + 'k';
  }
  return num.toString();
}
