import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    // پیدا کردن جلسه به همراه ویدیو و صوت
    const session = await prismadb.session.findUnique({
      where: { id: sessionId },
      select: {
        video: {
          select: {
            accessLevel: true,
          },
        },
        audio: {
          select: {
            accessLevel: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // اگر ویدیو موجود است
    if (session.video) {
      return NextResponse.json(
        {
          type: 'VIDEO',
          accessLevel: session.video.accessLevel,
        },
        { status: 200 },
      );
    }

    // اگر صوت موجود است
    if (session.audio) {
      return NextResponse.json(
        {
          type: 'AUDIO',
          accessLevel: session.audio.accessLevel,
        },
        { status: 200 },
      );
    }

    // اگر نه ویدیو و نه صوت موجود نباشد
    return NextResponse.json(
      { error: 'No media found for this session' },
      { status: 404 },
    );
  } catch (error) {
    console.error('Error checking media access:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
