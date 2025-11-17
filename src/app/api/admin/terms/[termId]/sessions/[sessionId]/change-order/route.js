import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

export async function PUT(req, { params }) {
  const { termId, sessionId } = params;

  try {
    const { newOrder, oldOrder } = await req.json();

    // دریافت SessionTerm مربوط به این جلسه در این ترم
    const sessionTerm = await prismadb.sessionTerm.findFirst({
      where: {
        termId: parseInt(termId),
        sessionId: sessionId
      },
    });

    if (!sessionTerm) {
      return NextResponse.json(
        { error: 'این جلسه در این ترم یافت نشد.' },
        { status: 404 }
      );
    }

    // اگر ترتیب تغییر نکرده
    if (sessionTerm.order === parseInt(newOrder)) {
      return NextResponse.json(
        { message: 'ترتیب تغییری نکرده است.' },
        { status: 200 }
      );
    }

    const newOrderInt = parseInt(newOrder);
    const oldOrderInt = parseInt(oldOrder);

    // ✔️ ابتدا ترتیب جلسه فعلی را آپدیت کن
    await prismadb.sessionTerm.update({
      where: { id: sessionTerm.id },
      data: { order: newOrderInt },
    });

    // ✔️ گرفتن تمام جلسات ترم به جز این جلسه
    const allSessionTerms = await prismadb.sessionTerm.findMany({
      where: { termId: parseInt(termId) },
      orderBy: { order: 'asc' },
    });

    const updates = [];

    for (const st of allSessionTerms) {
      if (st.sessionId === sessionId) continue;

      // انتقال از order کوچک → بزرگ
      if (newOrderInt > oldOrderInt) {
        if (st.order > oldOrderInt && st.order <= newOrderInt) {
          updates.push(
            prismadb.sessionTerm.update({
              where: { id: st.id },
              data: { order: st.order - 1 },
            })
          );
        }
      }

      // انتقال از order بزرگ → کوچک
      else {
        if (st.order < oldOrderInt && st.order >= newOrderInt) {
          updates.push(
            prismadb.sessionTerm.update({
              where: { id: st.id },
              data: { order: st.order + 1 },
            })
          );
        }
      }
    }

    await Promise.all(updates);

    // ✔️ دریافت لیست جدید جلسات با session + video + audio
    const updatedSessionList = await prismadb.sessionTerm.findMany({
      where: { termId: parseInt(termId) },
      include: {
        session: {
          include: {
            video: true,
            audio: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    });

    // تبدیل ساختار برای سازگار شدن با Front
    const mapped = updatedSessionList.map((st) => ({
      id: st.session.id,
      name: st.session.name,
      type: st.session.type,
      isActive: st.session.isActive,
      order: st.order,
      termId: st.termId,
      video: st.session.video,
      audio: st.session.audio,
    }));

    return NextResponse.json(
      {
        message: 'ترتیب جلسه با موفقیت بروزرسانی شد.',
        updatedSessions: mapped,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating session order:', error);
    return NextResponse.json(
      { error: 'خطا در بروزرسانی ترتیب جلسه.' },
      { status: 500 }
    );
  }
}
