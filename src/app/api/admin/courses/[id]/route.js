import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
  const { id } = params;

  // بررسی معتبر بودن ID
  if (!id || isNaN(parseInt(id, 10))) {
    return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
  }

  try {
    const courseId = parseInt(id, 10);

    // گرفتن اطلاعات دوره با استفاده از Prisma
    const course = await prismadb.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // ارسال اطلاعات دوره
    return NextResponse.json(course, { status: 200 });
  } catch (error) {
    console.error('Error fetching course:', error);

    return NextResponse.json(
      { error: 'An error occurred while fetching the course' },
      { status: 500 },
    );
  }
}

export async function PUT(request, { params }) {
  const { id } = params;

  // دریافت داده‌های جدید از بدن درخواست (body)
  const {
    title,
    subtitle,
    shortDescription,
    description,
    cover,
    price,
    basePrice,
    isHighPriority,
    shortAddress,
    sessionCount,
    duration,
    level,
    status,
    instructorId,
    introVideoUrl,
  } = await request.json();

  // بررسی معتبر بودن ID
  if (!id || isNaN(parseInt(id, 10))) {
    return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
  }

  try {
    const courseId = parseInt(id, 10);

    // به‌روزرسانی اطلاعات دوره با استفاده از Prisma
    const updatedCourse = await prismadb.course.update({
      where: { id: courseId },
      data: {
        title,
        subtitle,
        shortDescription,
        description,
        cover,
        price,
        basePrice,
        isHighPriority: isHighPriority,
        shortAddress,
        sessionCount,
        duration,
        level,
        status,
        instructorId,
        introVideoUrl,
      },
    });

    // ارسال اطلاعات به‌روزرسانی‌شده
    return NextResponse.json(updatedCourse, { status: 200 });
  } catch (error) {
    console.error('Error updating course:', error);

    return NextResponse.json(
      { error: 'An error occurred while updating the course' },
      { status: 500 },
    );
  }
}

export async function DELETE(request, { params }) {
  const { id } = params;

  // بررسی معتبر بودن ID
  if (!id || isNaN(parseInt(id, 10))) {
    return NextResponse.json({ error: 'Invalid course ID' }, { status: 400 });
  }

  try {
    const courseId = parseInt(id, 10);

    // حذف دوره با Prisma
    const deletedCourse = await prismadb.course.delete({
      where: { id: courseId },
    });

    // ارسال پاسخ موفقیت
    return NextResponse.json(
      { message: `${deletedCourse.title} با موفقیت پاک شد.` },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error deleting course:', error);

    // بررسی اینکه آیا خطا مربوط به پیدا نشدن دوره است
    if (error.code === 'P2025') {
      // Prisma's record not found error
      return NextResponse.json({ error: 'دوره ای یافت نشد!' }, { status: 404 });
    }

    // سایر خطاها
    return NextResponse.json(
      { error: 'An error occurred while deleting the course' },
      { status: 500 },
    );
  }
}
