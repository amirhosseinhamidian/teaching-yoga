import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';
import { PENDING } from '@/constants/ticketStatus';

export async function POST(request, { params }) {
  try {
    const authUser = getAuthUser();
    if (!authUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const ticketId = parseInt(params.id);
    if (!ticketId) {
      return NextResponse.json(
        { error: 'Invalid ticket ID.' },
        { status: 400 }
      );
    }

    const { content, status } = await request.json();

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'Reply content cannot be empty.' },
        { status: 400 }
      );
    }

    // 🛡 چک کنیم آیا این تیکت مال همین کاربر است
    const existingTicket = await prismadb.ticket.findUnique({
      where: { id: ticketId },
      select: { userId: true },
    });

    if (!existingTicket) {
      return NextResponse.json({ error: 'Ticket not found.' }, { status: 404 });
    }

    if (existingTicket.userId !== authUser.id) {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    // 📌 ایجاد پیام جدید
    const ticketReply = await prismadb.ticketReply.create({
      data: {
        ticketId,
        content,
        userId: authUser.id,
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

    // 📌 بروزرسانی وضعیت تیکت
    await prismadb.ticket.update({
      where: { id: ticketId },
      data: {
        status: status || PENDING,
      },
    });

    return NextResponse.json(ticketReply, { status: 201 });
  } catch (error) {
    console.error('Error creating ticket reply:', error);
    return NextResponse.json(
      { error: 'An error occurred while creating the reply.' },
      { status: 500 }
    );
  }
}
