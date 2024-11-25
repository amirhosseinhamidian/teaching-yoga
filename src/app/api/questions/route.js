import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prismadb from '@/libs/prismadb';

export async function POST(request) {
  try {
    const { courseId, sessionId, questionText } = await request.json();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { message: 'You must be logged in to ask a question.' },
        { status: 401 },
      );
    }

    await prismadb.question.create({
      data: {
        userId: session.user.userId,
        courseId: Number(courseId),
        sessionId: sessionId,
        questionText: questionText,
      },
    });

    return NextResponse.json(
      {
        message:
          'سوال با موفقیت ارسال شد. \n به زودی پاسخ را در پروفایل خود مشاهده کنید.',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'عدم ارسال صحیح سوال؛ لطفا بعدا امتحان کنید' },
      { status: 500 },
    );
  }
}
