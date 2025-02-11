import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
  const { id } = params; // دریافت id از URL
  try {
    const articleId = parseInt(id, 10); // تبدیل id به عدد

    // دریافت اطلاعات ارسال‌شده در درخواست
    const body = await request.json();
    const { isActive } = body;

    // بررسی صحت مقدار isActive
    if (typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'Invalid isActive value' },
        { status: 400 },
      );
    }

    // یافتن و به‌روزرسانی دوره
    const updatedArticle = await prismadb.article.update({
      where: { id: articleId },
      data: { isActive },
    });

    // بازگرداندن پاسخ موفقیت
    return NextResponse.json({
      message: `${isActive ? 'دوره با موفقیت فعال شد' : 'دوره غیر فعال شد'}`,
      course: updatedArticle,
    });
  } catch (error) {
    console.error('Error updating course:', error);
    return NextResponse.json(
      { error: 'An error occurred while updating the course' },
      { status: 500 },
    );
  }
}
