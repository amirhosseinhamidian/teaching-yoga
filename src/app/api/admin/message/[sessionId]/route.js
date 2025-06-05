import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export async function GET(req, { params }) {
  try {
    const sessionId = params.sessionId;
    const { searchParams } = new URL(req.url);

    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('perPage') || '10', 10);
    const skip = (page - 1) * perPage;

    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: 'شناسه سشن الزامی است' },
        { status: 400 },
      );
    }

    const [messages, total] = await Promise.all([
      prismadb.supportMessage.findMany({
        where: { sessionId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: perPage,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
              phone: true, // شماره موبایل کاربر
            },
          },
          replyTo: {
            select: {
              id: true,
              content: true,
            },
          },
        },
      }),
      prismadb.supportMessage.count({
        where: { sessionId },
      }),
    ]);

    const userData = messages.length > 0 ? messages[0].user : null;

    // در صورتی که کاربر ناشناس باشد (یعنی userData null باشد)
    const formattedMessages = messages.map((msg) => {
      return {
        sessionId: msg.sessionId,
        content: msg.content,
        sender: msg.sender,
        createdAt: msg.createdAt,
        isSeen: msg.isSeen,
        user: userData
          ? userData
          : {
              username: 'مهمان',
              avatar: '/images/default-profile.png',
              phone: 'ناشناخته',
            }, // اطلاعات پیش‌فرض برای کاربران ناشناس
        replyToId: msg.replyToId,
        replyToContent: msg.replyTo ? msg.replyTo.content : null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        user: userData || {
          username: 'مهمان',
          avatar: '/default-avatar.png',
          phone: 'ناشناخته',
        },
        messages: formattedMessages.reverse(),
        pagination: {
          total,
          page,
          perPage,
          totalPages: Math.ceil(total / perPage),
        },
      },
    });
  } catch (error) {
    console.error('[GET_SESSION_MESSAGES_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت پیام‌ها' },
      { status: 500 },
    );
  }
}

export async function POST(req, { params }) {
  try {
    const sessionId = params.sessionId;
    const { content } = await req.json(); // محتوای پیام از body درخواست

    // بررسی وجود پیام و شناسه سشن
    if (!content || content.trim() === '') {
      return NextResponse.json(
        { success: false, message: 'متن پیام الزامی است' },
        { status: 400 },
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: 'شناسه سشن الزامی است' },
        { status: 400 },
      );
    }

    // ایجاد پیام جدید برای پشتیبان
    const message = await prismadb.supportMessage.create({
      data: {
        content,
        sender: 'SUPPORT',
        sessionId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'پیام پشتیبان با موفقیت ارسال شد.',
      data: message,
    });
  } catch (error) {
    console.error('[POST_SESSION_MESSAGE_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'خطا در ارسال پیام پشتیبان' },
      { status: 500 },
    );
  }
}
