import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

export async function GET(request) {
  try {
    const terms = await prismadb.term.findMany({
      select: {
        id: true,
        name: true,
        _count: {
          select: {
            sessions: true, // تعداد جلسات مرتبط با ترم
          },
        },
      },
    });

    const formattedTerms = terms.map((term) => ({
      id: term.id,
      name: term.name,
      sessionCount: term._count.sessions, // تعداد جلسات
    }));

    return NextResponse.json(formattedTerms);
  } catch (error) {
    console.error('Error fetching terms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch terms' },
      { status: 500 },
    );
  }
}
