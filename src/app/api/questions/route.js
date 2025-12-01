/* eslint-disable no-undef */
import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { notifyAdminsNewMessage } from '@/libs/notifyAdmins';
import { getAuthUser } from '@/utils/getAuthUser';

export async function POST(request) {
  try {
    const { courseId, sessionId, questionText } = await request.json();

    // احراز هویت کاربر
    const authUser = getAuthUser();
    if (!authUser?.id) {
      return NextResponse.json(
        { message: 'برای ارسال سؤال باید وارد حساب کاربری شوید.' },
        { status: 401 }
      );
    }

    // ثبت سؤال
    await prismadb.question.create({
      data: {
        userId: authUser.id,
        courseId: Number(courseId),
        sessionId,
        questionText,
      },
    });

    // اطلاع‌رسانی به ادمین‌ها
    try {
      const preview = questionText.replace(/<[^>]*>/g, '').slice(0, 120);
      const threadUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/a-panel/questions`;

      await notifyAdminsNewMessage(
        threadUrl,
        `سؤال جدید از ${authUser.username || 'کاربر'}`,
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
    // احراز هویت
    const authUser = getAuthUser();
    if (!authUser?.id) {
      return NextResponse.json(
        { message: 'برای مشاهده سؤالات ابتدا باید وارد شوید.' },
        { status: 401 }
      );
    }

    const userId = authUser.id;

    // دریافت سؤالات کاربر
    const allQuestions = await prismadb.question.findMany({
      where: { userId },
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
            sessionTerms: {
              select: {
                term: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // تبدیل به خروجی مناسب
    const processQuestions = (questions) =>
      questions.map((q) => ({
        id: q.id,
        questionText: q.questionText,
        answerText: q.answerText,
        isAnswered: q.isAnswered,
        isReadByUser: q.isReadByUser,
        answeredAt: q.answeredAt,
        createdAt: q.createdAt,
        updatedAt: q.updatedAt,
        courseTitle: q.course.title,
        instructorUsername: q.course.instructor.user.username,
        instructorAvatar: q.course.instructor.user.avatar,
        sessionName: q.session?.name || 'N/A',
        termName: q.session?.sessionTerms?.[0]?.term?.name || 'N/A',
      }));

    const all = processQuestions(allQuestions);
    const unread = processQuestions(
      allQuestions.filter((q) => !q.isReadByUser && q.isAnswered)
    );
    const unanswered = processQuestions(
      allQuestions.filter((q) => !q.isAnswered)
    );

    return NextResponse.json({
      allQuestions: all,
      unreadQuestions: unread,
      unansweredQuestions: unanswered,
    });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return NextResponse.json({ message: 'خطای داخلی سرور' }, { status: 500 });
  }
}
