import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { toAbsoluteMediaUrl } from '@/server/media/absolute-url';

export async function GET() {
  try {
    const users = await prismadb.user.findMany({
      orderBy: {
        createAt: 'desc',
      },
    });

    return NextResponse.json({
      users: users.map((user) => ({
        ...user,
        avatar: toAbsoluteMediaUrl(user.avatar),
      })),
    });
  } catch (error) {
    console.error('Error fetching all users:', error);

    return NextResponse.json(
      {
        error: 'خطا در دریافت کاربران',
      },
      {
        status: 500,
      }
    );
  }
}
