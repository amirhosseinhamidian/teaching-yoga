import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('userId');
    const shortAddress = searchParams.get('shortAddress');

    if (!userId || !shortAddress) {
      return NextResponse.json(
        { error: 'Missing userId or shortAddress' },
        { status: 400 },
      );
    }

    const hasPurchased = await prismadb.userCourse.findFirst({
      where: {
        userId: userId,
        course: {
          shortAddress,
        },
      },
    });

    // Return 403 if the course is not purchased
    if (!hasPurchased) {
      return NextResponse.json(
        { error: 'Access denied. Course not purchased.' },
        { status: 403 },
      );
    }

    // Return 200 if the course is purchased
    return NextResponse.json({ purchased: true }, { status: 200 });
  } catch (error) {
    console.error('Error checking purchase:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
