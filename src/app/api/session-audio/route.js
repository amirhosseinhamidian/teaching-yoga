import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export async function POST(request) {
  try {
    const { audioKey, accessLevel, sessionId } = await request.json();

    const newSessionAudio = await prismadb.sessionAudio.create({
      data: {
        audioKey,
        accessLevel,
        session: { connect: { id: sessionId } },
      },
    });

    await prismadb.session.update({
      where: { id: sessionId },
      data: { isActive: true },
    });

    return NextResponse.json({ data: newSessionAudio });
  } catch (error) {
    console.error('Error saving session audio:', error);
    return NextResponse.json(
      { error: 'Error saving session audio' },
      { status: 500 },
    );
  }
}

export async function PUT(request) {
  try {
    const { audioKey, accessLevel, sessionId, audioId } = await request.json();

    if (!audioId || !sessionId) {
      return NextResponse.json(
        { error: 'Audio ID and Session ID are required' },
        { status: 400 },
      );
    }

    const updatedAudio = await prismadb.sessionAudio.update({
      where: { id: audioId },
      data: {
        audioKey,
        accessLevel,
        session: { connect: { id: sessionId } },
      },
    });

    await prismadb.session.update({
      where: { id: sessionId },
      data: { isActive: true },
    });

    return NextResponse.json({ data: updatedAudio });
  } catch (error) {
    console.error('Error updating session audio:', error);
    return NextResponse.json(
      { error: 'Error updating session audio' },
      { status: 500 },
    );
  }
}
