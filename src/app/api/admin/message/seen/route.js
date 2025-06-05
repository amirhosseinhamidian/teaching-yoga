import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export async function PATCH(req) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    // بررسی اینکه sessionId موجود باشد
    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: 'شناسه سشن الزامی است' },
        { status: 400 },
      );
    }

    // به روزرسانی پیام‌ها با sessionId مشخص
    const updatedMessages = await prismadb.supportMessage.updateMany({
      where: {
        sessionId: sessionId, // استفاده از sessionId برای فیلتر کردن پیام‌ها
        isSeen: false, // فقط پیام‌هایی که دیده نشده‌اند
      },
      data: {
        isSeen: true, // تغییر وضعیت isSeen به true
      },
    });

    // بررسی اینکه پیام‌ها آپدیت شده باشند
    if (updatedMessages.count === 0) {
      return NextResponse.json(
        { success: false, message: 'پیامی برای آپدیت پیدا نشد' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      message: `${updatedMessages.count} پیام با موفقیت به‌روزرسانی شد.`,
    });
  } catch (error) {
    console.error('[UPDATE_MESSAGES_IS_SEEN_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'خطا در به‌روزرسانی پیام‌ها' },
      { status: 500 },
    );
  }
}
