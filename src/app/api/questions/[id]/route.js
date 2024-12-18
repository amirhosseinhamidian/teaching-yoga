import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export async function PUT(request, { params }) {
  try {
    const { id } = params; // استخراج ID سوال از مسیر
    if (!id) {
      return NextResponse.json(
        { message: 'شناسه سوال ارسال نشده است.' },
        { status: 400 },
      );
    }

    // به‌روزرسانی مقدار isReadByUser
    const updatedQuestion = await prismadb.question.update({
      where: {
        id: id,
      },
      data: {
        isReadByUser: true,
      },
    });

    return NextResponse.json(
      {
        message: 'سوال به‌عنوان مشاهده‌شده علامت‌گذاری شد.',
        question: updatedQuestion,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error updating question:', error);
    return NextResponse.json(
      { message: 'خطایی در به‌روزرسانی سوال رخ داد.' },
      { status: 500 },
    );
  }
}
