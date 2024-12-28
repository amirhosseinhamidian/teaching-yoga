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

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { message: 'You must be logged in to ask a question.' },
        { status: 401 },
      );
    }

    // دریافت سوالات همه وضعیت‌ها
    const allQuestions = await prismadb.question.findMany({
      where: {
        userId: session.user.userId, // بر اساس ID کاربر سوالات را فیلتر می‌کنیم
      },
      include: {
        course: {
          select: {
            title: true,
            instructor: {
              select: {
                user: {
                  select: {
                    username: true,
                    avatar: true,
                  },
                },
              },
            },
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
      orderBy: {
        createdAt: 'desc',
      },
    });

    // پردازش سوالات برای اضافه کردن اطلاعات تکمیلی
    const processQuestions = (questions) =>
      questions.map((question) => ({
        id: question.id,
        questionText: question.questionText,
        answerText: question.answerText,
        isAnswered: question.isAnswered,
        isReadByUser: question.isReadByUser,
        answeredAt: question.answeredAt,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
        courseTitle: question.course.title,
        instructorUsername: question.course.instructor.user.username,
        instructorAvatar: question.course.instructor.user.avatar,
        sessionName: question.session?.name || 'N/A',
        termName: question.session?.term?.name || 'N/A',
      }));

    const all = processQuestions(allQuestions);

    const unread = processQuestions(
      allQuestions.filter(
        (question) => !question.isReadByUser && question.isAnswered,
      ),
    );

    const unanswered = processQuestions(
      allQuestions.filter((question) => !question.isAnswered),
    );

    // پاسخ‌دهی به درخواست با سه لیست مختلف
    return NextResponse.json({
      allQuestions: all,
      unreadQuestions: unread,
      unansweredQuestions: unanswered,
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.error();
  }
}
