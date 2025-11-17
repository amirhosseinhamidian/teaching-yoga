import prismadb from '@/libs/prismadb'
import { NextResponse } from 'next/server'

export async function POST(req, { params }) {
  const { termId } = params
  const data = await req.json()

  try {
    const termIdNum = parseInt(termId)

    // تعداد جلسات موجود در این ترم
    const sessionCount = await prismadb.sessionTerm.count({
      where: { termId: termIdNum },
    })

    const newOrder = sessionCount + 1

    // ======================================================
    //  حالت اول — ایجاد جلسه جدید
    // ======================================================
    if (data.mode === 'new') {
      const { name, duration, type } = data

      const newSession = await prismadb.session.create({
        data: {
          name,
          duration,
          type,
          isActive: false,
        },
      })

      await prismadb.sessionTerm.create({
        data: {
          termId: termIdNum,
          sessionId: newSession.id,
          order: newOrder,
        },
      })

      return NextResponse.json(
        { message: 'جلسه جدید اضافه شد', session: newSession },
        { status: 201 }
      )
    }

    // ======================================================
    //  حالت دوم — انتخاب جلسه موجود
    // ======================================================
    if (data.mode === 'existing') {
      const { sessionId } = data

      // جلوگیری از اضافه کردن تکراری
      const exists = await prismadb.sessionTerm.findFirst({
        where: { termId: termIdNum, sessionId },
      })

      if (exists) {
        return NextResponse.json(
          { error: 'این جلسه قبلاً به این ترم اضافه شده است.' },
          { status: 400 }
        )
      }

      await prismadb.sessionTerm.create({
        data: {
          termId: termIdNum,
          sessionId,
          order: newOrder,
        },
      })

      return NextResponse.json(
        { message: 'جلسه موجود با موفقیت به ترم اضافه شد.' },
        { status: 201 }
      )
    }

    return NextResponse.json(
      { error: "mode باید 'new' یا 'existing' باشد." },
      { status: 400 }
    )
  } catch (err) {
    console.error('Error adding session to term:', err)
    return NextResponse.json({ error: 'خطا در افزودن جلسه' }, { status: 500 })
  }
}

export async function GET(req, { params }) {
  const { termId } = params

  try {
    const termIdInt = parseInt(termId, 10)
    if (!termIdInt) {
      return NextResponse.json(
        { error: 'شناسه ترم معتبر نیست.' },
        { status: 400 }
      )
    }

    // -----------------------------------------------------
    // لود جلسات بر اساس SessionTerm
    // -----------------------------------------------------
    const sessionTerms = await prismadb.sessionTerm.findMany({
      where: { termId: termIdInt },
      include: {
        session: {
          include: {
            video: true,
            audio: true,
          },
        },
      },
      orderBy: { order: 'asc' },
    })

    // -----------------------------------------------------
    // تبدیل خروجی به فرمت مورد انتظار فرانت
    // -----------------------------------------------------
    const formattedSessions = sessionTerms.map((st) => ({
      id: st.session.id,
      name: st.session.name,
      type: st.session.type,
      duration: st.session.duration,
      isActive: st.session.isActive,
      termId: st.termId,
      order: st.order,
      video: st.session.video || null,
      audio: st.session.audio || null,
    }))

    return NextResponse.json(formattedSessions, { status: 200 })
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions.' },
      { status: 500 }
    )
  }
}
