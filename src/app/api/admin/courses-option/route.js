import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const courses = await prismadb.course.findMany({
      select: {
        id: true,
        title: true,
        subtitle: true,
        cover: true,
        shortAddress: true,
        activeStatus: true,
      },
      orderBy: {
        title: 'asc',
      },
    });

    return NextResponse.json(courses, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Something went wrong' },
      { status: 500 }
    );
  }
}
