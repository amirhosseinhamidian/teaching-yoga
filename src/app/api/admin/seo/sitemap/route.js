/* eslint-disable no-undef */
import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export async function POST(request) {
  try {
    // دریافت داده‌های ارسال‌شده از سمت کلاینت
    const body = await request.json();
    const { section, changefreq, priority, shortAddress } = body;

    // اعتبارسنجی داده‌های ورودی
    if (!section || !changefreq || !priority) {
      return NextResponse.json(
        { success: false, message: 'تمامی فیلدها الزامی هستند.' },
        { status: 400 },
      );
    }

    // ذخیره یا به‌روزرسانی رکورد
    const result = await prismadb.sitemapSetting.upsert({
      where: {
        section,
      },
      update: {
        changefreq,
        priority,
        shortAddress,
      },
      create: {
        section,
        changefreq,
        priority,
        shortAddress,
      },
    });

    // پاسخ موفقیت‌آمیز
    return NextResponse.json({
      success: true,
      message: 'تنظیمات سایت‌مپ با موفقیت ذخیره شد.',
      data: result,
    });
  } catch (error) {
    console.error('Error saving sitemap settings:', error);
    return NextResponse.json(
      { success: false, message: 'خطایی در ذخیره تنظیمات سایت‌مپ رخ داد.' },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    // واکشی تنظیمات سایت‌مپ از دیتابیس
    const settings = await prismadb.sitemapSetting.findMany();

    // ایجاد لیست URLها از داده‌ها
    const urls = settings.map((item) => {
      const loc = (() => {
        if (item.section === 'home') {
          return process.env.NEXT_PUBLIC_API_BASE_URL;
        } else if (item.section === 'course' || item.section === 'article') {
          if (!item.shortAddress) {
            throw new Error(
              `shortAddress is required for section ${item.section}`,
            );
          }
          return `${process.env.NEXT_PUBLIC_API_BASE_URL}/${item.section}/${item.shortAddress}`;
        } else {
          return `${process.env.NEXT_PUBLIC_API_BASE_URL}/${item.section}`;
        }
      })();

      const lastmod = item.updatedAt.toISOString().split('T')[0];
      const changefreq = item.changefreq;
      const priority = item.priority;

      return `
        <url>
          <loc>${loc}</loc>
          <lastmod>${lastmod}</lastmod>
          <changefreq>${changefreq}</changefreq>
          <priority>${priority}</priority>
        </url>
      `;
    });

    // تولید ساختار XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        ${urls.join('')}
      </urlset>`;

    // بازگشت سایت‌مپ به عنوان پاسخ
    return new Response(sitemap, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return NextResponse.json(
      { success: false, message: 'خطایی در تولید سایت‌ مپ رخ داد.' },
      { status: 500 },
    );
  }
}
