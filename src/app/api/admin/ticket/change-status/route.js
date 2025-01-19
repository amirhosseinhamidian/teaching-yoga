import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
export async function PUT(request) {
  const id = request.headers.get('id');
  const newStatus = request.headers.get('status');
  if (!id) {
    return NextResponse.json(
      { message: 'ID is required in the header' },
      { status: 400 },
    );
  }

  if (!newStatus) {
    return NextResponse.json(
      { message: 'New status is required in the header' },
      { status: 400 },
    );
  }
  const validStatuses = [
    'PENDING',
    'IN_PROGRESS',
    'ANSWERED',
    'OPEN',
    'CLOSED',
  ];
  if (!validStatuses.includes(newStatus)) {
    return NextResponse.json({ message: 'Invalid status' }, { status: 400 });
  }
  try {
    const updatedTicket = await prismadb.ticket.update({
      where: { id: parseInt(id) },
      data: {
        status: newStatus,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(updatedTicket, { status: 200 });
  } catch (error) {
    console.error('Error updating ticket status:', error);
    return NextResponse.json(
      { message: 'An error occurred while updating the ticket status' },
      { status: 500 },
    );
  }
}
