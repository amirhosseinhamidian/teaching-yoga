import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

export async function PUT(req, { params }) {
  const { termId, sessionId } = params;

  try {
    // دریافت داده‌های جدید ترتیب از بدنه درخواست
    const { newOrder, oldOrder } = await req.json();

    // دریافت جلسه فعلی برای اطمینان از اینکه جلسه وجود دارد
    const session = await prismadb.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json(
        { error: 'جلسه مورد نظر یافت نشد.' },
        { status: 404 },
      );
    }

    // اگر ترتیب جدید همان ترتیب فعلی باشد، هیچ تغییری انجام نشود
    if (session.order === parseInt(newOrder)) {
      return NextResponse.json(
        { message: 'ترتیب جلسه تغییر نکرده است.' },
        { status: 200 },
      );
    }

    // به‌روزرسانی ترتیب جلسه با newOrder
    await prismadb.session.update({
      where: { id: sessionId },
      data: { order: parseInt(newOrder) },
    });

    // به‌روزرسانی ترتیب باقی‌مانده جلسات در ترم مورد نظر
    const remainingSessions = await prismadb.session.findMany({
      where: { termId: parseInt(termId) },
      orderBy: { order: 'asc' },
    });

    // ترتیب‌دهی مجدد جلسات با در نظر گرفتن ترتیب جدید
    const updatedSessions = remainingSessions
      .filter((session) => session.id !== sessionId) // حذف جلسه مورد نظر از محاسبات
      .map((session) => {
        // اگر جلسه ترتیب بزرگتر یا مساوی از ترتیب جدید داشته باشد، 1 واحد اضافه می‌شود
        if (
          session.order >= parseInt(newOrder) &&
          session.order < parseInt(oldOrder)
        ) {
          return prismadb.session.update({
            where: { id: session.id },
            data: { order: session.order + 1 },
          });
        }
      });

    // منتظر ماندن برای به‌روزرسانی تمام جلسات
    await Promise.all(updatedSessions);

    // دریافت لیست به‌روز شده جلسات ترم
    const updatedSessionList = await prismadb.session.findMany({
      where: { termId: parseInt(termId) },
      include: {
        video: true, // اطلاعات ویدیو
      },
      orderBy: { order: 'asc' },
    });

    return NextResponse.json(
      {
        message: 'ترتیب جلسه با موفقیت به‌روزرسانی شد.',
        updatedSessions: updatedSessionList, // لیست به‌روز شده جلسات ترم
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error updating session order:', error);
    return NextResponse.json(
      { error: 'خطا در به‌روزرسانی ترتیب جلسه.' },
      { status: 500 },
    );
  }
}
