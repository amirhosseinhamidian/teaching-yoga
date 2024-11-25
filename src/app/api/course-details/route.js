import { NextResponse } from 'next/server';
import prismadb from '@/libs/prismadb';

// Handler for GET request to fetch course details with terms, sessions, and progress data
export async function GET(request) {
  // Parse course short address from query parameters
  const { searchParams } = new URL(request.url);
  const shortAddress = searchParams.get('shortAddress');

  if (!shortAddress) {
    return NextResponse.json(
      { error: 'Course short address is required' },
      { status: 400 },
    );
  }

  try {
    // Fetch course details including terms and sessions
    const course = await prismadb.course.findUnique({
      where: { shortAddress },
      select: {
        id: true,
        title: true,
        cover: true,
        instructor: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    return NextResponse.json(course, { status: 200 });
  } catch (error) {
    console.error('Error fetching course details:', error);
    return NextResponse.json(
      { error: 'Failed to fetch course details' },
      { status: 500 },
    );
  }
}
