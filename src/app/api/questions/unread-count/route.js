import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export async function GET(request) {
  try {
    const userId = request.headers.get('user-id'); // یا از context یا session
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 },
      );
    }

    // شمارش سوالات خوانده نشده برای کاربر
    const unreadCount = await prismadb.question.count({
      where: {
        userId: userId,
        isReadByUser: false,
      },
    });

    return NextResponse.json({ unreadCount });
  } catch (error) {
    console.error('Error fetching unread questions:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
