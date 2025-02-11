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
    // دریافت جزئیات جلسه
    const session = await prismadb.session.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        name: true,
        duration: true,
        isFree: true,
        video: {
          select: {
            id: true,
            videoKey: true, // فیلد آپدیت شده
            accessLevel: true,
            status: true,
          },
        },
        term: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // ساخت لینک موقت برای videoKey
    let videoLink = await generateTemporaryLink(session.video.videoKey);

    // افزودن لینک موقت به پاسخ
    const response = {
      ...session,
      videoLink, // اضافه کردن لینک موقت
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching session details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session details' },
      { status: 500 },
    );
  }
}
