import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
export async function GET() {
  try {
    // دریافت تمام تنظیمات سایت‌مپ
    const sitemapSettings = await prismadb.sitemapSetting.findMany();

    // محاسبه تعداد صفحات
    const pageCount = sitemapSettings.length;

    // پیدا کردن آخرین بروزرسانی
    const lastUpdate = sitemapSettings.reduce((latest, current) => {
      return current.updatedAt > latest ? current.updatedAt : latest;
    }, new Date(0)); // مقدار اولیه برای مقایسه (شروع از قدیمی‌ترین زمان ممکن)

    return NextResponse.json({
      success: true,
      data: {
        pageCount, // تعداد صفحات
        lastUpdate, // آخرین تاریخ بروزرسانی
      },
    });
  } catch (error) {
    console.error('Error fetching sitemap info:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch sitemap info.' },
      { status: 500 },
    );
  }
}
