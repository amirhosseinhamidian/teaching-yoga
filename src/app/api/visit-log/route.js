import prisma from '@/libs/prismadb';
import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.socket.remoteAddress;
    const { userAgent, pageUrl, referrer } = await req.json();

    // ذخیره اطلاعات بازدید در پایگاه داده
    await prisma.visitLog.create({
      data: {
        ipAddress: ip,
        userAgent,
        pageUrl,
        referrer,
      },
    });

    return NextResponse.json(
      { message: 'Visit logged successfully' },
      { status: 200 },
    );
  } catch (error) {
    console.error('Error logging visit:', error);
    return NextResponse.json({ error: 'Failed to log visit' }, { status: 500 });
  }
}
