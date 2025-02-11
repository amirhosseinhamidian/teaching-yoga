import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.userId;

    const body = await req.json();
    const { title, description, courseId } = body;
    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title, description, and userId are required.' },
        { status: 400 },
      );
    }

    const ticket = await prismadb.ticket.create({
      data: {
        title,
        description,
        userId,
        courseId: courseId || null, // اگر courseId وجود نداشت، مقدار null تنظیم می‌شود
      },
    });
    return NextResponse.json(ticket, { status: 201 });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating the ticket.' },
      { status: 500 },
    );
  }
}

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = req.nextUrl;

    const userId = session.user.userId;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = parseInt(searchParams.get('perPage') || '10', 10);
    const skip = (page - 1) * perPage;

    const tickets = await prismadb.ticket.findMany({
      where: { userId },
      skip,
      take: perPage,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
      },
    });

    const totalCount = await prismadb.ticket.count({
      where: { userId },
    });

    // ساختار داده بازگشتی
    const result = {
      tickets,
      currentPage: page,
      totalPages: Math.ceil(totalCount / perPage),
      totalCount,
    };

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error('Error fetching tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 },
    );
  }
}
