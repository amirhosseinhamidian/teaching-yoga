import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

function toValues(settings) {
  return settings.reduce((acc, item) => {
    acc[item.key] = item.value;
    return acc;
  }, {});
}

function normalizePage(p) {
  const s = String(p || '').trim();
  if (!s) return '';
  // page باید مثل /courses/mat-yoga باشد
  return s.startsWith('/') ? s : `/${s}`;
}

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const data = await request.json();

    const {
      page, // صفحه‌ای که تنظیمات برای آن ذخیره می‌شود (مثلاً 'courses')
      siteTitle,
      metaDescription,
      keywords,
      ogTitle,
      ogSiteName,
      ogDescription,
      ogUrl,
      ogImage,
      ogImageAlt,
      slug,
      canonicalTag,
      robotsTag,
    } = data;

    // آرایه تنظیمات اولیه
    const seoData = [
      { key: 'siteTitle', value: siteTitle },
      { key: 'metaDescription', value: metaDescription },
      {
        key: 'keywords',
        value:
          Array.isArray(keywords) && keywords.length > 0
            ? JSON.stringify(keywords)
            : null,
      },
      { key: 'ogTitle', value: ogTitle },
      { key: 'ogSiteName', value: ogSiteName },
      { key: 'ogDescription', value: ogDescription },
      { key: 'ogUrl', value: ogUrl },
      { key: 'ogImage', value: ogImage },
      { key: 'ogImageAlt', value: ogImageAlt },
      { key: 'slug', value: slug },
      { key: 'canonicalTag', value: canonicalTag },
      { key: 'robotsTag', value: robotsTag },
    ];

    // فیلتر کردن آیتم‌های خالی
    const filteredSeoData = seoData.filter((item) => item.value);

    // ذخیره آیتم‌های معتبر
    const promises = filteredSeoData.map((item) =>
      prismadb.seoSetting.upsert({
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
      })
    );

    await Promise.all(promises);

    // واکشی تنظیمات ذخیره‌شده
    const savedSettings = await prismadb.seoSetting.findMany({
      where: { page },
    });

    // تبدیل داده‌های واکشی‌شده به یک آبجکت
    const responseData = savedSettings.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      message: 'SEO settings saved successfully.',
      data: responseData, // داده‌های ذخیره‌شده
    });
  } catch (error) {
    console.error('Error saving SEO settings:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to save SEO settings.' },
      { status: 500 }
    );
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const pageRaw = searchParams.get('page') || '';
    const page = normalizePage(pageRaw);

    if (!page) {
      return NextResponse.json(
        { success: false, message: 'page is required.' },
        { status: 400 }
      );
    }

    // 1) تلاش: exact match (اگر برای هر دوره جدا ذخیره کرده باشی)
    let rows = await prismadb.seoSetting.findMany({
      where: { page: pageRaw },
      select: { key: true, value: true },
    });

    if (rows.length) {
      return NextResponse.json({
        success: true,
        data: toValues(rows),
        meta: { resolvedBy: 'exact', page },
      });
    }

    // 3) اگر هیچکدوم نبود
    return NextResponse.json(
      {
        success: false,
        message: 'SEO not found for this page.',
        meta: { page },
      },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error fetching internal SEO:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch SEO settings.' },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const data = await request.json();

    const {
      page,
      siteTitle,
      metaDescription,
      keywords,
      ogTitle,
      ogSiteName,
      ogDescription,
      ogUrl,
      ogImage,
      ogImageAlt,
      slug,
      canonicalTag,
      robotsTag,
    } = data;

    const seoData = [
      { key: 'siteTitle', value: siteTitle },
      { key: 'metaDescription', value: metaDescription },
      {
        key: 'keywords',
        value:
          Array.isArray(keywords) && keywords.length > 0
            ? JSON.stringify(keywords)
            : null,
      },
      { key: 'ogTitle', value: ogTitle },
      { key: 'ogSiteName', value: ogSiteName },
      { key: 'ogDescription', value: ogDescription },
      { key: 'ogUrl', value: ogUrl },
      { key: 'ogImage', value: ogImage },
      { key: 'ogImageAlt', value: ogImageAlt },
      { key: 'slug', value: slug },
      { key: 'canonicalTag', value: canonicalTag },
      { key: 'robotsTag', value: robotsTag },
    ];

    // فیلتر کردن آیتم‌های خالی
    const filteredSeoData = seoData.filter(
      (item) =>
        item.value !== undefined && item.value !== null && item.value !== ''
    );

    const promises = filteredSeoData.map(async (item) => {
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

    await Promise.all(promises);

    const savedSettings = await prismadb.seoSetting.findMany({
      where: { page },
    });

    // تبدیل داده‌های واکشی‌شده به یک آبجکت
    const responseData = savedSettings.reduce((acc, item) => {
      acc[item.key] = item.value;
      return acc;
    }, {});

    return NextResponse.json({
      success: true,
      message: 'SEO settings updated successfully.',
      data: responseData,
    });
  } catch (error) {
    console.error('Error updating SEO settings:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update SEO settings.' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    // دریافت پارامتر `page` از Query String
    const { searchParams } = request.nextUrl;
    const page = searchParams.get('page');

    // بررسی وجود مقدار page
    if (!page) {
      return NextResponse.json(
        { success: false, message: 'Page parameter is required.' },
        { status: 400 }
      );
    }

    // حذف تمام رکوردهایی که page مشابه دارند
    await prismadb.seoSetting.deleteMany({
      where: { page },
    });

    return NextResponse.json({
      success: true,
      message: `All records with page "${page}" have been deleted.`,
    });
  } catch (error) {
    console.error('Error deleting SEO settings:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete SEO settings.' },
      { status: 500 }
    );
  }
}
