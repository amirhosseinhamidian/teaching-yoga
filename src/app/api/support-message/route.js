import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prismadb from '@/libs/prismadb';

// GET: لیست پیام‌های یک session خاص (بر اساس userId یا anonymousId)
export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = req.nextUrl;

    const anonymousId = searchParams.get('anonymousId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = 10;
    const skip = (page - 1) * pageSize;

    const userId = session?.user?.userId || null;

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
        { status: 200 },
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
      { status: 500 },
    );
  }
}

// POST: ثبت پیام جدید در session موجود یا جدید
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json();
    const { content, anonymousId } = body;

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'متن پیام نباید خالی باشد' },
        { status: 400 },
      );
    }

    const userId = session?.user?.userId || null;
    const isGuest = !userId;

    if (isGuest && !anonymousId) {
      return NextResponse.json(
        { error: 'شناسه مهمان الزامی است' },
        { status: 400 },
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

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('[SUPPORT_MESSAGES_POST_ERROR]', error);
    return NextResponse.json({ error: 'خطا در ثبت پیام' }, { status: 500 });
  }
}
