import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export async function POST(request) {
  try {
    const data = await request.json();

    const {
      siteTitle,
      metaDescription,
      keywords,
      ogTitle,
      ogSiteName,
      ogDescription,
      ogUrl,
      ogImage,
      ogImageAlt,
      canonicalTag,
      robotsTag,
    } = data;

    const page = 'general'; // صفحه‌ای که تنظیمات برای آن ذخیره می‌شود (برای سئو جنرال)

    // آرایه‌ای از مقادیر برای ذخیره
    const seoData = [
      { key: 'siteTitle', value: siteTitle },
      { key: 'metaDescription', value: metaDescription },
      { key: 'keywords', value: keywords },
      { key: 'ogTitle', value: ogTitle },
      { key: 'ogSiteName', value: ogSiteName },
      { key: 'ogDescription', value: ogDescription },
      { key: 'ogUrl', value: ogUrl },
      { key: 'ogImage', value: ogImage },
      { key: 'ogImageAlt', value: ogImageAlt },
      { key: 'canonicalTag', value: canonicalTag },
      { key: 'robotsTag', value: robotsTag },
    ];

    // ذخیره داده‌ها به صورت تکی در دیتابیس
    const promises = seoData.map(async (item) => {
      return prismadb.seoSetting.upsert({
        where: {
          page_key: {
            page,
            key: item.key,
          },
        },
        update: {
          value: item.value,
        },
        create: {
          page,
          key: item.key,
          value: item.value,
        },
      });
    });

    // اجرای تمام عملیات به صورت همزمان
    await Promise.all(promises);

    return NextResponse.json({
      success: true,
      message: 'SEO settings saved successfully.',
    });
  } catch (error) {
    console.error('Error saving SEO settings:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save SEO settings.' },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const page = 'general'; // صفحه مورد نظر برای واکشی تنظیمات

    const settings = await prismadb.seoSetting.findMany({
      where: { page },
    });

    // تبدیل آرایه تنظیمات به یک آبجکت
    const seoSettings = settings.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {});

    return NextResponse.json({ success: true, data: seoSettings });
  } catch (error) {
    console.error('Error fetching SEO settings:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch SEO settings.' },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();

    const {
      siteTitle,
      metaDescription,
      keywords,
      ogTitle,
      ogSiteName,
      ogDescription,
      ogUrl,
      ogImage,
      ogImageAlt,
      canonicalTag,
      robotsTag,
    } = data;

    const page = 'general'; // صفحه‌ای که تنظیمات برای آن ذخیره می‌شود

    // آرایه‌ای از مقادیر برای ذخیره یا به‌روزرسانی
    const seoData = [
      { key: 'siteTitle', value: siteTitle },
      { key: 'metaDescription', value: metaDescription },
      { key: 'keywords', value: JSON.stringify(keywords) }, // تبدیل کلمات کلیدی به JSON برای ذخیره
      { key: 'ogTitle', value: ogTitle },
      { key: 'ogSiteName', value: ogSiteName },
      { key: 'ogDescription', value: ogDescription },
      { key: 'ogUrl', value: ogUrl },
      { key: 'ogImage', value: ogImage },
      { key: 'ogImageAlt', value: ogImageAlt },
      { key: 'canonicalTag', value: canonicalTag },
      { key: 'robotsTag', value: robotsTag },
    ];

    // ذخیره داده‌ها به صورت تکی در دیتابیس
    const promises = seoData.map(async (item) => {
      return prismadb.seoSetting.upsert({
        where: {
          page_key: {
            page,
            key: item.key,
          },
        },
        update: {
          value: item.value,
        },
        create: {
          page,
          key: item.key,
          value: item.value,
        },
      });
    });

    // اجرای تمام عملیات به صورت همزمان
    await Promise.all(promises);

    return NextResponse.json({
      success: true,
      message: 'SEO settings updated successfully.',
    });
  } catch (error) {
    console.error('Error updating SEO settings:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update SEO settings.' },
      { status: 500 },
    );
  }
}
