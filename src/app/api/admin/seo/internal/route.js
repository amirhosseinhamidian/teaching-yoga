import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

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
      }),
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
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    // واکشی تنظیمات از پایگاه داده
    const settings = await prismadb.seoSetting.findMany({});

    // فیلتر کردن صفحاتی که نامشان 'general' نیست
    const filteredSettings = settings.filter((item) => item.page !== 'general');

    // گروه‌بندی داده‌ها بر اساس page
    const groupedSettings = filteredSettings.reduce((acc, item) => {
      if (!acc[item.page]) {
        acc[item.page] = {};
      }
      acc[item.page][item.key] = item.value;
      return acc;
    }, {});

    // تبدیل آبجکت نهایی به یک آرایه
    const result = Object.entries(groupedSettings).map(([page, values]) => ({
      page,
      values,
    }));

    // مرتب‌سازی از آخر به اول (descending order)
    const sortedResult = result.sort((a, b) => {
      // مثال: اگر بخواهید بر اساس نام صفحه (page) معکوس مرتب کنید
      if (a.page > b.page) return -1; // `b.page` باید قبل از `a.page` بیاید
      if (a.page < b.page) return 1; // `a.page` باید قبل از `b.page` بیاید
      return 0; // مساوی
    });

    return NextResponse.json({ success: true, data: sortedResult });
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
        item.value !== undefined && item.value !== null && item.value !== '',
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
      { status: 500 },
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
        { status: 400 },
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
      { status: 500 },
    );
  }
}
