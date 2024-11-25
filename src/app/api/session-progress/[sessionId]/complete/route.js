import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

export async function POST(req, { params }) {
  const { sessionId } = params;
  const requestHeaders = new Headers(req.headers);
  const userId = requestHeaders.get('userid');
  if (!userId) {
    return NextResponse.json(
      { message: 'User ID is required' },
      { status: 400 },
    );
  }

  try {
    // اگر رکورد موجود باشد آن را آپدیت می‌کند، و اگر موجود نباشد، رکورد جدید ایجاد می‌کند
    const sessionProgress = await prismadb.sessionProgress.upsert({
      where: {
        userId_sessionId: {
          userId: userId,
          sessionId: sessionId,
        },
      },
      update: {
        isCompleted: true,
      },
      create: {
        userId: userId,
        sessionId: sessionId,
        isCompleted: true,
      },
    });

    return NextResponse.json(sessionProgress);
  } catch (error) {
    console.error('Error completing session:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 },
    );
  }
}

export async function GET(req, { params }) {
  const { sessionId } = params;
  const requestHeaders = new Headers(req.headers);
  const userId = requestHeaders.get('userid');

  if (!userId) {
    return NextResponse.json(
      { message: 'User ID is required' },
      { status: 400 },
    );
  }

  try {
    // پیدا کردن رکورد وضعیت تکمیل ویدیو در دیتابیس
    const sessionProgress = await prismadb.sessionProgress.findUnique({
      where: {
        userId_sessionId: {
          userId,
          sessionId,
        },
      },
    });

    // اگر رکوردی پیدا شد، وضعیت تکمیل را ارسال می‌کنیم
    if (sessionProgress) {
      return NextResponse.json({
        isCompleted: sessionProgress.isCompleted,
      });
    }

    // اگر رکوردی پیدا نشد، پاسخ مناسب برمی‌گردانیم
    return NextResponse.json({ isCompleted: false });
  } catch (error) {
    console.error('Error fetching video completion status:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
