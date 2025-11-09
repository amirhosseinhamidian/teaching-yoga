import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export async function GET(req) {
  try {
    const { searchParams } = req.nextUrl;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('perPage') || '10', 10);
    const isSeenParam = (searchParams.get('isSeen') || 'all').toLowerCase(); // all|true|false
    const hasPushParam = (searchParams.get('hasPush') || 'all').toLowerCase(); // all|true|false
    const search = (searchParams.get('search') || '').trim();
    const skip = (page - 1) * perPage;

    const isSeenFilter =
      isSeenParam === 'true' ? true :
      isSeenParam === 'false' ? false :
      undefined;

    // اگر search داریم، اول سشن‌های مطابق search را پیدا کن تا در groupBy محدودشان کنیم
    let searchedSessionIds = null;
    if (search) {
      const candidateSessions = await prismadb.supportSession.findMany({
        where: {
          OR: [
            { anonymousId: { contains: search } },
            { user: { username: { contains: search, mode: 'insensitive' } } },
          ],
        },
        select: { id: true },
      });
      searchedSessionIds = candidateSessions.map((s) => s.id);
      if (!searchedSessionIds.length) {
        // هیچ موردی نبود → پاسخ خالی
        return NextResponse.json({
          success: true,
          data: {
            sessions: [],
            pagination: { total: 0, page, perPage, totalPages: 0 },
          },
        });
      }
    }

    // 1) groupBy روی جدول پیام‌ها برای به‌دست‌آوردن آخرین createdAt پیام کاربر در هر سشن
    const groupWhere = {
      sender: 'USER',
      ...(isSeenFilter !== undefined ? { isSeen: isSeenFilter } : {}),
      ...(searchedSessionIds ? { sessionId: { in: searchedSessionIds } } : {}),
    };

    const grouped = await prismadb.supportMessage.groupBy({
      by: ['sessionId'],
      where: groupWhere,
      _max: { createdAt: true },
      orderBy: { _max: { createdAt: 'desc' } },
      skip,
      take: perPage,
    });

    // اگر چیزی نبود
    if (!grouped.length) {
      return NextResponse.json({
        success: true,
        data: {
          sessions: [],
          pagination: { total: 0, page, perPage, totalPages: 0 },
        },
      });
    }

    // 2) total دقیق مطابق همان فیلتر
    const totalGrouped = await prismadb.supportMessage.groupBy({
      by: ['sessionId'],
      where: groupWhere,
      _max: { createdAt: true },
    });
    const totalCount = totalGrouped.length;

    // 3) شناسه‌های سشن به ترتیب آخرین فعالیت کاربر
    const orderedSessionIds = grouped.map((g) => g.sessionId);

    // 4) جزئیات سشن‌ها + آخرین پیام کاربر هر سشن
    const sessions = await prismadb.supportSession.findMany({
      where: { id: { in: orderedSessionIds } },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
        messages: {
          where: { sender: 'USER' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    // 5) برای هر سشن: unreadCount و (اختیاری) hasPushSubscription
    const sessionIndex = new Map(orderedSessionIds.map((id, i) => [id, i]));
    sessions.sort((a, b) => sessionIndex.get(a.id) - sessionIndex.get(b.id));

    // اگر جدول push_subscriptions داری، این تابع را فعال کن
    async function getHasPush({ userId, anonymousId }) {
      try {
        const sub = await prismadb.pushSubscription.findFirst({
          where: {
            OR: [
              userId ? { userId } : undefined,
              anonymousId ? { anonymousId } : undefined,
            ].filter(Boolean),
          },
          select: { id: true },
        });
        return !!sub;
      } catch {
        return null; // جدول نداری / خطا → null
      }
    }

    const enriched = await Promise.all(
      sessions.map(async (s) => {
        const lastUserMsg = s.messages[0] || null;

        const unreadCount = await prismadb.supportMessage.count({
          where: { sessionId: s.id, sender: 'USER', isSeen: false },
        });

        const hasPushSubscription =
          hasPushParam === 'all'
            ? await getHasPush({ userId: s.user?.id || null, anonymousId: s.anonymousId || null })
            : null;

        return {
          sessionId: s.id,
          userId: s.user?.id || null,
          username: s.user?.username || null,
          avatar: s.user?.avatar || null,
          anonymousId: s.anonymousId,
          lastMessage: lastUserMsg?.content || null,
          isSeen: lastUserMsg?.isSeen ?? false,
          createdAt: lastUserMsg?.createdAt || s.createdAt,
          unreadCount,
          hasPushSubscription,
        };
      })
    );

    // 6) فیلتر hasPush (در حافظه)
    const filteredByPush =
      hasPushParam === 'all'
        ? enriched
        : enriched.filter((s) =>
            hasPushParam === 'true' ? !!s.hasPushSubscription : !s.hasPushSubscription
          );

    // اگر فیلتر hasPush اعمال شد، total را با آن تطبیق بده (در غیر این صورت همان totalCount)
    const total = hasPushParam === 'all' ? totalCount : filteredByPush.length;

    return NextResponse.json({
      success: true,
      data: {
        sessions: filteredByPush,
        pagination: {
          total,
          page,
          perPage,
          totalPages: Math.max(1, Math.ceil(total / perPage)),
        },
      },
    });
  } catch (error) {
    console.error('[GET_SUPPORT_SESSIONS_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'خطا در دریافت سشن‌ها' },
      { status: 500 }
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
