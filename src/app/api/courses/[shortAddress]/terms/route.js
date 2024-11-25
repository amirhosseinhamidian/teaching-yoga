import prismadb from '@/libs/prismadb';
import { NextResponse } from 'next/server';

// بررسی دسترسی کاربر به ویدیوها و وضعیت خرید
export async function GET(req, { params }) {
  try {
    const { shortAddress } = params;
    const requestHeaders = new Headers(req.headers);
    const userId = requestHeaders.get('userid');

    // Fetch terms
    const terms = await prismadb.course.findUnique({
      where: { shortAddress },
      select: {
        terms: {
          include: {
            sessions: {
              orderBy: {
                order: 'asc',
              },
              include: {
                video: true,
                sessionProgress: {
                  where: {
                    userId, // Filter sessionProgress by userId
                  },
                  select: {
                    isCompleted: true, // Only fetch completion status
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!terms) {
      return NextResponse.json(
        { message: 'Course not found' },
        { status: 404 },
      );
    }

    // Check if user has purchased the course
    const userCourse = await prismadb.userCourse.findFirst({
      where: {
        userId,
        courseId: terms.courseId,
        status: 'ACTIVE',
      },
    });
    // Add access control for each session video
    terms.terms.forEach((term) => {
      term.sessions.forEach((session) => {
        const { video } = session;
        if (video) {
          if (video.accessLevel === 'PUBLIC') {
            session.access = 'PUBLIC';
          } else if (video.accessLevel === 'REGISTERED') {
            session.access = userId ? 'REGISTERED' : 'NO_ACCESS';
          } else if (video.accessLevel === 'PURCHASED') {
            session.access = userCourse ? 'PURCHASED' : 'NO_ACCESS';
          }
        }
      });
    });

    return NextResponse.json(terms, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 },
    );
  }
}
