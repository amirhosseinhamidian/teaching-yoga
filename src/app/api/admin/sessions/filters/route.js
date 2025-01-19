import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export async function GET() {
  try {
    // درخواست به جدول Term برای دریافت لیست ترم‌ها
    const terms = await prismadb.term.findMany({
      select: {
        id: true, // فقط آیدی ترم
        name: true, // نام ترم
      },
    });

    // درخواست به جدول Course برای دریافت لیست دوره‌ها
    const courses = await prismadb.course.findMany({
      select: {
        id: true, // فقط آیدی دوره
        title: true, // عنوان دوره
      },
    });

    // قالب‌بندی داده‌ها
    const termOptions = [
      { label: 'همه ترم‌ها', value: -1 }, // مقدار پیش‌فرض
      ...terms.map((term) => ({ label: term.name, value: term.id })), // لیست ترم‌ها
    ];

    const courseOptions = [
      { label: 'همه دوره‌ها', value: -1 }, // مقدار پیش‌فرض
      ...courses.map((course) => ({ label: course.title, id: course.id })), // لیست دوره‌ها
    ];

    // بازگرداندن پاسخ
    return NextResponse.json({
      message: 'داده‌ها با موفقیت دریافت شدند.',
      termOptions,
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
