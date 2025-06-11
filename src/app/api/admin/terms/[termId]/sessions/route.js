import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  const { termId } = params; // گرفتن آیدی ترم از پارامتر URL

  if (!termId) {
    return NextResponse.json({ error: 'Term ID is required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { name, duration, type } = body;

    if (!name || !duration || !type) {
      return NextResponse.json(
        { error: 'Name, duration and type are required' },
        { status: 400 },
      );
    }

    // پیدا کردن آخرین مقدار order برای جلسات ترم
    const lastSession = await prismadb.session.findFirst({
      where: {
        termId: parseInt(termId),
      },
      orderBy: {
        order: 'desc',
      },
    });

    const nextOrder = lastSession ? lastSession.order + 1 : 1;

    // ایجاد جلسه جدید
    const newSession = await prismadb.session.create({
      data: {
        name,
        duration,
        type,
        termId: parseInt(termId),
        order: nextOrder,
      },
      include: {
        term: {
          select: {
            name: true, // فقط انتخاب نام ترم
          },
        },
      },
    });

    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 },
    );
  }
}

export async function GET(req, { params }) {
  const { termId } = params;

  try {
    const sessions = await prismadb.session.findMany({
      where: { termId: parseInt(termId) },
      include: {
        video: true,
        audio: true,
      },
      orderBy: {
        order: 'asc',
      },
    });

    return NextResponse.json(sessions, { status: 200 });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions.' },
      { status: 500 },
    );
  }
}
