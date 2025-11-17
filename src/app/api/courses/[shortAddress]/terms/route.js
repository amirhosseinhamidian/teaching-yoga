import prismadb from '@/libs/prismadb'
import { NextResponse } from 'next/server'

export async function GET(req, { params }) {
  try {
    const { shortAddress } = params
    const requestHeaders = new Headers(req.headers)
    const userId = requestHeaders.get('userid')

    // دریافت دوره با ترم‌ها و sessionTerms → session
    const course = await prismadb.course.findUnique({
      where: { shortAddress },
      include: {
        courseTerms: {
          include: {
            term: {
              include: {
                sessionTerms: {
                  include: {
                    session: {
                      include: {
                        video: true,
                        audio: true,
                        sessionProgress: {
                          where: { userId },
                          select: { isCompleted: true },
                        },
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

    if (!course) {
      return NextResponse.json({ message: 'Course not found' }, { status: 404 })
    }

    // تبدیل SessionTerm به sessions[]
    course.courseTerms.forEach((ct) => {
      const term = ct.term

      term.sessions = term.sessionTerms
        .map((st) => st.session)
        .filter((s) => s && s.isActive) // فیلتر جلسات فعال
        .sort((a, b) => a.order - b.order)
    })

    // بررسی خرید دوره
    const userCourse = await prismadb.userCourse.findFirst({
      where: {
        userId,
        courseId: course.id,
        status: 'ACTIVE',
      },
    })

    // تعیین سطح دسترسی مانند قبل
    course.courseTerms.forEach((ct) => {
      ct.term.sessions.forEach((session) => {
        const media = session.video || session.audio

        if (!media) {
          session.access = 'NO_ACCESS'
          return
        }

        if (media.accessLevel === 'PUBLIC') {
          session.access = 'PUBLIC'
        } else if (media.accessLevel === 'REGISTERED') {
          session.access = userId ? 'REGISTERED' : 'NO_ACCESS'
        } else if (media.accessLevel === 'PURCHASED') {
          session.access = userCourse ? 'PURCHASED' : 'NO_ACCESS'
        }
      })
    })

    return NextResponse.json(course, { status: 200 })
  } catch (error) {
    console.error('Error in course detail API:', error)
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
