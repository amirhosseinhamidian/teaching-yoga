import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export async function GET(request) {
  const { searchParams } = request.nextUrl;
  const page = searchParams.get('page');
  try {
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
