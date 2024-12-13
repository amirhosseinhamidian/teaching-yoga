import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export async function POST(request) {
  try {
    // دریافت داده‌ها از body درخواست
    const {
      title,
      subtitle,
      shortDescription,
      description,
      cover,
      isHighPriority,
      shortAddress,
      sessionCount,
      duration,
      level,
      rating,
      status,
      instructorId,
      introVideoUrl,
    } = await request.json();

    if (
      !title ||
      !subtitle ||
      !description ||
      !cover ||
      !shortAddress ||
      !sessionCount ||
      !duration ||
      !level ||
      !status ||
      !instructorId
    ) {
      return NextResponse.json(
        { error: 'خطا در تکمیل فیلدها' },
        { status: 400 },
      );
    }

    // ایجاد دوره جدید در پایگاه داده
    const newCourse = await prismadb.course.create({
      data: {
        title,
        subtitle,
        shortDescription,
        description,
        cover,
        isHighPriority: isHighPriority || false,
        shortAddress,
        sessionCount,
        duration,
        level,
        rating: rating || 5.0,
        status,
        instructorId,
        introVideoUrl,
      },
    });

    // ارسال پاسخ موفق
    return NextResponse.json({ course: newCourse }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
