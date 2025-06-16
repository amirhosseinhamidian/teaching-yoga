import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prismadb from '@/libs/prismadb';
import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
  const { shortAddress } = params;

  const session = await getServerSession(authOptions);
  const userId = session?.user?.userId || null;

  if (!userId) {
    return NextResponse.json(
      { error: 'User not authenticated.' },
      { status: 401 },
    );
  }

  try {
    // بررسی مالکیت دوره
    const userCourse = await prismadb.userCourse.findFirst({
      where: {
        userId,
        course: {
          shortAddress,
        },
        status: 'ACTIVE',
      },
      include: {
        course: {
          include: {
            courseTerms: {
              orderBy: { termId: 'asc' },
              include: {
                term: {
                  include: {
                    sessions: {
                      where: {
                        isActive: true,
                        OR: [
                          {
                            type: 'VIDEO',
                            video: {
                              isNot: null,
                            },
                          },
                          {
                            type: 'AUDIO',
                            audio: {
                              isNot: null,
                            },
                          },
                        ],
                      },
                      orderBy: { order: 'asc' },
                      take: 1, // فقط اولین جلسه فعال با مدیا معتبر
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

    const firstTerm = userCourse.course.courseTerms[0]?.term;

    if (!firstTerm || firstTerm.sessions.length === 0) {
      return NextResponse.json(
        { error: 'No valid session found for this course.' },
        { status: 404 },
      );
    }

    const firstSession = firstTerm.sessions[0];

    return NextResponse.json({
      sessionId: firstSession.id,
      sessionType: firstSession.type,
    });
  } catch (error) {
    console.error('Error fetching first session:', error);
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 },
    );
  }
}
