import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // دریافت پارامترها از URL
    const page = parseInt(searchParams.get('page') || '1', 10); // شماره صفحه، پیش‌فرض: 1
    const perPage = parseInt(searchParams.get('perPage') || '10', 10); // تعداد سوالات در هر صفحه، پیش‌فرض: 10
    const search = searchParams.get('search') || ''; // رشته جستجو
    const isAnswered = searchParams.get('isAnswered'); // فیلتر پاسخ داده شده
    console.log('answered in api ========> ', isAnswered);
    const skip = (page - 1) * perPage;

    // ایجاد شرط‌های جستجو
    const whereClause = {
      AND: [
        search
          ? {
              OR: [
                { questionText: { contains: search, mode: 'insensitive' } },
                {
                  course: { title: { contains: search, mode: 'insensitive' } },
                },
              ],
            }
          : undefined,
        isAnswered !== 'all' && isAnswered !== undefined
          ? { isAnswered: isAnswered === 'true' }
          : undefined,
      ].filter(Boolean),
    };

    // دریافت سوالات با pagination و فیلتر
    const questions = await prismadb.question.findMany({
      where: whereClause,
      skip,
      take: parseInt(perPage, 10),
      include: {
        user: {
          select: {
            avatar: true,
            username: true,
            id: true,
          },
        },
        course: {
          select: {
            title: true,
          },
        },
        session: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // دریافت تعداد کل سوالات برای pagination
    const totalQuestions = await prismadb.question.count({
      where: whereClause,
    });

    return NextResponse.json({
      success: true,
      data: {
        questions,
        pagination: {
          total: totalQuestions,
          page: parseInt(page, 10),
          perPage: parseInt(perPage, 10),
          totalPages: Math.ceil(totalQuestions / perPage),
        },
      },
    });
  } catch (error) {
    console.error('Error fetching questions:', error);

    return NextResponse.json(
      { success: false, message: 'Failed to fetch questions' },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    // دریافت id از هدر
    const questionId = request.headers.get('id');

    // بررسی وجود id
    if (!questionId) {
      return NextResponse.json(
        { success: false, message: 'Question ID is required' },
        { status: 400 },
      );
    }

    // حذف سوال
    const deletedQuestion = await prismadb.question.delete({
      where: { id: questionId },
    });

    return NextResponse.json({
      success: true,
      message: 'سوال با موفقیت حذف شد.',
      data: deletedQuestion,
    });
  } catch (error) {
    console.error('Error deleting question:', error);

    return NextResponse.json(
      { success: false, message: 'خطا در حذف سوال!' },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    // دریافت داده‌های ارسال‌شده در درخواست
    const { id, answerText } = await request.json();

    // بررسی اینکه ID و داده‌های لازم وجود دارند
    if (!id || answerText === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields (id, answerText, isAnswered)' },
        { status: 400 },
      );
    }

    // به‌روزرسانی سوال در پایگاه داده
    const updatedQuestion = await prismadb.question.update({
      where: { id },
      data: {
        answerText,
        isAnswered: true,
        answeredAt: new Date(), // تنظیم تاریخ در صورت پاسخ‌گویی
        updatedAt: new Date(), // به‌روزرسانی تاریخ تغییرات
      },
    });

    // ارسال پاسخ موفق
    return NextResponse.json({
      message: 'Question updated successfully',
      question: updatedQuestion,
    });
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { error: 'Failed to update question' },
      { status: 500 },
    );
  }
}
