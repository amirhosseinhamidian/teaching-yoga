import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { subDays } from 'date-fns';

export async function GET() {
  try {
    const today = new Date();

    // تولید ۳۰ روز گذشته به‌همراه شروع و پایان روز
    const days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(today, i);
      return {
        date: new Date(date.getFullYear(), date.getMonth(), date.getDate()), // تاریخ فقط با سال، ماه و روز
        dayStart: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        dayEnd: new Date(
          date.getFullYear(),
          date.getMonth(),
          date.getDate() + 1,
        ),
      };
    }).reverse(); // مرتب‌سازی به‌ترتیب از قدیمی‌ترین تا جدیدترین روز

    // دریافت لیست تمامی مقالات برای فیلتر کردن بازدیدها
    const articles = await prismadb.article.findMany({
      select: { shortAddress: true },
    });

    const articleUrls = articles.map(
      (article) => `/articles/${article.shortAddress}`,
    );

    // دریافت تمامی بازدیدهای مربوط به مقالات در ۳۰ روز اخیر
    const visits = await prismadb.visitLog.findMany({
      where: {
        pageUrl: { in: articleUrls },
        visitedAt: {
          gte: days[0].dayStart, // از اولین روز شروع می‌شود
          lt: days[days.length - 1].dayEnd, // تا پایان آخرین روز موردنظر
        },
      },
      select: {
        visitedAt: true,
      },
    });

    // محاسبه تعداد بازدیدهای هر روز
    const visitsByDate = days.map(({ date, dayStart, dayEnd }) => {
      const dayVisits = visits.filter(
        (visit) => visit.visitedAt >= dayStart && visit.visitedAt < dayEnd,
      ).length;

      return {
        date: date.toISOString().split('T')[0], // فرمت خروجی: YYYY-MM-DD
        visits: dayVisits,
      };
    });

    return NextResponse.json(visitsByDate);
  } catch (error) {
    console.error('[VISIT_LOG_ERROR]', error);
    return NextResponse.json(
      { message: 'خطایی در دریافت داده‌ها رخ داده است' },
      { status: 500 },
    );
  }
}
