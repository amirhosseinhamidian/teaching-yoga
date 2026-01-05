import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

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
      { status: 500 }
    );
  }
}
