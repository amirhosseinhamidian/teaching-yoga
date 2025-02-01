import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export async function GET() {
  try {
    // درخواست به جدول Course برای دریافت لیست دوره‌ها
    const courses = await prismadb.course.findMany({
      select: {
        id: true, // فقط آیدی دوره
        title: true, // عنوان دوره
      },
    });

    const courseOptions = [
      { label: 'همه دوره‌ها', value: -1 }, // مقدار پیش‌فرض
      ...courses.map((course) => ({ label: course.title, value: course.id })), // لیست دوره‌ها
    ];

    // بازگرداندن پاسخ
    return NextResponse.json({
      message: 'داده‌ها با موفقیت دریافت شدند.',
      courseOptions,
    });
  } catch (error) {
    console.error('Error fetching terms and courses:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات.' },
      { status: 500 },
    );
  }
}
