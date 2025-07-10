import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
  const { courseId } = params;

  const numericCourseId = parseInt(courseId, 10);
  if (isNaN(numericCourseId)) {
    return NextResponse.json(
      { success: false, message: 'Course ID must be a number' },
      { status: 400 },
    );
  }

  try {
    const course = await prismadb.course.findUnique({
      where: {
        id: numericCourseId,
      },
      select: {
        id: true,
        title: true,
        cover: true,
        shortAddress: true,
      },
    });

    if (!course) {
      return NextResponse.json(
        { success: false, message: 'Course not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: course });
  } catch (error) {
    console.error('[GET COURSE]', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 },
    );
  }
}
