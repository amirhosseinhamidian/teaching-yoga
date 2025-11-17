/* eslint-disable no-undef */
import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { generateTemporaryLink } from '@/app/actions/generateTemporaryLink';

export async function GET(request) {
  const { searchParams } = request.nextUrl;
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json(
      { error: 'A valid session ID is required' },
      { status: 400 },
    );
  }

  try {
    const session = await prismadb.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        name: true,
        duration: true,
        isFree: true,
        type: true,
        video: {
          select: {
            id: true,
            videoKey: true,
            accessLevel: true,
            status: true,
          },
        },
        audio: {
          select: {
            id: true,
            audioKey: true,
            accessLevel: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // ★★★★★ تغییر اصلی: دریافت ترم‌ها از SessionTerm
    const sessionTerms = await prismadb.sessionTerm.findMany({
      where: { sessionId },
      select: {
        term: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // چون قبلاً فقط یک ترم وجود داشت، اینجا اولین ترم را برمی‌گردانیم
    const term = sessionTerms[0]?.term || null;

    let mediaLink = null;

    if (session.type === 'VIDEO' && session.video?.videoKey) {
      mediaLink = await generateTemporaryLink(session.video.videoKey);
    } else if (session.type === 'AUDIO' && session.audio?.audioKey) {
      // قبلاً از session.term.id استفاده می‌شد → حالا از term?.id
      mediaLink = await generateTemporaryLink(
        `audio/${term?.id}/${session.id}/audio.mp3`,
      );
    }

    return NextResponse.json({
      ...session,
      term, // افزودن ترم به خروجی، مشابه قبل
      mediaLink,
    });
  } catch (error) {
    console.error('Error fetching session details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session details' },
      { status: 500 },
    );
  }
}