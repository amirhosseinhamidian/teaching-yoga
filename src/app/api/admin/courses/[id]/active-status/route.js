import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
  const { id } = params; // دریافت id از URL
  try {
    const courseId = parseInt(id, 10); // تبدیل id به عدد

    // دریافت اطلاعات ارسال‌شده در درخواست
    const body = await request.json();
    const { activeStatus } = body;

    // بررسی صحت مقدار activeStatus
    if (typeof activeStatus !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid activeStatus value' },
        { status: 400 },
      );
    }

    // یافتن و به‌روزرسانی دوره
    const updatedCourse = await prismadb.course.update({
      where: { id: courseId },
      data: { activeStatus },
    });

    // بازگرداندن پاسخ موفقیت
    return NextResponse.json({
      message: `${activeStatus ? 'دوره با موفقیت فعال شد' : 'دوره غیر فعال شد'}`,
      course: updatedCourse,
    });
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating the course' },
      { status: 500 },
    );
  }
}
