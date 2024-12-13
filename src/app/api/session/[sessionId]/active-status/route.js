import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

export async function PATCH(req, { params }) {
  try {
    const { sessionId } = params;

    // دریافت مقدار فعلی isActive
    const session = await prismadb.session.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return NextResponse.json(
        { message: 'Session not found' },
        { status: 404 },
      );
    }

    // تغییر مقدار isActive
    const updatedSession = await prismadb.session.update({
      where: { id: sessionId },
      data: { isActive: !session.isActive },
    });

    return NextResponse.json(
      {
        message: 'Session updated successfully',
        session: updatedSession,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error toggling session active status:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
