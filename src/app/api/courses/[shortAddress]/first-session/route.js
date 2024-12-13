import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prismadb from '@/libs/prismadb';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
  const { shortAddress } = params;
  // Get the session and extract the userId
  const session = await getServerSession(authOptions);
  const userId = session?.user?.userId || null;
  if (!userId) {
    return NextResponse.json(
      { error: 'User not authenticated.' },
      { status: 401 },
    );
  }

  try {
    // بررسی اینکه آیا کاربر دوره را خریداری کرده است
    const userCourse = await prismadb.userCourse.findFirst({
      where: {
        userId: userId,
        course: { shortAddress },
      },
      include: {
        course: {
          include: {
            courseTerms: {
              orderBy: { termId: 'asc' }, // Order by termId or another field based on your requirement
              include: {
                term: {
                  include: {
                    sessions: {
                      orderBy: { order: 'asc' }, // Order sessions by their order field
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!userCourse) {
      return NextResponse.json(
        { error: 'User has not purchased this course.' },
        { status: 403 },
      );
    }
    // پیدا کردن اولین جلسه اولین ترم
    const firstTerm = userCourse.course.courseTerms[0].term; // اولین ترم
    if (!firstTerm || firstTerm.sessions.length === 0) {
      return NextResponse.json(
        { error: 'No sessions found in the course.' },
        { status: 404 },
      );
    }
    const firstSession = firstTerm.sessions[0]; // اولین جلسه اولین ترم

    return NextResponse.json({
      sessionId: firstSession.id,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 },
    );
  }
}
