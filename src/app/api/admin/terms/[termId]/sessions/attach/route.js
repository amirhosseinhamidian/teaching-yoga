import { NextResponse } from 'next/server'
import prismadb from '@/libs/prismadb'

export async function POST(req, { params }) {
  const { termId } = params

  try {
    const { sessionId } = await req.json()

    const termIdInt = parseInt(termId, 10)

    if (!termIdInt) {
      return NextResponse.json(
        { error: 'شناسه ترم معتبر نیست.' },
        { status: 400 }
      )
    }

    if (!sessionId || typeof sessionId !== 'string') {
      return NextResponse.json(
        { error: 'شناسه جلسه معتبر نیست.' },
        { status: 400 }
      )
    }

    // -------------------------------------------------------
    // چک وجود ترم و جلسه
    // -------------------------------------------------------
    const [term, session] = await Promise.all([
      prismadb.term.findUnique({ where: { id: termIdInt } }),

      prismadb.session.findUnique({
        where: { id: sessionId },
        include: { video: true, audio: true },
      }),
    ])

    if (!term)
      return NextResponse.json({ error: 'ترم یافت نشد.' }, { status: 404 })
    if (!session)
      return NextResponse.json({ error: 'جلسه یافت نشد.' }, { status: 404 })

    // -------------------------------------------------------
    // جلوگیری از اتصال تکراری
    // -------------------------------------------------------
    const existing = await prismadb.sessionTerm.findFirst({
      where: {
        termId: termIdInt,
        sessionId,
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'این جلسه قبلاً در این ترم وجود دارد.' },
        { status: 400 }
      )
    }

    // -------------------------------------------------------
    // تعیین order جدید (آخرین شماره + 1)
    // -------------------------------------------------------
    const last = await prismadb.sessionTerm.findFirst({
      where: { termId: termIdInt },
      orderBy: { order: 'desc' },
    })

    const nextOrder = (last?.order || 0) + 1

    // -------------------------------------------------------
    // ایجاد SessionTerm جدید
    // -------------------------------------------------------
    const sessionTerm = await prismadb.sessionTerm.create({
      data: {
        termId: termIdInt,
        sessionId,
        order: nextOrder,
      },
    })

    // -------------------------------------------------------
    // خروجی سازگار با فرانت
    // -------------------------------------------------------
    return NextResponse.json(
      {
        id: session.id,
        name: session.name,
        type: session.type,
        duration: session.duration,
        isActive: session.isActive,
        termId: termIdInt,
        order: nextOrder,
        video: session.video || null,
        audio: session.audio || null,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error attaching session:', error)
    return NextResponse.json(
      { error: 'خطا در اتصال جلسه به ترم.' },
      { status: 500 }
    )
  }
}
