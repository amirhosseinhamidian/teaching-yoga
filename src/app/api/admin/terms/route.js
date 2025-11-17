import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const terms = await prismadb.term.findMany({
      select: {
        id: true,
        name: true,
        price: true,
        discount: true,
        _count: {
          select: {
            sessionTerms: true, // تعداد جلسات از طریق SessionTerm
          },
        },
      },
    });

    const formattedTerms = terms.map((term) => ({
      id: term.id,
      name: term.name,
      price: term.price,
      discount: term.discount,
      sessionCount: term._count.sessionTerms, // تعداد جلسات صحیح
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