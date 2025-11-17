/* eslint-disable no-undef */
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import prismadb from '@/libs/prismadb';
import { notifyAdminsNewMessage } from '@/libs/notifyAdmins';

export async function POST(request) {
  try {
    const { courseId, sessionId, questionText } = await request.json();

    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json(
        { message: 'برای ارسال سؤال باید وارد حساب کاربری شوید.' },
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

    try {
      const preview = questionText.replace(/<[^>]*>/g, '').slice(0, 120);
      const threadUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/a-panel/questions`;
      await notifyAdminsNewMessage(
        threadUrl,
        `سؤال جدید از ${session.user.name || 'کاربر'}`,
        preview || 'بدون متن'
      );
    } catch (err) {
      console.error('[ADMIN_PUSH_NOTIFY_QUESTION_ERROR]', err);
    }

    return NextResponse.json(
      {
        message:
          'سؤال با موفقیت ارسال شد. به زودی پاسخ را در پروفایل خود مشاهده خواهید کرد.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[QUESTION_POST_ERROR]', error);
    return NextResponse.json(
      { message: 'عدم ارسال صحیح سؤال؛ لطفاً بعداً دوباره تلاش کنید.' },
      { status: 500 }
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

    const allQuestions = await prismadb.question.findMany({
      where: {
        userId: session.user.userId,
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
            // ❗ حذف شد: term
            // ❗ اضافه شد: sessionTerms → term
            sessionTerms: {
              select: {
                term: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // پردازش سوالات
    const processQuestions = (questions) =>
      questions.map((question) => {
        const termName =
          question.session?.sessionTerms?.[0]?.term?.name || 'N/A';

        return {
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
          termName: termName,
        };
      });

    const all = processQuestions(allQuestions);

    const unread = processQuestions(
      allQuestions.filter(
        (question) => !question.isReadByUser && question.isAnswered,
      ),
    );

    const unanswered = processQuestions(
      allQuestions.filter((question) => !question.isAnswered),
    );

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