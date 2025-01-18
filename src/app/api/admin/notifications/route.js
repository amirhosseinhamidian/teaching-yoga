import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // تعداد کامنت‌های مقالات در وضعیت PENDING (courseId == null)
    const articleCommentsCount = await prismadb.comment.count({
      where: {
        status: 'PENDING',
        courseId: null,
      },
    });

    // تعداد کامنت‌های دوره‌ها در وضعیت PENDING (articleId == null)
    const courseCommentsCount = await prismadb.comment.count({
      where: {
        status: 'PENDING',
        articleId: null,
      },
    });

    // تعداد تیکت‌ها در وضعیت PENDING
    const pendingTicketsCount = await prismadb.ticket.count({
      where: { status: 'PENDING' },
    });

    // تعداد تیکت‌ها در وضعیت IN_PROGRESS
    const inProgressTicketsCount = await prismadb.ticket.count({
      where: { status: 'IN_PROGRESS' },
    });

    // تعداد سوالات با isAnswered: false
    const unansweredQuestionsCount = await prismadb.question.count({
      where: { isAnswered: false },
    });

    // مجموع همه نوتیفیکیشن‌ها
    const totalNotifications =
      articleCommentsCount +
      courseCommentsCount +
      pendingTicketsCount +
      inProgressTicketsCount +
      unansweredQuestionsCount;

    // آماده‌سازی پاسخ
    const notifications = [
      {
        count: articleCommentsCount,
        text: 'کامنت‌ جدید مقالات منتظر تایید',
        actionPath: '/a-panel/comment',
      },
      {
        count: courseCommentsCount,
        text: 'کامنت‌ جدید دوره‌ها منتظر تایید',
        actionPath: '/a-panel/comment',
      },
      {
        count: pendingTicketsCount,
        text: 'تیکت‌ جدید در وضعیت در انتظار بررسی',
        actionPath: '/a-panel/tickets',
      },
      {
        count: inProgressTicketsCount,
        text: 'تیکت‌ در وضعیت در حال بررسی',
        actionPath: '/a-panel/tickets',
      },
      {
        count: unansweredQuestionsCount,
        text: 'سوال جدید بدون پاسخ باقی مانده‌',
        actionPath: '/a-panel/questions',
      },
    ];

    // افزودن مجموع به پاسخ
    return NextResponse.json(
      {
        total: totalNotifications,
        details: notifications,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات نوتیفیکیشن‌ها' },
      { status: 500 },
    );
  }
}
