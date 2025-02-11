import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

// تابع تبدیل عدد به فرمت K و M
function formatNumber(num) {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return num.toString();
}

export async function GET() {
  try {
    // دریافت لیست تمام مقالات برای بررسی بازدیدها
    const articles = await prismadb.article.findMany({
      select: { shortAddress: true },
    });

    const articleUrls = articles.map(
      (article) => `/articles/${article.shortAddress}`,
    );

    // دریافت تعداد کل بازدیدهای مربوط به مقالات
    const totalVisits = await prismadb.visitLog.count({
      where: {
        pageUrl: { in: articleUrls },
      },
    });

    // دریافت تعداد کل نظرات
    const totalComments = await prismadb.comment.count();

    // دریافت تعداد کل بازدیدهای ۳۰ روز اخیر برای مقالات
    const date30DaysAgo = new Date();
    date30DaysAgo.setDate(date30DaysAgo.getDate() - 30);

    const visitsLast30Days = await prismadb.visitLog.count({
      where: {
        pageUrl: { in: articleUrls },
        visitedAt: {
          gte: date30DaysAgo,
        },
      },
    });

    // دریافت تعداد کل مقالات
    const totalArticles = await prismadb.article.count();

    return NextResponse.json(
      {
        totalVisits: formatNumber(totalVisits),
        totalComments: formatNumber(totalComments),
        visitsLast30Days: formatNumber(visitsLast30Days),
        totalArticles: formatNumber(totalArticles),
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { message: 'خطایی در دریافت اطلاعات رخ داده است', error },
      { status: 500 },
    );
  }
}
