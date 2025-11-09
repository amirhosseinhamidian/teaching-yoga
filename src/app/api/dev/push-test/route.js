import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { notifyReply } from '@/libs/notifyReply.js';

export async function POST(req) {
  try {
    const { sessionId, preview = 'پیام تست پوش', url = '/' } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ ok: false, error: 'sessionId لازم است' }, { status: 400 });
    }

    const sessionRow = await prismadb.supportSession.findUnique({
      where: { id: sessionId },
      select: { userId: true, anonymousId: true },
    });
    if (!sessionRow) {
      return NextResponse.json({ ok: false, error: 'سشن یافت نشد' }, { status: 404 });
    }

    const to = sessionRow.userId ? { userId: sessionRow.userId } : { anonymousId: sessionRow.anonymousId };
    await notifyReply(to, url, preview);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[DEV_PUSH_TEST]', e);
    return NextResponse.json({ ok: false, error: 'server error' }, { status: 500 });
  }
}
