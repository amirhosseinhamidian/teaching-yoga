// app/api/admin/subscription/courses/route.js
import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';
import { getAuthUser } from '@/utils/getAuthUser';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = getAuthUser();

    if (
      !user ||
      !user.id ||
      (user.role !== 'ADMIN' && user.role !== 'MANAGER')
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const courses = await prismadb.course.findMany({
      select: {
        id: true,
        title: true,
        shortAddress: true,
        activeStatus: true,
      },
      orderBy: {
        createAt: 'desc',
      },
    });

    return NextResponse.json(courses, { status: 200 });
  } catch (error) {
    console.error('[ADMIN_SUBSCRIPTION_COURSES_GET]', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
