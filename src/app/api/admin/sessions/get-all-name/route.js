import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export async function GET() {
  try {
    const sessions = await prismadb.session.findMany({
      orderBy: {
        createAt: 'desc',
      },
      select: {
        id: true,
        name: true,
        type: true,
        isActive: true,
      },
    });

    return NextResponse.json(sessions, { status: 200 });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'خطا در دریافت لیست جلسات.' },
      { status: 500 },
    );
  }
}