/* eslint-disable no-undef */
import { NextResponse } from 'next/server';
import { getAuthUser } from '@/utils/getAuthUser';
import prismadb from '@/libs/prismadb';
import { notifyAdminsNewMessage } from '@/libs/notifyAdmins';

// GET: لیست پیام‌های یک session خاص (بر اساس userId یا anonymousId)
export async function GET(req) {
  try {
    const authUser = getAuthUser();
    const userId = authUser?.id || null;
    const { searchParams } = req.nextUrl;

    const anonymousId = searchParams.get('anonymousId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = 10;
    const skip = (page - 1) * pageSize;

    if (!userId && !anonymousId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // یافتن session موجود برای user یا anonymous
    const existingSession = await prismadb.supportSession.findFirst({
      where: {
        OR: [
          userId ? { userId } : undefined,
          anonymousId ? { anonymousId } : undefined,
        ].filter(Boolean),
      },
    });

    if (!existingSession) {
      return NextResponse.json(
        {
          messages: [],
          total: 0,
          page,
          pageSize,
          totalPages: 0,
        },
        { status: 200 }
      );
    }

    const [messages, totalCount] = await Promise.all([
      prismadb.supportMessage.findMany({
        where: {
          sessionId: existingSession.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: pageSize,
      }),
      prismadb.supportMessage.count({
        where: {
          sessionId: existingSession.id,
        },
      }),
    ]);

    return NextResponse.json({
      messages: messages.reverse(),
      total: totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    });
  } catch (error) {
    console.error('[SUPPORT_MESSAGES_GET_ERROR]', error);
    return NextResponse.json(
      { error: 'خطا در دریافت پیام‌ها' },
      { status: 500 }
    );
  }
}

// POST: ثبت پیام جدید در session موجود یا جدید
export async function POST(req) {
  try {
    const body = await req.json();
    const { content, anonymousId } = body;

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'متن پیام نباید خالی باشد' },
        { status: 400 }
      );
    }

    const authUser = getAuthUser();
    const userId = authUser?.id || null;
    const isGuest = !userId;

    if (isGuest && !anonymousId) {
      return NextResponse.json(
        { error: 'شناسه مهمان الزامی است' },
        { status: 400 }
      );
    }

    // یافتن session یا ایجاد آن
    let supportSession = await prismadb.supportSession.findFirst({
      where: {
        OR: [
          userId ? { userId } : undefined,
          anonymousId ? { anonymousId } : undefined,
        ].filter(Boolean),
      },
    });

    if (!supportSession) {
      supportSession = await prismadb.supportSession.create({
        data: {
          userId,
          anonymousId: isGuest ? anonymousId : null,
        },
      });
    }

    // ایجاد پیام
    const message = await prismadb.supportMessage.create({
      data: {
        content,
        sender: 'USER',
        userId,
        anonymousId: isGuest ? anonymousId : null,
        sessionId: supportSession.id,
      },
    });

    // 🔔 ارسال نوتیف به ادمین‌ها (non-blocking)
    try {
      const origin =
        process.env.NEXT_PUBLIC_ADMIN_PANEL_URL || // اگر پنل ادمین دامنه جدا دارد
        process.env.NEXT_PUBLIC_SITE_URL || // یا سایت اصلی
        process.env.NEXT_PUBLIC_API_BASE_URL || // یا fallback
        'http://localhost:3000';

      // لینکی که ادمین با کلیک روی نوتیف باز می‌کنه
      const adminThreadUrl = `${origin}/a-panel/message/reply?sessionId=${encodeURIComponent(
        supportSession.id
      )}`;

      await notifyAdminsNewMessage({
        sessionId: supportSession.id,
        content,
        url: adminThreadUrl,
      });
    } catch (notifyErr) {
      console.error('[ADMIN_PUSH_NOTIFY_ERROR]', notifyErr);
    }

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('[SUPPORT_MESSAGES_POST_ERROR]', error);
    return NextResponse.json({ error: 'خطا در ثبت پیام' }, { status: 500 });
  }
}
