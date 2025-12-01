import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // دریافت کاربر از JWT
    const authUser = getAuthUser();

    if (!authUser?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = authUser.id;

    // شمارش سوالات خوانده نشده
    const unreadCount = await prismadb.question.count({
      where: {
        userId,
        isReadByUser: false,
      },
    });

    return NextResponse.json({ unreadCount });
  } catch (error) {
    console.error('Error fetching unread questions:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
