import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

export async function DELETE(req, { params }) {
  const { termId, sessionId } = params;

  try {
    // حذف جلسه از دیتابیس
    const deletedSession = await prismadb.session.delete({
      where: {
        id: sessionId, // شناسه جلسه
        termId: parseInt(termId), // شناسه ترم
      },
    });

    return NextResponse.json(
      { message: 'جلسه با موفقیت حذف شد', deletedSession },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json({ error: 'خطا در حذف جلسه.' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  const { termId, sessionId } = params;

  try {
    const { name, duration, accessLevel } = await req.json();

    // اعتبارسنجی داده‌های ورودی
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'عنوان جلسه معتبر نیست.' },
        { status: 400 },
      );
    }

    if (!duration || typeof duration !== 'number' || duration <= 0) {
      return NextResponse.json(
        { error: 'مدت زمان باید عددی معتبر باشد.' },
        { status: 400 },
      );
    }

    if (
      !accessLevel ||
      !['PUBLIC', 'REGISTERED', 'PURCHASED'].includes(accessLevel)
    ) {
      return NextResponse.json(
        { error: 'سطح دسترسی ویدیو معتبر نیست.' },
        { status: 400 },
      );
    }

    // بروزرسانی جلسه در دیتابیس
    const updatedSession = await prismadb.session.update({
      where: {
        id: sessionId, // شناسه جلسه
        termId: parseInt(termId), // شناسه ترم
      },
      data: {
        name,
        duration,
        video: {
          update: {
            accessLevel,
          },
        },
      },
      include: {
        video: true,
      },
    });

    return NextResponse.json(
      { message: 'جلسه با موفقیت بروزرسانی شد.', updatedSession },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error updating session:', error);
    return NextResponse.json(
      { error: 'خطا در بروزرسانی جلسه.' },
      { status: 500 },
    );
  }
}
