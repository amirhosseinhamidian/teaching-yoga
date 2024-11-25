import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId'); // `sessionId` یک رشته است

    console.log('session id in check video => ', sessionId);
    if (!sessionId) {
      return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
    }

    // پیدا کردن ویدیو با استفاده از sessionId
    const sessionVideo = await prismadb.sessionVideo.findFirst({
      where: {
        session: {
          id: sessionId, // استفاده از شناسه جدول `Session` برای جستجو
        },
      },
      select: {
        accessLevel: true,
      },
    });

    console.log('session video in check video api =>', sessionVideo);

    if (!sessionVideo) {
      return NextResponse.json(
        { error: 'Session video not found' },
        { status: 404 },
      );
    }

    return NextResponse.json(sessionVideo, { status: 200 });
  } catch (error) {
    console.error('Error fetching session video:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
