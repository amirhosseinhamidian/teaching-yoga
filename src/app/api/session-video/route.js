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
    return NextResponse.json({ id: newSessionVideo.id });
  } catch (error) {
    console.error('Error saving session video:', error);
    return NextResponse.json(
      { error: 'Error saving session video' },
      { status: 500 },
    );
  }
}
