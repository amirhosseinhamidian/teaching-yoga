import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export async function GET() {
  try {
    // تعداد پیام‌های دیده‌نشده (جدید)
    const unseenCount = await prismadb.supportMessage.count({
      where: { isSeen: false, sender: 'USER' },
    });

    // تعداد پیام‌های کاربران (همه‌ی پیام‌هایی که توسط USER ارسال شدند)
    const userMessages = await prismadb.supportMessage.count({
      where: { sender: 'USER' },
    });

    // تعداد پاسخ‌های پشتیبان
    const supportReplies = await prismadb.supportMessage.count({
      where: { sender: 'SUPPORT' },
    });

    return NextResponse.json({
      unseenMessages: unseenCount,
      userMessages,
      supportReplies,
    });
  } catch (error) {
    console.error('[GET_MESSAGE_STATS_ERROR]', error);
    return NextResponse.json(
      { error: 'خطا در دریافت آمار پیام‌ها' },
      { status: 500 },
    );
  }
}
