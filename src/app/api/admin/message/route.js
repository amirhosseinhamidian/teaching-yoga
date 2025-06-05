import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export async function GET(req) {
  try {
    const { searchParams } = req.nextUrl;

    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('perPage') || '10', 10);
    const isSeenParam = searchParams.get('isSeen') || 'all';
    const skip = (page - 1) * perPage;

    const isSeenFilter =
      isSeenParam === 'true'
        ? true
        : isSeenParam === 'false'
          ? false
          : undefined;

    // دریافت لیست سشن‌ها با آخرین پیام از کاربر
    const sessions = await prismadb.supportSession.findMany({
      orderBy: { createdAt: 'desc' },
      take: perPage,
      skip,
      include: {
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        messages: {
          where: { sender: 'USER' },
          orderBy: { createdAt: 'desc' },
          take: 1, // فقط آخرین پیام از کاربر
        },
      },
    });

    // اعمال فیلتر isSeen (در سمت سرور)
    const filteredSessions = sessions.filter((session) => {
      const lastMessage = session.messages[0];
      if (!lastMessage) return false;
      if (isSeenFilter === undefined) return true;
      return lastMessage.isSeen === isSeenFilter;
    });

    // تعداد کل واقعی بعد از فیلتر
    const totalCount = await prismadb.supportSession.count();

    // قالب خروجی نهایی
    const formatted = filteredSessions.map((session) => {
      const lastMessage = session.messages[0];

      return {
        sessionId: session.id,
        userId: session.user?.id || null,
        username: session.user?.username || null,
        avatar: session.user?.avatar || null,
        anonymousId: session.anonymousId,
        lastMessage: lastMessage?.content || null,
        isSeen: lastMessage?.isSeen || false,
        createdAt: lastMessage?.createdAt || null,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        sessions: formatted,
        pagination: {
          total: totalCount,
          page,
          perPage,
          totalPages: Math.ceil(totalCount / perPage),
        },
      },
    });
  } catch (error) {
    console.error('[GET_SUPPORT_SESSIONS_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت سشن‌ها' },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    const sessionId = request.headers.get('id');

    if (!sessionId) {
      return NextResponse.json(
        { success: false, message: 'شناسه سشن الزامی است' },
        { status: 400 },
      );
    }

    // حذف تمام پیام‌های مربوط به این سشن
    await prismadb.supportMessage.deleteMany({
      where: {
        sessionId: sessionId,
      },
    });

    // حذف خود سشن
    const deletedSession = await prismadb.supportSession.delete({
      where: {
        id: sessionId,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'گفتگو با موفقیت حذف شد.',
      data: deletedSession,
    });
  } catch (error) {
    console.error('Error deleting support session:', error);
    return NextResponse.json(
      { success: false, message: 'خطا در حذف گفتگو' },
      { status: 500 },
    );
  }
}
