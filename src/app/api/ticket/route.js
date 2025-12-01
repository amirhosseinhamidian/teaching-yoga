import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';

// POST → ایجاد تیکت
export async function POST(req) {
  try {
    const authUser = getAuthUser();
    if (!authUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, courseId } = await req.json();

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required.' },
        { status: 400 }
      );
    }

    const ticket = await prismadb.ticket.create({
      data: {
        title,
        description,
        userId: authUser.id,
        courseId: courseId || null,
      },
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating the ticket.' },
      { status: 500 }
    );
  }
}

// GET → دریافت لیست تیکت‌ها
export async function GET(req) {
  try {
    const authUser = getAuthUser();
    if (!authUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;

    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('perPage') || '10', 10);
    const skip = (page - 1) * perPage;

    const [tickets, total] = await Promise.all([
      prismadb.ticket.findMany({
        where: { userId: authUser.id },
        skip,
        take: perPage,
        orderBy: { updatedAt: 'desc' },
        select: {
          id: true,
          title: true,
          status: true,
          updatedAt: true,
        },
      }),
      prismadb.ticket.count({ where: { userId: authUser.id } }),
    ]);

    return NextResponse.json({
      tickets,
      currentPage: page,
      totalPages: Math.ceil(total / perPage),
      total,
    });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    );
  }
}
