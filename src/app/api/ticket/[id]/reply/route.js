import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { PENDING } from '@/constants/ticketStatus';

export async function POST(request, { params }) {
  try {
    const { id } = params;
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.userId;
    const body = await request.json();
    const { content, status } = body;
    const ticketReply = await prismadb.ticketReply.create({
      data: {
        ticketId: parseInt(id),
        content,
        userId,
      },
      include: {
        user: {
          select: {
            avatar: true,
            username: true,
            firstname: true,
            lastname: true,
          },
        },
      },
    });
    await prismadb.ticket.update({
      where: { id: parseInt(id) },
      data: { status: status ? status : PENDING },
    });
    return NextResponse.json(ticketReply, { status: 201 });
  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating the ticket.' },
      { status: 500 },
    );
  }
}
