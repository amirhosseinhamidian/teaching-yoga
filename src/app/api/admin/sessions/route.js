import { NextResponse } from 'next/server'
import prismadb from '@/libs/prismadb'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  try {
    const { searchParams } = request.nextUrl

    const termId = parseInt(searchParams.get('termId') || '-1', 10)
    const courseId = parseInt(searchParams.get('courseId') || '-1', 10)
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const perPage = parseInt(searchParams.get('perPage') || '10', 10)

    const skip = (page - 1) * perPage

    // -----------------------------
    // ساخت شرط WHERE
    // -----------------------------
    const whereConditions = {
      AND: [
        search
          ? {
              name: {
                contains: search,
                mode: 'insensitive',
              },
            }
          : {},

        termId !== -1
          ? {
              sessionTerms: {
                some: { termId },
              },
            }
          : {},

        courseId !== -1
          ? {
              sessionTerms: {
                some: {
                  term: {
                    courseTerms: {
                      some: { courseId },
                    },
                  },
                },
              },
            }
          : {},
      ],
    }

    // -----------------------------
    // واکشی جلسات
    // -----------------------------
    const sessions = await prismadb.session.findMany({
      where: whereConditions,
      skip,
      take: perPage,
      include: {
        video: true,
        audio: true,
        sessionTerms: {
          include: {
            term: {
              include: {
                courseTerms: {
                  include: {
                    course: { select: { title: true } },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createAt: 'desc' },
    })

    const totalCount = await prismadb.session.count({ where: whereConditions })

    // -----------------------------
    // تبدیل خروجی به ساختار درست
    // -----------------------------
    const normalizedData = sessions.map((session) => {
      const terms = session.sessionTerms.map((st) => ({
        termId: st.term.id,
        termName: st.term.name,
        courseTitles: st.term.courseTerms
          .map((ct) => ct.course.title)
          .join(', '),
      }))

      return {
        sessionId: session.id,
        type: session.type,
        sessionName: session.name,
        sessionDuration: session.duration,
        sessionIsFree: session.isFree,
        sessionIsActive: session.isActive,

        videoKey: session?.video?.videoKey || null,
        videoId: session?.video?.id || null,
        videoAccessLevel: session?.video?.accessLevel || null,
        videoCreatedAt: session?.video?.createAt || null,

        audioKey: session?.audio?.audioKey || null,
        audioId: session?.audio?.id || null,
        audioAccessLevel: session?.audio?.accessLevel || null,
        audioCreatedAt: session?.audio?.createAt || null,

        terms, // ← یک بار، در یک آرایه
      }
    })

    return NextResponse.json({
      message: 'اطلاعات با موفقیت بارگذاری شد.',
      data: normalizedData,
      pagination: {
        currentPage: page,
        perPage,
        totalCount,
        totalPages: Math.ceil(totalCount / perPage),
      },
    })
  } catch (error) {
    console.error('Error fetching paginated sessions:', error)
    return NextResponse.json(
      { error: 'خطا در دریافت اطلاعات.' },
      { status: 500 }
    )
  }
}

export async function PUT(req) {
  try {
    const { sessionId, name, duration, accessLevel, type, termIds } =
      await req.json()

    // ===============================
    // Validation
    // ===============================
    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json(
        { error: 'شناسه جلسه معتبر نیست.' },
        { status: 400 }
      )
    }

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'عنوان جلسه معتبر نیست.' },
        { status: 400 }
      )
    }

    if (!duration || typeof duration !== 'number' || duration <= 0) {
      return NextResponse.json(
        { error: 'مدت زمان باید معتبر باشد.' },
        { status: 400 }
      )
    }

    if (
      !accessLevel ||
      !['PUBLIC', 'REGISTERED', 'PURCHASED'].includes(accessLevel)
    ) {
      return NextResponse.json(
        { error: 'سطح دسترسی معتبر نیست.' },
        { status: 400 }
      )
    }

    if (!Array.isArray(termIds)) {
      return NextResponse.json(
        { error: 'ترم‌ها باید در قالب آرایه باشند.' },
        { status: 400 }
      )
    }

    // ===============================
    // دریافت جلسه
    // ===============================
    const session = await prismadb.session.findUnique({
      where: { id: sessionId },
      include: {
        video: true,
        audio: true,
        sessionTerms: true,
      },
    })

    if (!session) {
      return NextResponse.json(
        { error: 'جلسه‌ای با این شناسه یافت نشد.' },
        { status: 404 }
      )
    }

    // ===============================
    // ساختن آپدیت دیتای اصلی
    // ===============================
    const updateData = {
      name,
      duration,
      sessionTerms: {
        deleteMany: {}, // پاکسازی تمام ترم‌های قبلی
        create: termIds.map((tid) => ({ termId: tid })), // ثبت ترم‌های جدید
      },
    }

    // ===============================
    // تنظیم سطح دسترسی ویدیو/صوت
    // ===============================
    if (type === 'VIDEO' && session.video) {
      updateData.video = {
        update: { accessLevel },
      }
    }

    if (type === 'AUDIO' && session.audio) {
      updateData.audio = {
        update: { accessLevel },
      }
    }

    // ===============================
    // انجام آپدیت
    // ===============================
    const updatedSession = await prismadb.session.update({
      where: { id: sessionId },
      data: updateData,
      include: {
        video: true,
        audio: true,
        sessionTerms: {
          include: {
            term: { select: { id: true, name: true } },
          },
        },
      },
    })

    // ===============================
    // آماده‌سازی خروجی ساختار جدید
    // ===============================
    const formattedSession = {
      id: updatedSession.id,
      name: updatedSession.name,
      duration: updatedSession.duration,
      type: type,
      video: updatedSession.video,
      audio: updatedSession.audio,

      terms: updatedSession.sessionTerms.map((st) => ({
        termId: st.term.id,
        termName: st.term.name,
      })),

      accessLevel:
        updatedSession.video?.accessLevel ||
        updatedSession.audio?.accessLevel ||
        null,
    }

    return NextResponse.json(
      {
        message: 'جلسه با موفقیت بروزرسانی شد.',
        updatedSession: formattedSession,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error updating session:', error)
    return NextResponse.json(
      { error: 'خطا در بروزرسانی جلسه.' },
      { status: 500 }
    )
  }
}

export async function POST(req) {
  try {
    const { name, duration, type } = await req.json()

    // ------------------------------
    // validation
    // ------------------------------
    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'عنوان جلسه معتبر نیست.' },
        { status: 400 }
      )
    }

    if (!duration || isNaN(Number(duration)) || Number(duration) <= 0) {
      return NextResponse.json(
        { error: 'مدت زمان جلسه معتبر نیست.' },
        { status: 400 }
      )
    }

    if (!type || !['VIDEO', 'AUDIO'].includes(type)) {
      return NextResponse.json(
        { error: 'نوع جلسه معتبر نیست. (VIDEO یا AUDIO)' },
        { status: 400 }
      )
    }

    // ------------------------------
    // Session ایجاد
    // ------------------------------
    const newSession = await prismadb.session.create({
      data: {
        name,
        duration: Number(duration),
        type,
        isActive: true,
      },
    })

    return NextResponse.json(newSession, { status: 201 })
  } catch (e) {
    console.error('Error creating session:', e)
    return NextResponse.json({ error: 'خطا در ساخت جلسه.' }, { status: 500 })
  }
}
