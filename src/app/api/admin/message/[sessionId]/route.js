// app/api/admin/sessions/[sessionId]/messages/route.js
import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { notifyReply } from '@/libs/notifyReply';


export async function GET(req, { params }) {
  try {


    const { searchParams } = req.nextUrl;
    const sessionId = params.sessionId;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('perPage') || '10', 10);
    const skip = (page - 1) * perPage;
    const markSeen = (searchParams.get('markSeen') || 'false') === 'true';

    if (!sessionId) {
      return NextResponse.json({ success: false, message: 'شناسه سشن الزامی است' }, { status: 400 });
    }

    // 1) خود سشن + کاربر
    const sessionRow = await prismadb.supportSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        anonymousId: true,
        user: { select: { id: true, username: true, avatar: true, phone: true } },
      },
    });
    if (!sessionRow) {
      return NextResponse.json({ success: false, message: 'سشن یافت نشد' }, { status: 404 });
    }

    // 2) تعداد کل پیام‌ها
    const total = await prismadb.supportMessage.count({ where: { sessionId } });

    // 3) پیام‌ها (به ترتیب صعودی برای نمایش مستقیم)
    const messages = await prismadb.supportMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' }, // <-- صعودی
      skip,
      take: perPage,
      include: {
        replyTo: { select: { id: true, content: true } },
      },
    });

    // 4) unreadCount برای پیام‌های کاربر
    const unreadCount = await prismadb.supportMessage.count({
      where: { sessionId, sender: 'USER', isSeen: false },
    });

    // 5) اختیاری: آیا پوش فعال دارد؟ (در صورت داشتن جدول push_subscriptions)
    // اگر نداری این بخش را حذف کن
    let hasPushSubscription = null;
    try {
      hasPushSubscription = !!(await prismadb.pushSubscription.findFirst({
        where: {
          OR: [
            sessionRow.user?.id ? { userId: sessionRow.user.id } : undefined,
            sessionRow.anonymousId ? { anonymousId: sessionRow.anonymousId } : undefined,
          ].filter(Boolean),
        },
        select: { id: true },
      }));
    } catch {
      // جدول ندارید؟ مشکلی نیست.
      hasPushSubscription = null;
    }

    // 6) در صورت نیاز، پیام‌های خوانده‌نشده‌ی کاربر را «خوانده‌شده» کن
    if (markSeen && unreadCount > 0) {
      await prismadb.supportMessage.updateMany({
        where: { sessionId, sender: 'USER', isSeen: false },
        data: { isSeen: true },
      });
    }

    // 7) خروجی نهایی
    const formattedMessages = messages.map((m) => ({
      id: m.id,
      sessionId: m.sessionId,
      content: m.content,
      sender: m.sender,
      createdAt: m.createdAt,
      isSeen: m.isSeen,
      replyToId: m.replyToId,
      replyToContent: m.replyTo ? m.replyTo.content : null,
    }));

    const userData =
      sessionRow.user || {
        username: 'مهمان',
        avatar: '/images/default-profile.png',
        phone: 'ناشناخته',
      };

    return NextResponse.json({
      success: true,
      data: {
        user: userData,
        messages: formattedMessages,
        meta: {
          unreadCount: markSeen ? 0 : unreadCount,
          hasPushSubscription,
        },
        pagination: {
          total,
          page,
          perPage,
          totalPages: Math.max(1, Math.ceil(total / perPage)),
        },
      },
    });
  } catch (error) {
    console.error('[GET_SESSION_MESSAGES_ERROR]', error);
    return NextResponse.json({ success: false, message: 'خطا در دریافت پیام‌ها' }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
 
    const sessionId = params.sessionId;
    const { content } = await req.json();

    if (!content || content.trim() === '') {
      return NextResponse.json({ success: false, message: 'متن پیام الزامی است' }, { status: 400 });
    }
    if (!sessionId) {
      return NextResponse.json({ success: false, message: 'شناسه سشن الزامی است' }, { status: 400 });
    }

    // صاحب سشن
    const sessionRow = await prismadb.supportSession.findUnique({
      where: { id: sessionId },
      select: { id: true, userId: true, anonymousId: true },
    });
    if (!sessionRow) {
      return NextResponse.json({ success: false, message: 'سشن یافت نشد' }, { status: 404 });
    }

    // ایجاد پیام پشتیبان
    const message = await prismadb.supportMessage.create({
      data: { content: content.trim(), sender: 'SUPPORT', sessionId },
    });

    // URL گفتگو (از سایت، نه API)
    // eslint-disable-next-line no-undef
    const origin = process.env.NEXT_PUBLIC_API_BASE_URL

    // ارسال Web Push (non-blocking)
    try {
      const to = {
        userId: sessionRow.userId || null,
        anonymousId: sessionRow.anonymousId || null,
      };
      await notifyReply(to, origin, content);
    } catch (notifyErr) {
      console.error('[PUSH_NOTIFY_ERROR]', notifyErr);
    }

    return NextResponse.json({
      success: true,
      message: 'پیام پشتیبان با موفقیت ارسال شد.',
      data: message,
    });
  } catch (error) {
    console.error('[POST_SESSION_MESSAGE_ERROR]', error);
    return NextResponse.json({ success: false, message: 'خطا در ارسال پیام پشتیبان' }, { status: 500 });
  }
}
