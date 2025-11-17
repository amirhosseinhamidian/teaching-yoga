import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import prismadb from '@/libs/prismadb'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

export async function GET(req, { params }) {
  const { shortAddress } = params

  const session = await getServerSession(authOptions)
  const userId = session?.user?.userId || null

  if (!userId) {
    return NextResponse.json(
      { error: 'User not authenticated.' },
      { status: 401 }
    )
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
                    sessionTerms: {
                      include: {
                        session: true, // ❗ بدون فیلتر (Prisma اجازه فیلتر اینجا را نمی‌دهد)
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!userCourse) {
      return NextResponse.json(
        { error: 'User has not purchased this course.' },
        { status: 403 }
      )
    }

    const terms = userCourse.course.courseTerms.map((ct) => ct.term)

    // 🔎 پیدا کردن اولین سشن معتبر داخل جاوااسکریپت
    let firstValidSession = null

    for (const term of terms) {
      for (const st of term.sessionTerms) {
        const s = st.session

        if (
          s &&
          s.isActive &&
          ((s.type === 'VIDEO' && s.videoId) ||
            (s.type === 'AUDIO' && s.audioId))
        ) {
          firstValidSession = s
          break
        }
      }
      if (firstValidSession) break
    }

    if (!firstValidSession) {
      return NextResponse.json(
        { error: 'No valid session found for this course.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      sessionId: firstValidSession.id,
      sessionType: firstValidSession.type,
    })
  } catch (error) {
    console.error('Error fetching first session:', error)
    return NextResponse.json(
      { error: 'Internal server error.' },
      { status: 500 }
    )
  }
}
