import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

export async function DELETE(request, { params }) {
  const { termId } = params;

  if (!termId) {
    return NextResponse.json({ error: 'Term ID is required' }, { status: 400 });
  }

  try {
    const termIdInt = parseInt(termId);

    // ---- 1) گرفتن لیست SessionId های متعلق به این ترم (قبل از حذف SessionTerm) ----
    const sessionLinks = await prismadb.sessionTerm.findMany({
      where: { termId: termIdInt },
      select: { sessionId: true },
    });

    const sessionIds = sessionLinks.map((s) => s.sessionId);

    // ---- 2) حذف SessionProgress جلسات موجود در این ترم ----
    if (sessionIds.length > 0) {
      await prismadb.sessionProgress.deleteMany({
        where: {
          sessionId: {
            in: sessionIds,
          },
        },
      });
    }

    // ---- 3) حذف اتصال جلسات به ترم ----
    await prismadb.sessionTerm.deleteMany({
      where: { termId: termIdInt },
    });

    // ---- 4) حذف اتصال ترم به دوره‌ها ----
    await prismadb.courseTerm.deleteMany({
      where: { termId: termIdInt },
    });

    // ---- 5) حذف خود ترم ----
    await prismadb.term.delete({
      where: { id: termIdInt },
    });

    return NextResponse.json(
      { message: 'ترم با تمام ارتباطات مرتبط حذف شد.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting term:', error);
    return NextResponse.json(
      { error: 'خطا در حذف ترم' },
      { status: 500 }
    );
  }
}

export async function PUT(request, { params }) {
  const { termId } = params;

  if (!termId) {
    return NextResponse.json({ error: 'Term ID is required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { name, subtitle, price, discount, duration } = body;

    if (!name || !duration) {
      return NextResponse.json(
        { error: 'All fields (name, duration) are required' },
        { status: 400 }
      );
    }

    const updatedTerm = await prismadb.term.update({
      where: { id: parseInt(termId) },
      data: {
        name,
        subtitle,
        price,
        discount,
        duration: parseInt(duration),
      },
    });

    return NextResponse.json(
      { message: 'ترم با موفقیت بروزرسانی شد', term: updatedTerm },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating term:', error);
    return NextResponse.json(
      { error: 'خطا در بروزرسانی ترم' },
      { status: 500 }
    );
  }
}