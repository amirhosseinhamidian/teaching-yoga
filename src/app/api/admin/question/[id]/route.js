import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export async function GET(request, { params }) {
  const { id } = params; // استخراج ID از پارامتر URL

  if (!id) {
    return NextResponse.json(
      { message: 'Question ID is required' },
      { status: 400 },
    );
  }

  try {
    // جستجوی اطلاعات سؤال و روابط مرتبط
    const question = await prismadb.question.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstname: true,
            lastname: true,
            phone: true,
            avatar: true,
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
            term: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    // بررسی اینکه آیا سؤال وجود دارد
    if (!question) {
      return NextResponse.json(
        { message: 'Question not found' },
        { status: 404 },
      );
    }

    // برگرداندن اطلاعات به صورت JSON
    return NextResponse.json(
      {
        id: question.id,
        questionText: question.questionText,
        answerText: question.answerText,
        isAnswered: question.isAnswered,
        isReadByUser: question.isReadByUser,
        answeredAt: question.answeredAt,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
        user: question.user,
        course: question.course,
        session: {
          name: question.session.name,
          term: question.session.term,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'An error occurred while fetching the question' },
      { status: 500 },
    );
  }
}
