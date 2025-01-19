import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export async function POST(request) {
  try {
    // دریافت داده‌ها از درخواست POST
    const { videoKey, accessLevel, sessionId } = await request.json();

    // ایجاد و ذخیره ویدیو جلسه جدید
    const newSessionVideo = await prismadb.sessionVideo.create({
      data: {
        videoKey,
        accessLevel,
        session: { connect: { id: sessionId } }, // اتصال ویدیو به جلسه موجود
      },
    });

    // به‌روزرسانی وضعیت فعال بودن جلسه
    await prismadb.session.update({
      where: { id: sessionId },
      data: { isActive: true },
    });

    // بازگشت ID ویدیو جدید
    return NextResponse.json({ newSessionVideo });
  } catch (error) {
    console.error('Error saving session video:', error);
    return NextResponse.json(
      { error: 'Error saving session video' },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    // دریافت داده‌ها از درخواست PUT
    const { videoKey, accessLevel, sessionId, videoId } = await request.json();

    // اعتبارسنجی داده‌ها
    if (!videoId || !sessionId) {
      return NextResponse.json(
        { error: 'Video ID and Session ID are required' },
        { status: 400 },
      );
    }

    // آپدیت اطلاعات ویدیو جلسه
    const updatedVideo = await prismadb.sessionVideo.update({
      where: { id: videoId }, // شناسه ویدیو
      data: {
        videoKey,
        accessLevel,
        session: { connect: { id: sessionId } }, // اتصال به جلسه جدید (در صورت نیاز)
      },
    });

    // بررسی و به‌روزرسانی وضعیت جلسه (اختیاری)
    await prismadb.session.update({
      where: { id: sessionId },
      data: { isActive: true },
    });

    // بازگشت اطلاعات ویدیو به‌روزرسانی شده
    return NextResponse.json({
      updatedVideo,
    });
  } catch (error) {
    console.error('Error updating session video:', error);
    return NextResponse.json(
      { error: 'Error updating session video' },
      { status: 500 },
    );
  }
}
