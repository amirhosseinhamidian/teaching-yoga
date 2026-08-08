import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { normalizeMediaUrl } from '@/server/media/normalize-media-url';

export async function GET(request, { params }) {
  const { id } = params;

  try {
    if (!id) {
      return NextResponse.json(
        { error: 'Ticket ID is required' },
        { status: 400 }
      );
    }
    // واکشی اطلاعات تیکت به همراه پاسخ‌ها
    const ticket = await prismadb.ticket.findUnique({
      where: { id: parseInt(id) }, // تبدیل id به عدد
      include: {
        ticketReplies: {
          orderBy: {
            createdAt: 'desc',
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
        },
        user: {
          select: {
            avatar: true,
            username: true,
            firstname: true,
            lastname: true,
            phone: true,
          },
        },
        course: {
          select: {
            title: true,
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { message: 'Ticket not found' },
        { status: 404 }
      );
    }

    const formattedTicket = {
      ...ticket,
      user: ticket.user
        ? {
            ...ticket.user,
            avatar: normalizeMediaUrl(ticket.user.avatar),
          }
        : null,
      ticketReplies: Array.isArray(ticket.ticketReplies)
        ? ticket.ticketReplies.map((reply) => ({
            ...reply,
            user: reply.user
              ? {
                  ...reply.user,
                  avatar: normalizeMediaUrl(reply.user.avatar),
                }
              : null,
          }))
        : [],
    };

    return NextResponse.json(formattedTicket, { status: 200 });
  } catch (error) {
    console.error('Error fetching ticket:', error);
    return NextResponse.json(
      { message: 'An error occurred while fetching the ticket' },
      { status: 500 }
    );
  }
}
